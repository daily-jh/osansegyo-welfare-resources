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
               'api_id', 'city', 'run']
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


def resolve_odcloud(source, getter=None):
    """공공데이터포털 파일데이터(odcloud)는 해마다 새 판이 새 경로(uddi)로 올라온다.
    안내 문서(키 없음)에서 이름 끝 날짜가 가장 늦은 경로를 골라 호출 주소를 만든다. 실패하면 저장된 주소를 쓴다."""
    ns = source.get('odcloud')
    if not ns:
        return source['endpoint']
    url = f'https://infuser.odcloud.kr/oas/docs?namespace={ns}'
    try:
        if getter:
            raw = getter(url)
        else:
            req = urllib.request.Request(url, headers={'User-Agent': 'welfare-resource-refresh/1.0'})
            with urllib.request.urlopen(req, timeout=30) as res:
                raw = res.read()
        doc = json.loads(raw)
        paths = [(re.findall(r'(\d{8})', (ops.get('get') or {}).get('summary', '')) or ['0'])[-1] + '|' + path
                 for path, ops in (doc.get('paths') or {}).items()]
        if not paths:
            return source['endpoint']
        latest = sorted(paths)[-1].split('|', 1)[1]
        return 'https://' + doc.get('host', 'api.odcloud.kr') + doc.get('basePath', '/api') + latest
    except Exception:  # noqa: BLE001 - 안내 문서를 못 읽어도 저장된 주소로 계속
        return source['endpoint']


def fetch_fixture(directory, source, region, page):
    path = Path(directory) / f"{source['id']}-{region}-p{page}.{source['format']}"
    if not path.exists():
        return None
    return path.read_bytes()


def _strip(tag):
    return tag.rsplit('}', 1)[-1]


class ApiResponseError(ValueError):
    def __init__(self, code, message):
        self.code = code
        super().__init__(f'API 오류 코드 {code} {message}'.strip())


def parse(raw, fmt, item_path):
    """Return (items, total_count). Raises ValueError on API error payloads."""
    if fmt == 'xml':
        root = ET.fromstring(raw)
        code = root.findtext('.//resultCode') or root.findtext('.//returnReasonCode')
        if code not in (None, '', '0', '00', '000', 'INFO-000'):
            msg = root.findtext('.//resultMsg') or root.findtext('.//resultMessage') or root.findtext('.//returnAuthMsg') or ''
            raise ApiResponseError(code, msg)
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

    def get(k):
        spec = f.get(k)
        if isinstance(spec, dict):                     # 여러 칸을 이어 붙임: {"keys": [..], "sep": "~"}
            parts = [str(item.get(x, '') or '').strip() for x in spec.get('keys', [])]
            parts = [v for v in parts if v and v not in ('비어있음', '미확인')]
            return spec.get('sep', ' ').join(parts)
        if isinstance(spec, list):
            return get_join(spec)
        return str(item.get(spec or '', '') or '').strip()

    def get_join(keys):
        return ' '.join(v for v in (str(item.get(x, '') or '').strip() for x in keys) if v)
    rec = {k: get(k) for k in ('id', 'name', 'summary', 'org', 'sido', 'sigungu', 'target', 'theme',
                               'method', 'updated', 'link', 'address', 'phone', 'hours', 'site', 'kind')}
    rec['source'] = source['id']
    rec['region'] = region
    return rec


def near_city(address, config):
    """주소가 인근 시(수원·화성·평택 등, regions.near.cities)에 있으면 그 시 이름. 없으면 ''."""
    for city in config['regions'].get('near', {}).get('cities', []):
        if city in (address or ''):
            return city
    return ''


def run_key(source, regionrun):
    """수집 한 번의 이름. 같은 지역(region)을 시별로 여러 번 부를 때는 key로 나눈다(예: near-suwon)."""
    return f"{source['id']}:{regionrun.get('key', regionrun['region'])}"


