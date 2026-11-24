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
               'field_diffs', 'summary', 'target', 'theme', 'method', 'address', 'phone', 'updated', 'link',
               'api_id']
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

def fetch_live(source, params, key, timeout=30, attempts=3, wait=5):
    import time, urllib.error
    query = dict(params)
    query[source.get('keyParam') or 'serviceKey'] = key   # 경기데이터드림은 KEY
    url = source['endpoint'] + '?' + urllib.parse.urlencode(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'welfare-resource-refresh/1.0', 'Accept': '*/*'})
    for n in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.read()
        except urllib.error.HTTPError as exc:
            if exc.code < 500 or n == attempts - 1:
                raise                                   # 4xx는 주소·권한 문제라 다시 해도 같음
        except (urllib.error.URLError, TimeoutError, OSError):
            if n == attempts - 1:
                raise                                   # 접속 시간 초과 등은 잠깐 뒤 다시 시도
        time.sleep(wait * (n + 1))


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
    if region.get('excludeOrgPattern') and re.match(region['excludeOrgPattern'], rec.get('org', '')):
        return False                                   # 경기도 수집에 섞인 시·군 사업
    if region.get('excludeNamePattern') and re.match(region['excludeNamePattern'], rec.get('name', '')):
        return False
    fields = config.get('areaTextFields', ['name', 'summary', 'target'])
    rec['areas'] = areas_for(' '.join(rec.get(k, '') for k in fields), config)
    if region.get('areas') is not None:               # 지역별로 보는 영역을 좁힘(national: 청소년 대표 영역, national-care: 돌봄통합)
        rec['areas'] = [a for a in rec['areas'] if a in region['areas']]
    if region.get('representativeOnly'):
        if not rec['areas'] or any(w in rec.get('name', '') for w in region.get('excludeWords', [])):
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


NEAR_RATIO = 0.66
STOP_WORDS = ('경기도', '오산시', '사업', '지원', '운영', '지급')


def core(value):
    value = norm(re.sub(r'\([^)]*\)', '', value or ''))     # 괄호 설명은 빼고 비교
    for w in STOP_WORDS:
        value = value.replace(w, '')
    return value


def score(a, b):
    na, nb = norm(a), norm(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    ca, cb = core(a), core(b)
    short, long_ = sorted((ca, cb), key=len)
    if len(short) >= 6 and short in long_ and len(short) / len(long_) >= 0.7:
        return 0.9                                       # 한쪽 이름이 다른 쪽을 품음(괄호 설명 등)
    return max(difflib.SequenceMatcher(None, na, nb).ratio(), difflib.SequenceMatcher(None, ca, cb).ratio())


def best(name, rows, key, threshold=MATCH_RATIO):
    hit, top = None, 0.0
    for r in rows:
        s = score(name, r[key])
        if s > top:
            hit, top = r, s
    return (hit, top) if top >= threshold else (None, top)


def compare(records, db):
    orgs, services, phones = db
    out = []
    for rec in records:
        row = {k: '' for k in OUT_COLUMNS}
        row.update(source=rec['source'], region=rec['region'], area='|'.join(rec.get('areas', [])),
                   name=rec['name'], org=rec.get('org', ''), summary=rec.get('summary', '')[:300],
                   target=rec.get('target', ''), theme=rec.get('theme', ''), method=rec.get('method', ''),
                   address=rec.get('address', ''), phone=rec.get('phone', ''), updated=rec.get('updated', ''),
                   link=rec.get('link', ''), api_id=rec.get('id', ''))
        if rec['kind_of_source'] == 'service':
            hit, sc = best(rec['name'], services, '서비스명', NEAR_RATIO)
            if hit and sc >= MATCH_RATIO:
                row.update(change='기존과 일치', match_kind='service', match_id=hit['service_id'], match_name=hit['서비스명'])
            elif hit:
                row.update(change='비슷한 항목 있음', match_kind='service', match_id=hit['service_id'], match_name=hit['서비스명'])
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
                         required=bool(source.get('required') and config['regions'][regionrun['region']].get('required')))
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
    order = {'정보 다름': 0, '신규 후보': 1, '비슷한 항목 있음': 2, '기존과 일치': 3}
    items = sorted(carried + fresh, key=lambda r: (order.get(r['change'], 9), r['region'], r['source'], r['name']))
    status['generatedAt'] = now
    status['note'] = '공공 API 수집 기록. 성공은 응답을 받았다는 뜻이며 서비스 운영·자격을 확인했다는 뜻이 아님.'
    summary = {c: sum(1 for r in items if r['change'] == c) for c in ('정보 다름', '신규 후보', '비슷한 항목 있음', '기존과 일치')}
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


def probe(urls, key, fetcher=None, gg_key=''):
    """Print status and the first part of each response, key redacted. Used to confirm endpoints.
    openapi.gg.go.kr(경기데이터드림) 주소는 GG_OPENAPI_KEY를 KEY 인자로 보낸다."""
    for url in urls:
        base, _, query = url.partition('?')
        params = dict(urllib.parse.parse_qsl(query))
        gg = 'openapi.gg.go.kr' in base
        params.setdefault('pIndex' if gg else 'pageNo', '1')
        params.setdefault('pSize' if gg else 'numOfRows', '2')
        try:
            src = {'endpoint': base, 'keyParam': 'KEY' if gg else 'serviceKey'}
            raw = (fetcher or fetch_live)(src, params, gg_key if gg else key)
            text = raw[:600].decode('utf-8', 'replace')
        except Exception as exc:  # noqa: BLE001
            text = f'{type(exc).__name__}: {exc}'
        print('### ' + base)
        print(redact(text, [key, gg_key]).replace('\n', ' ')[:600])
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--fixtures')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--now')
    ap.add_argument('--summary')
    ap.add_argument('--probe', help='공백으로 구분한 호출 주소들을 시험 호출해 응답 앞부분만 보여 줌(DB·결과 파일 안 건드림)')
    args = ap.parse_args(argv)
    config = json.loads((ROOT / 'data/public-api-sources.json').read_text(encoding='utf-8'))
    if args.probe:
        return probe(args.probe.split(), os.environ.get('DATA_GO_KR_KEY', ''), gg_key=os.environ.get('GG_OPENAPI_KEY', ''))
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
