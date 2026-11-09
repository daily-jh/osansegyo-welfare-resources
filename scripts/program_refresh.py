"""Apply reviewed official notices, never scrape through access restrictions.

Failed attempts change only lastAttemptAt/lastError of that source. Successful
partial batches upsert notices; absence from a list is never a deletion signal.
"""
import argparse
import copy
import csv
import datetime as dt
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
KST = dt.timezone(dt.timedelta(hours=9))


def timestamp(value):
    result = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timezone required')
    return result.astimezone(KST)


def run_scope(at, previous_at=None):
    """First actual run in each Korean calendar month includes monthly review.

    Call BEFORE recording any attempt. Pass the previous whole-run timestamp,
    not a per-source success time; a skipped Monday does not skip monthly work.
    """
    now = timestamp(at)
    if previous_at and timestamp(previous_at) > now:
        raise ValueError('Previous run is in the future')
    monthly = not previous_at or timestamp(previous_at).strftime('%Y-%m') != now.strftime('%Y-%m')
    return {'programReview': True, 'resourceReview': monthly,
            'scope': 'monthly+weekly' if monthly else 'weekly',
            'month': now.strftime('%Y-%m')}


def norm(value):
    import unicodedata
    return ''.join(unicodedata.normalize('NFKC', value).split()).lower()


def official_url(value, config):
    u = urlsplit(value)
    return (u.scheme == 'https' and u.hostname in config['hosts'] and
            not u.username and not u.password and not u.port and
            not any(ord(c) < 32 or ord(c) == 127 for c in value))


def apply_attempt(feed, source_id, config, organizations, at, programs=None, error=None):
    when = timestamp(at)
    result = copy.deepcopy(feed)
    legacy = source_id == 'welinfo'
    state = result if legacy else result.setdefault('sources', {}).setdefault(source_id, {'sourceUrl': config['sourceUrl']})
    if state.get('lastAttemptAt') and when < timestamp(state['lastAttemptAt']):
        raise ValueError('Attempt predates the stored attempt')
    state['lastAttemptAt'] = at
    if error:
        state['lastError'] = str(error)
        return result
    try:
        if not isinstance(programs, list) or not programs:
            raise ValueError('Empty/unverified response is not a successful refresh')
        known = {p['id']: p for p in feed['programs']}
        batch_ids = set()
        for p in programs:
            if not isinstance(p, dict):
                raise ValueError('Notice must be an object')
            for key in ('id', 'organizationId', 'organization', 'title', 'target', 'method', 'summary', 'periodText', 'verifiedOn', 'sourceUrl'):
                if not isinstance(p.get(key), str) or not p[key].strip():
                    raise ValueError('Missing notice field: ' + key)
            if p.get('evidenceType') != 'official_notice' or not p.get('evidenceNote'):
                raise ValueError('Reviewed individual notice evidence required')
            if not official_url(p['sourceUrl'], config) or p.get('sourceId') != source_id:
                raise ValueError('Notice source does not match the reviewed source')
            if config.get('organizationId', p['organizationId']) != p['organizationId']:
                raise ValueError('Source organization mismatch')
            if norm(organizations.get(p['organizationId'], '')) != norm(p['organization']):
                raise ValueError('Existing institution ID/name mismatch')
            if dt.date.fromisoformat(p['verifiedOn']).isoformat() != p['verifiedOn'] or dt.date.fromisoformat(p['verifiedOn']) != when.date():
                raise ValueError('Notice must be reviewed on the attempt date')
            for key in ('opensOn', 'closesOn'):
                if p.get(key):
                    if not isinstance(p[key], str) or dt.date.fromisoformat(p[key]).isoformat() != p[key]:
                        raise ValueError('Invalid application date')
            if p.get('opensOn') and p.get('closesOn') and p['opensOn'] > p['closesOn']:
                raise ValueError('Reversed application dates')
            if p.get('status') not in ('모집중', '예정', '마감', '상시', '확인 필요'):
                raise ValueError('Unknown application status')
            if p['id'] in batch_ids:
                raise ValueError('Duplicate notice ID')
            batch_ids.add(p['id'])
            old = known.get(p['id'])
            if old and (old.get('sourceId', 'welinfo'), old['organizationId'], old['sourceUrl']) != (source_id, p['organizationId'], p['sourceUrl']):
                raise ValueError('Notice ID conflicts with an existing record')
        # Validate the complete batch before changing a single program.
        for p in programs:
            index = next((i for i, old in enumerate(result['programs']) if old['id'] == p['id']), None)
            if index is None:
                duplicate = any(old['organizationId'] == p['organizationId'] and old['sourceUrl'] == p['sourceUrl'] and norm(old['title']) == norm(p['title']) for old in result['programs'])
                if not duplicate:
                    result['programs'].append(copy.deepcopy(p))
            else:
                result['programs'][index] = copy.deepcopy(p)
        state['lastSuccessAt'] = at
        state['lastError'] = ''
    except (ValueError, KeyError, TypeError) as exc:
        state['lastError'] = '검증 실패: ' + str(exc)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--at', required=True)
    parser.add_argument('--plan', action='store_true')
    parser.add_argument('--previous-at')
    parser.add_argument('--source')
    choice = parser.add_mutually_exclusive_group()
    choice.add_argument('--input', type=Path, help='JSON array of individually reviewed notices')
    choice.add_argument('--error')
    args = parser.parse_args()
    if args.plan:
        print(json.dumps(run_scope(args.at, args.previous_at), ensure_ascii=False))
        return
    configs = json.loads((ROOT / 'data/program-sources.json').read_text(encoding='utf-8'))
    if args.source not in configs or not (args.input or args.error):
        parser.error('--source and --input or --error required')
    with (ROOT / 'data/organizations.csv').open(encoding='utf-8-sig', newline='') as f:
        organizations = {r['org_id']: r['기관명'] for r in csv.DictReader(f)}
    path = ROOT / 'docs/programs.json'
    feed = json.loads(path.read_text(encoding='utf-8'))
    programs, error = None, args.error
    if args.input:
        try:
            programs = json.loads(args.input.read_text(encoding='utf-8-sig'))
        except (OSError, ValueError) as exc:
            error = '입력 검증 실패: ' + str(exc)
    result = apply_attempt(feed, args.source, configs[args.source], organizations, args.at, programs, error)
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)
    state = result if args.source == 'welinfo' else result['sources'][args.source]
    print(json.dumps({'source': args.source, 'success': not bool(state.get('lastError')), 'programs': len(result['programs'])}, ensure_ascii=False))
    if state.get('lastError'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
