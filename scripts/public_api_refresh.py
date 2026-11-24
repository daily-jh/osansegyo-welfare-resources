#!/usr/bin/env python3
"""Collect public (data.go.kr etc.) welfare data and write CHANGE CANDIDATES only.

Rules
- Sources and region rules live in data/public-api-sources.json.
- 경기도 오산시 runs are required; 경기도 runs add province-wide items; 전국 runs keep
  only items that fall in a representative area (정신건강·위기청소년·쉼터·학대 ...).
- data/*.csv is never modified and nothing is marked '확인완료'. A person reviews
  docs/public-api/candidates.csv and edits the source tables by hand.
- API keys are read from environment variables named in the config and are never
  written to any output or error message.
- A failed source keeps its previous candidates; only lastAttemptAt/lastError change.

  python scripts/public_api_refresh.py                 # live run (needs keys)
  python scripts/public_api_refresh.py --fixtures DIR  # offline run from saved responses
  python scripts/public_api_refresh.py --strict        # exit 1 if a required 오산 run failed
"""
import argparse, csv, datetime as dt, difflib, io, json, os, re, sys, unicodedata
import urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KST = dt.timezone(dt.timedelta(hours=9))
OUT_COLUMNS = ['change', 'source', 'region', 'area', 'name', 'org', 'match_kind', 'match_id', 'match_name',
               'field_diffs', 'summary', 'address', 'phone', 'updated', 'link', 'api_id']
MATCH_RATIO = 0.86


def norm(value):
    value = unicodedata.normalize('NFKC', value or '').lower()
    return re.sub(r'[\s()·\-_.,/\[\]「」『』]', '', value)


def digits(value):
    return re.sub(r'\D', '', value or '')


def read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def redact(text, secrets):
    for s in secrets:
        if s:
            text = text.replace(s, '***').replace(urllib.parse.quote(s, safe=''), '***')
    return text


# ---------- fetching and parsing ----------