def keep(rec, run, source, config):
    region = config['regions'][run['region']]
    rule = run.get('keepWhen')
    if rule and item_field(rec, rule['field']) not in rule['in']:
        return False
    if run.get('nameRe') and not re.search(run['nameRe'], rec.get('name', '')):
        return False                                   # 병·의원 전체 목록에서 필요한 진료 분야만 남김
    if run.get('kindRe') and not re.search(run['kindRe'], rec.get('kind', '')):
        return False                                   # 경기도 거점만(예: 권역응급의료센터)
    if source['kind'] == 'facility' and region.get('addressWords'):
        if not any(w in rec.get('address', '') for w in region['addressWords']):
            return False
        if run['region'] != 'osan' and any(w in rec.get('address', '') for w in config['regions']['osan']['addressWords']):
            return False                               # 오산 기관은 오산 수집에서만 셈(경기 수집과 겹치지 않게)
        city = near_city(rec.get('address', ''), config)
        if run['region'] == 'near' and not city:
            return False
        if city and run['region'] in ('gyeonggi', 'near'):
            rec['region'], rec['city'] = 'near', city   # 지역 범주 5단계: 경기 목록 속 인근 시 기관은 '인근 시'로 나눔
    if source['kind'] == 'service':
        if region.get('excludeOrgPattern') and re.match(region['excludeOrgPattern'], rec.get('org', '')):
            return False                               # 경기도 수집에 섞인 시·군 사업
        if region.get('excludeNamePattern') and re.match(region['excludeNamePattern'], rec.get('name', '')):
            return False
    fields = config.get('areaTextFields', ['name', 'summary', 'target'])
    rec['areas'] = areas_for(' '.join(rec.get(k, '') for k in fields), config)
    if region.get('areas') is not None:               # 지역별로 보는 영역을 좁힘(national: 청소년 대표 영역, national-care: 돌봄통합)
        rec['areas'] = [a for a in rec['areas'] if a in region['areas']]
    if any(w in rec.get('name', '') for w in region.get('excludeWords', [])):
        return False                                   # 종사자 대상·산업 지원 등 주민 서비스가 아닌 사업(2026-11-25 재실행에서 확인)
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
        row['kind_of_source'] = rec['kind_of_source']
        row.update(source=rec['source'], region=rec['region'], area='|'.join(rec.get('areas', [])),
                   name=rec['name'], org=rec.get('org', ''), summary=rec.get('summary', '')[:300],
                   target=rec.get('target', ''), theme=rec.get('theme', ''), method=rec.get('method', ''),
                   address=rec.get('address', ''), phone=rec.get('phone', ''), updated=rec.get('updated', ''),
                   link=rec.get('link', ''), api_id=rec.get('id', ''), kind=rec.get('kind', ''),
                   hours=rec.get('hours', ''), sigungu=rec.get('sigungu', ''), site=rec.get('site', ''),
                   city=rec.get('city', ''), run=rec.get('run', ''))
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

def run(config, root, now, fixtures=None, env=os.environ, fetcher=None, odcloud_getter=None):
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
            run_id = run_key(source, regionrun)
            state = status['runs'].setdefault(run_id, {})
            state.update(lastAttemptAt=now, source=source['name'], region=config['regions'][regionrun['region']]['label'],
                         required=bool(source.get('required') and config['regions'][regionrun['region']].get('required')))
            try:
                if not fixtures and not key:
                    raise ValueError(f"인증키 없음({source['keyEnv']} 비밀값 미등록)")
                if not source.get('endpoint'):
                    raise ValueError('호출 주소 미설정')
                if source.get('odcloud') and not fixtures and not source.get('_resolved'):
                    source = dict(source, endpoint=resolve_odcloud(source, odcloud_getter), _resolved=True)
                    state['endpoint'] = source['endpoint'].rsplit('/api/', 1)[-1]
                items = []
                for page in range(1, source['maxPages'] + 1):
                    params = dict(source.get('params', {}))
                    params.update(regionrun.get('params', {}))
                    params[source['pageParam']] = page
                    params[source['sizeParam']] = source['pageSize']
                    if fixtures:
                        raw = fetch_fixture(fixtures, source, regionrun.get('key', regionrun['region']), page)
                        if raw is None:
                            break
                        batch, total = parse(raw, source['format'], source['itemPath'])
                    else:
                        for attempt in range(2):
                            raw = (fetcher or fetch_live)(source, params, key)
                            try:
                                batch, total = parse(raw, source['format'], source['itemPath'])
                                break
                            except ApiResponseError as exc:
                                if source['id'] != 'hira-mental-clinic' or exc.code != '99' or attempt:
                                    raise
                                import time
                                time.sleep(1)
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
                        rec['run'] = run_id
                        recs.append(rec)
                fresh.extend(compare(recs, db))
                state.update(lastSuccessAt=now, lastError='', received=len(items), kept=len(recs))
                done_runs.add(run_id)
            except Exception as exc:  # noqa: BLE001 - every failure is recorded, never raised
                state['lastError'] = redact(f'{type(exc).__name__}: {exc}', secrets)[:300]
                if state['required']:
                    failures.append(run_id)
    # keep earlier candidates of runs that failed this time
    carried = [r for r in kept_prev if (r.get('run') or f"{r['source']}:{r['region']}") not in done_runs]
    region_of = {k: v['label'] for k, v in config['regions'].items()}
    for r in carried:
        r.setdefault('region', '')
    # 같은 기관이 시별 수집과 경기 수집(또는 지난 결과)에 함께 잡히면 한 번만: 이번 결과 먼저, 오산 → 인근 시 → 경기 순
    rank = {'osan': 0, 'near': 1}
    seen, uniq = set(), []
    for n, r in sorted(enumerate(fresh + carried), key=lambda x: (x[0] >= len(fresh), rank.get(x[1]['region'], 2), x[0])):
        k = (r['source'], norm(r['name']), norm(r.get('address', ''))[:16]) if r.get('kind_of_source', 'facility') == 'facility' and r.get('address') else ('row', n)
        if k in seen:
            continue
        seen.add(k)
        uniq.append(r)
    fresh, carried = uniq, []
    order = {'정보 다름': 0, '신규 후보': 1, '비슷한 항목 있음': 2, '기존과 일치': 3}
    items = sorted(carried + fresh, key=lambda r: (order.get(r['change'], 9), r['region'], r['source'], r['name']))
    status['generatedAt'] = now
    status['note'] = '공공 API 수집 기록. 성공은 응답을 받았다는 뜻이며 서비스 운영·자격을 확인했다는 뜻이 아님.'
    summary = {c: sum(1 for r in items if r['change'] == c) for c in ('정보 다름', '신규 후보', '비슷한 항목 있음', '기존과 일치')}
    payload = {'schemaVersion': 1, 'generatedAt': now, 'regions': region_of, 'summary': summary,
               'note': '변경 후보 목록. 원본 DB에 반영하려면 사람이 공식 안내를 확인한 뒤 data/*.csv를 직접 고친다.',
               'items': items}
    payload['_facilities'] = facilities(config, items, now)
    return status, payload, failures