def fetch_live(source, params, key, timeout=30):
    query = dict(params)
    query['serviceKey'] = key
    url = source['endpoint'] + '?' + urllib.parse.urlencode(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'welfare-resource-refresh/1.0', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def fetch_fixture(directory, source, region, page):
    path = Path(directory) / f"{source['id']}-{region}-p{page}.{source['format']}"
    if not path.exists():
        return None
    return path.read_bytes()


def _strip(tag):
    return tag.rsplit('}', 1)[-1]


def parse(raw, fmt, item_path):
    """Return (items, total_count). Raises ValueError on API error payloads."""
    if fmt == 'xml':
        root = ET.fromstring(raw)
        code = root.findtext('.//resultCode') or root.findtext('.//returnReasonCode')
        if code not in (None, '', '0', '00', '000', 'INFO-000'):
            msg = root.findtext('.//resultMessage') or root.findtext('.//returnAuthMsg') or ''
            raise ValueError(f'API 오류 코드 {code} {msg}'.strip())
        items = []
        for el in root.iter():
            if _strip(el.tag) == item_path:
                items.append({_strip(c.tag): (c.text or '').strip() for c in el})
        total = root.findtext('.//totalCount') or root.findtext('.//list_total_count')
        return items, int(total) if total and total.isdigit() else None
    data = json.loads(raw)

    def find(node):
        if isinstance(node, dict):
            if item_path in node:
                value = node[item_path]
                if isinstance(value, dict) and 'item' in value:
                    value = value['item']
                return value if isinstance(value, list) else [value]
            for v in node.values():
                hit = find(v)
                if hit is not None:
                    return hit
        if isinstance(node, list):
            for v in node:
                hit = find(v)
                if hit is not None:
                    return hit
        return None

    items = find(data) or []
    total = None
    if isinstance(data, dict):
        for k in ('totalCount', 'total_count', 'matchCount'):
            if isinstance(data.get(k), int):
                total = data[k]
    return [i for i in items if isinstance(i, dict)], total


# ---------- normalising and filtering ----------

def areas_for(text, config):
    t = text or ''
    return [a['id'] for a in config['representativeAreas'] if any(w in t for w in a['words'])]


def normalise(item, source, region):
    f = source['fields']
    get = lambda k: str(item.get(f.get(k) or '', '') or '').strip()
    rec = {k: get(k) for k in ('id', 'name', 'summary', 'org', 'sido', 'sigungu', 'target', 'theme',
                               'method', 'updated', 'link', 'address', 'phone', 'hours', 'site', 'kind')}
    rec['source'] = source['id']
    rec['region'] = region
    return rec


def keep(rec, run, source, config):
    region = config['regions'][run['region']]
    rule = run.get('keepWhen')
    if rule and item_field(rec, rule['field']) not in rule['in']:
        return False
    if source['kind'] == 'facility' and region.get('addressWords'):
        if not any(w in rec.get('address', '') for w in region['addressWords']):
            return False
    rec['areas'] = areas_for(' '.join(rec.get(k, '') for k in ('name', 'summary', 'target', 'theme', 'kind')), config)
    if region.get('representativeOnly') and not rec['areas']:
        return False
    return bool(rec.get('name'))


def item_field(rec, field):
    mapping = {'sggNm': 'sigungu', 'ctpvNm': 'sido'}
    return rec.get(mapping.get(field, field), '')


# ---------- comparison with the hand-kept DB ----------

def load_db(root):
    orgs = read_csv(root / 'data/organizations.csv')
    services = read_csv(root / 'data/services.csv')
    contacts = read_csv(root / 'data/contacts.csv')
    phones = {}
    for c in contacts:
        if c['owner_type'] == 'organization' and c['phone']:
            phones.setdefault(c['owner_id'], set()).add(digits(c['phone']))
    return orgs, services, phones


def best(name, rows, key):
    target = norm(name)
    hit, score = None, 0.0
    for r in rows:
        cand = norm(r[key])
        if not cand:
            continue
        s = 1.0 if cand == target else difflib.SequenceMatcher(None, target, cand).ratio()
        if s > score:
            hit, score = r, s
    return (hit, score) if score >= MATCH_RATIO else (None, score)


def compare(records, db):
    orgs, services, phones = db
    out = []
    for rec in records:
        row = {k: '' for k in OUT_COLUMNS}
        row.update(source=rec['source'], region=rec['region'], area='|'.join(rec.get('areas', [])),
                   name=rec['name'], org=rec.get('org', ''), summary=rec.get('summary', '')[:300],
                   address=rec.get('address', ''), phone=rec.get('phone', ''), updated=rec.get('updated', ''),
                   link=rec.get('link', ''), api_id=rec.get('id', ''))
        if rec['kind_of_source'] == 'service':
            hit, _ = best(rec['name'], services, '서비스명')
            if hit:
                row.update(change='기존과 일치', match_kind='service', match_id=hit['service_id'], match_name=hit['서비스명'])
            else:
                row['change'] = '신규 후보'
        else:
            hit, _ = best(rec['name'], orgs, '기관명')
            if hit:
                diffs = []
                if rec.get('phone') and digits(rec['phone']) not in phones.get(hit['org_id'], set()):
                    diffs.append('전화')
                if rec.get('address') and hit['address'] and norm(rec['address'])[:12] != norm(hit['address'])[:12]:
                    diffs.append('주소')
                row.update(change='정보 다름' if diffs else '기존과 일치', match_kind='organization',
                           match_id=hit['org_id'], match_name=hit['기관명'], field_diffs='|'.join(diffs))
            else:
                row['change'] = '신규 후보'
        out.append(row)
    return out


# ---------- run ----------

def run(config, root, now, fixtures=None, env=os.environ, fetcher=None):
    status_path = root / 'docs/public-api/status.json'
    cand_path = root / 'docs/public-api/candidates.json'
    status = json.loads(status_path.read_text(encoding='utf-8')) if status_path.exists() else {'schemaVersion': 1, 'runs': {}}
    previous = json.loads(cand_path.read_text(encoding='utf-8')) if cand_path.exists() else {'items': []}
    secrets = [env.get(s.get('keyEnv', ''), '') for s in config['sources']]
    db = load_db(root)
    kept_prev = previous.get('items', [])
    fresh, done_runs, failures = [], set(), []
    for source in config['sources']:
        if not source.get('enabled'):
            continue
        key = env.get(source['keyEnv'], '')
        for regionrun in source['regionRuns']:
            run_id = f"{source['id']}:{regionrun['region']}"
            state = status['runs'].setdefault(run_id, {})
            state.update(lastAttemptAt=now, source=source['name'], region=config['regions'][regionrun['region']]['label'],
                         required=bool(config['regions'][regionrun['region']].get('required')))
            try:
                if not fixtures and not key:
                    raise ValueError(f"인증키 없음({source['keyEnv']} 비밀값 미등록)")
                if not source.get('endpoint'):
                    raise ValueError('호출 주소 미설정')
                items = []
                for page in range(1, source['maxPages'] + 1):
                    params = dict(source.get('params', {}))
                    params.update(regionrun.get('params', {}))
                    params[source['pageParam']] = page
                    params[source['sizeParam']] = source['pageSize']
                    raw = fetch_fixture(fixtures, source, regionrun['region'], page) if fixtures else (fetcher or fetch_live)(source, params, key)
                    if raw is None:
                        break
                    batch, total = parse(raw, source['format'], source['itemPath'])
                    items.extend(batch)
                    if len(batch) < source['pageSize'] or (total is not None and len(items) >= total):
                        break
                if not items:
                    raise ValueError('응답 0건(성공으로 기록하지 않음)')
                recs = []
                for item in items:
                    rec = normalise(item, source, regionrun['region'])
                    if keep(rec, regionrun, source, config):
                        rec['kind_of_source'] = source['kind']
                        recs.append(rec)
                fresh.extend(compare(recs, db))
                state.update(lastSuccessAt=now, lastError='', received=len(items), kept=len(recs))
                done_runs.add(run_id)
            except Exception as exc:  # noqa: BLE001 - every failure is recorded, never raised
                state['lastError'] = redact(f'{type(exc).__name__}: {exc}', secrets)[:300]
                if state['required']:
                    failures.append(run_id)
    # keep earlier candidates of runs that failed this time
    carried = [r for r in kept_prev if f"{r['source']}:{r['region']}" not in done_runs]
    region_of = {k: v['label'] for k, v in config['regions'].items()}
    for r in carried:
        r.setdefault('region', '')
    items = sorted(carried + fresh, key=lambda r: (r['change'] != '정보 다름', r['change'] != '신규 후보', r['region'], r['source'], r['name']))
    status['generatedAt'] = now
    status['note'] = '공공 API 수집 기록. 성공은 응답을 받았다는 뜻이며 서비스 운영·자격을 확인했다는 뜻이 아님.'
    summary = {c: sum(1 for r in items if r['change'] == c) for c in ('정보 다름', '신규 후보', '기존과 일치')}
    payload = {'schemaVersion': 1, 'generatedAt': now, 'regions': region_of, 'summary': summary,
               'note': '변경 후보 목록. 원본 DB에 반영하려면 사람이 공식 안내를 확인한 뒤 data/*.csv를 직접 고친다.',
               'items': items}
    return status, payload, failures


def write_outputs(root, status, payload):
    out = root / 'docs/public-api'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'status.json').write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (out / 'candidates.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    s = io.StringIO(newline='')
    w = csv.DictWriter(s, fieldnames=OUT_COLUMNS, lineterminator='\r\n', extrasaction='ignore')
    w.writeheader()
    w.writerows(r for r in payload['items'] if r['change'] != '기존과 일치')
    (out / 'candidates.csv').write_bytes(s.getvalue().encode('utf-8-sig'))


def markdown(status, payload):
    lines = ['## 공공 API 수집 결과', '', f"생성: {payload['generatedAt']}", '',
             '| 수집 | 지역 | 필수 | 받은 건수 | 남긴 건수 | 마지막 성공 | 오류 |', '|---|---|---|---|---|---|---|']
    for run_id, s in sorted(status['runs'].items()):
        lines.append(f"| {s.get('source', run_id)} | {s.get('region', '')} | {'예' if s.get('required') else ''} | {s.get('received', '')} | {s.get('kept', '')} | {s.get('lastSuccessAt', '')} | {s.get('lastError', '')} |")
    lines += ['', '변경 후보: ' + ', '.join(f'{k} {v}건' for k, v in payload['summary'].items())]
    return '\n'.join(lines) + '\n'


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--fixtures')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--now')
    ap.add_argument('--summary')
    args = ap.parse_args(argv)
    config = json.loads((ROOT / 'data/public-api-sources.json').read_text(encoding='utf-8'))
    now = args.now or dt.datetime.now(KST).isoformat(timespec='seconds')
    status, payload, failures = run(config, ROOT, now, fixtures=args.fixtures)
    write_outputs(ROOT, status, payload)
    text = markdown(status, payload)
    if args.summary:
        Path(args.summary).write_text(text, encoding='utf-8')
    print(text)
    if args.strict and failures:
        print('필수(오산) 수집 실패: ' + ', '.join(failures), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