def facilities(config, items, now):
    """기관 목록형 공공데이터를 화면에서 바로 쓰도록 데이터별로 묶는다(docs/public-api/facilities.json).
    원문 그대로이며 운영 여부는 확인 전이다. 기존 DB에 같은 기관이 있으면 match_id로 잇는다."""
    meta = {s['id']: s for s in config['sources'] if s['kind'] == 'facility'}
    groups = {}
    for r in items:
        src = meta.get(r.get('source'))
        if not src or r.get('kind_of_source', 'facility') != 'facility':
            continue
        g = groups.setdefault(src['id'], {'id': src['id'], 'name': src['name'], 'label': src.get('label', src['name']),
                                          'uses': src.get('uses', []), 'page': src.get('page', ''), 'items': []})
        g['items'].append({k: r.get(k, '') for k in ('name', 'kind', 'org', 'address', 'phone', 'hours', 'site', 'summary',
                                                      'target', 'region', 'city', 'change', 'match_id', 'match_name')})
    rank = {'osan': 0, 'near': 1, 'gyeonggi': 2}
    for g in groups.values():
        g['items'].sort(key=lambda x: (rank.get(x['region'], 3), x['name']))
    order = [s['id'] for s in config['sources']]
    return {'schemaVersion': 1, 'generatedAt': now,
            'note': '공공데이터포털 기관 목록 원문(오산·인근 시·경기). 운영 여부·연락처는 이용 전 기관에 확인. match_id가 있으면 복지자원 DB의 같은 기관.',
            'groups': sorted(groups.values(), key=lambda g: order.index(g['id']))}


def write_outputs(root, status, payload):
    out = root / 'docs/public-api'
    out.mkdir(parents=True, exist_ok=True)
    payload = dict(payload)
    fac = payload.pop('_facilities', None)
    if fac is not None:
        (out / 'facilities.json').write_text(json.dumps(fac, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
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


def discover(tokens, fetcher=None):
    """공개 안내 페이지(키 없음)에서 경기데이터드림 서비스 주소(openapi.gg.go.kr/<이름>)를 찾아 보여 준다.
    숫자는 공공데이터포털 데이터 번호, 그 밖은 경기데이터드림 infId로 본다. DB·결과 파일은 건드리지 않는다."""
    import urllib.error
    def get(url):
        if fetcher:
            return fetcher(url)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (welfare-resource-refresh/1.0)', 'Accept': 'text/html,*/*'})
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.read().decode('utf-8', 'replace')
    for tok in tokens:
        urls = ([f'https://www.data.go.kr/data/{tok}/openapi.do'] if tok.isdigit() else
                [f'https://data.gg.go.kr/portal/data/service/selectServicePage.do?infId={tok}&infSeq=1',
                 f'https://data.gg.go.kr/portal/data/service/selectAPIServicePage.do?infId={tok}&infSeq=3'])
        for url in urls:
            print('### ' + url)
            try:
                html = get(url)
            except Exception as exc:  # noqa: BLE001
                print(f'{type(exc).__name__}: {exc}')
                continue
            names = sorted(set(re.findall(r'openapi\.gg\.go\.kr/([A-Za-z0-9_]+)', html)))
            infids = sorted(set(re.findall(r'infId=([A-Z0-9]{16,})', html)))
            print('서비스 이름:', ', '.join(names) or '없음', '| infId:', ', '.join(infids[:5]) or '없음')
            cols = sorted(set(re.findall(r'\b([A-Z][A-Z0-9]*_[A-Z0-9_]{2,})\b', html)))
            print('항목 이름 후보:', ', '.join(cols[:60]) or '없음')
    return 0


def inspect(urls, key, getter=None):
    """받은 주소를 종류별로 살펴 본다(DB·결과 파일 안 건드림).
    - infuser.odcloud.kr/oas/docs?namespace=..: 안내(JSON)에서 호출 경로·항목 이름을 읽고, 각 경로를 불러
      전체 건수·오산 건수·오산 첫 건을 보여 준다.
    - apis.data.go.kr / api.data.go.kr: 그대로(또는 흔한 오퍼레이션 이름을 붙여) 불러 앞부분을 보여 준다."""
    import urllib.error
    def get(url):
        if getter:
            return getter(url)
        req = urllib.request.Request(url, headers={'User-Agent': 'welfare-resource-refresh/1.0', 'Accept': 'application/json,*/*'})
        try:
            with urllib.request.urlopen(req, timeout=40) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as exc:
            return exc.code, exc.read()
    qkey = urllib.parse.quote(key, safe='')
    def show(text, n=700):
        return redact(text, [key]).replace('\n', ' ')[:n]
    for url in urls:
        print('\n### ' + url)
        try:
            if 'infuser.odcloud.kr' in url:
                code, raw = get(url)
                doc = json.loads(raw)
                print('제목:', (doc.get('info') or {}).get('title'), '|', (doc.get('info') or {}).get('description', '')[:200])
                base = 'https://' + doc.get('host', 'api.odcloud.kr') + doc.get('basePath', '/api')
                for path, ops in (doc.get('paths') or {}).items():
                    op = ops.get('get') or {}
                    print('- 경로', path, '|', op.get('summary', ''))
                    rows, total, page = [], None, 1
                    while page <= 30:
                        code, raw = get(f'{base}{path}?page={page}&perPage=1000&returnType=JSON&serviceKey={qkey}')
                        if code != 200:
                            print('  호출', code, show(raw.decode('utf-8', 'replace'), 300)); break
                        data = json.loads(raw)
                        total = data.get('totalCount')
                        batch = data.get('data') or []
                        rows += batch
                        if not batch or len(rows) >= (total or 0):
                            break
                        page += 1
                    if not rows:
                        continue
                    osan = [r for r in rows if '오산' in json.dumps(r, ensure_ascii=False)]
                    print(f'  전체 {total} | 받은 {len(rows)} | 오산 포함 {len(osan)}')
                    print('  항목:', ', '.join(rows[0].keys()))
                    for r in osan[:3] or rows[:1]:
                        print('  예:', show(json.dumps(r, ensure_ascii=False), 500))
            else:
                base, _, query = url.partition('?')
                tries = [base]
                if 'apis.data.go.kr' in base:
                    tail = base.rstrip('/').rsplit('/', 1)[-1]
                    stem = re.sub(r'(Service)?(V\d+)?$', '', tail)
                    tries += [f'{base}/{op}' for op in dict.fromkeys([
                        f'get{stem[0].upper()}{stem[1:]}List', f'get{stem[0].upper()}{stem[1:]}ListV2',
                        f'get{stem[0].upper()}{stem[1:]}', f'get{stem[0].upper()}{stem[1:]}Info',
                        f'get{stem[0].upper()}{stem[1:]}InfoV2', 'getList', 'getInfoList'])]
                extra = {'pageNo': '1', 'numOfRows': '3', 'type': 'json'}
                if 'apis.data.go.kr' in base:
                    extra.update({'_type': 'json', 'returnType': 'json'})
                extra.update(dict(urllib.parse.parse_qsl(query)))
                for t in tries:
                    q = urllib.parse.urlencode(extra) + f'&serviceKey={qkey}'
                    code, raw = get(t + '?' + q)
                    print(f'- {t.replace(base, "") or "(주소 그대로)"} → {code}:', show(raw.decode('utf-8', 'replace'), 500))
                    if code == 200 and b'<cmmMsgHeader>' not in raw and b'API not found' not in raw:
                        break
        except Exception as exc:  # noqa: BLE001
            print(f'{type(exc).__name__}:', show(str(exc), 300))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--fixtures')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--now')
    ap.add_argument('--summary')
    ap.add_argument('--discover', help='공백으로 구분한 공공데이터포털 번호·경기데이터드림 infId의 안내 페이지에서 서비스 주소를 찾음')
    ap.add_argument('--probe', help='공백으로 구분한 호출 주소들을 시험 호출해 응답 앞부분만 보여 줌(DB·결과 파일 안 건드림)')
    ap.add_argument('--inspect', help='공백으로 구분한 안내·호출 주소를 살펴 경로·항목·오산 건수를 보여 줌(DB·결과 파일 안 건드림)')
    args = ap.parse_args(argv)
    config = json.loads((ROOT / 'data/public-api-sources.json').read_text(encoding='utf-8'))
    if args.inspect:
        return inspect(args.inspect.split(), os.environ.get('DATA_GO_KR_KEY', ''))
    if args.discover:
        return discover(args.discover.split())
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
