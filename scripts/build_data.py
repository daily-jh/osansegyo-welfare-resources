#!/usr/bin/env python3
"""Build compatible public resources from normalized, stable-ID source tables."""
from pathlib import Path
import argparse, collections, csv, datetime as dt, io, json, re, sys

ROOT = Path(__file__).resolve().parent.parent
FIELDS = ['범주','기관명','기관유형','기관소개','홈페이지','대표전화','근거URL','서비스명','지원분야','지원대상','주요내용','신청·연계방법','운영확인','최종검토일']
ORG_FIELDS = ['org_id','범주','기관명','기관유형','기관소개','홈페이지','근거URL','address','jurisdiction','status','address_source_url','address_status','address_checked_on','address_note']
VERIFY = ['미확인','확인완료','사업별 확인 필요','모집시기 확인']

def read_table(name, required):
    with (ROOT/'data'/name).open(encoding='utf-8-sig', newline='') as f:
        reader=csv.DictReader(f)
        if not set(required).issubset(reader.fieldnames or []):
            raise ValueError(f'{name}: required columns missing')
        rows=list(reader)
    if any(None in r or any(v is None for v in r.values()) for r in rows):
        raise ValueError(f'{name}: malformed CSV row')
    return rows

def unique(rows, key):
    result={}
    for r in rows:
        if not re.fullmatch(r'[A-Za-z0-9_-]+',r[key]) or r[key] in result: raise ValueError(f'duplicate/invalid {key}: {r[key]}')
        result[r[key]]=r
    return result

def date(value):
    if value: dt.date.fromisoformat(value)

def safe_url(value):
    if value and not re.match(r'^https?://[^\s/]+', value): raise ValueError(f'invalid URL: {value}')
    return value

def csv_bytes(rows, fields):
    s=io.StringIO(newline=''); writer=csv.DictWriter(s,fieldnames=fields,lineterminator='\r\n')
    writer.writeheader(); writer.writerows(rows)
    return s.getvalue().encode('utf-8-sig')

def load():
    orgs=read_table('organizations.csv',ORG_FIELDS)
    services=read_table('services.csv',['service_id','org_id','row_order']+FIELDS[7:]+['tags_target','tags_need','tags_form','intake_channels','operation_type','local_available','source_url','verification_status','verified_on','verification_method','verified_by','next_check_on'])
    contacts=read_table('contacts.csv',['contact_id','owner_type','owner_id','dept','phone','fax','email','hours','note','source_url','verified_on'])
    rounds=read_table('applications.csv',['round_id','service_id','name','opens_on','closes_on','local_available','source_url','verified_on'])
    history=read_table('verification_log.csv',['target_type','target_id','verified_on','method','verifier_role','result','source_url','next_check_on'])
    taxonomy=json.loads((ROOT/'data/taxonomy.json').read_text(encoding='utf-8'))
    om=unique(orgs,'org_id'); sm=unique(services,'service_id'); unique(contacts,'contact_id'); unique(rounds,'round_id')
    for entry in history:
        if entry['target_type'] not in ['organization','service'] or entry['target_id'] not in (om if entry['target_type']=='organization' else sm): raise ValueError('invalid verification log reference')
        date(entry['verified_on']);date(entry['next_check_on']);safe_url(entry['source_url'])
        if not all(entry[k] for k in ['verified_on','method','verifier_role','source_url']): raise ValueError('verification log requires evidence')
        if entry['result'] not in VERIFY: raise ValueError('invalid verification log result')
    orders=set(); keys=set()
    for o in orgs:
        if not o['기관명'] or o['범주'] not in ['오산시','경기도','민간']: raise ValueError('invalid organization')
        safe_url(o['홈페이지']); safe_url(o['근거URL'])
        if o['status'] not in ['미확인','운영중','중단','폐지']: raise ValueError('invalid organization status')
        if o['address_status'] not in ['미확인','기존 등록자료','공식','공공·지도']: raise ValueError('invalid address status')
        date(o['address_checked_on']); safe_url(o['address_source_url'])
        if not o['address'] and o['address_status']!='미확인': raise ValueError('address status requires address')
        if o['address_status'] in ['공식','공공·지도'] and not all(o[k] for k in ['address','address_source_url','address_checked_on']): raise ValueError('checked address missing evidence')
    for s in services:
        if s['org_id'] not in om or not s['서비스명']: raise ValueError('invalid service reference/name')
        order=int(s['row_order'])
        if order < 1 or order in orders: raise ValueError('duplicate/invalid row_order')
        orders.add(order)
        key=(s['org_id'],s['서비스명'])
        if key in keys: raise ValueError('duplicate organization/service name')
        keys.add(key)
        for k in ['최종검토일','verified_on','next_check_on']: date(s[k])
        if s['verification_status'] not in VERIFY: raise ValueError('invalid verification status')
        if s['verification_status']=='확인완료' and not all(s[k] for k in ['verified_on','verification_method','verified_by','source_url']):
            raise ValueError('verified service requires dated evidence')
        if s['operation_type'] not in ['확인 필요','상시','공모형','시즌']: raise ValueError('invalid operation type')
        if s['local_available'] not in ['확인 필요','가능','불가']: raise ValueError('invalid local availability')
        safe_url(s['source_url'])
        for k,axis in [('tags_target','target'),('tags_need','need'),('tags_form','form'),('intake_channels','intake')]:
            if any(t not in taxonomy[axis] for t in s[k].split('|') if t): raise ValueError(f'unknown {axis} tag')
    for c in contacts:
        if c['owner_type'] not in ['organization','service'] or c['owner_id'] not in (om if c['owner_type']=='organization' else sm): raise ValueError('invalid contact owner')
        if c['email'] and not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+',c['email']): raise ValueError('invalid contact email')
        if c['fax'] and not re.fullmatch(r'[0-9+() .~/-]+',c['fax']): raise ValueError('invalid fax')
        date(c['verified_on']);safe_url(c['source_url'])
        if c['verified_on'] and not c['source_url']: raise ValueError('contact confirmation requires a source')
    phones=collections.Counter(c['owner_id'] for c in contacts if c['owner_type']=='organization' and c['note']=='대표전화')
    if any(n>1 for n in phones.values()): raise ValueError('multiple primary organization phones')
    for r in rounds:
        if r['service_id'] not in sm: raise ValueError('invalid application reference')
        if sm[r['service_id']]['operation_type']!='공모형': raise ValueError('round requires a call-based service')
        for k in ['opens_on','closes_on','verified_on']: date(r[k])
        if r['opens_on'] and r['closes_on'] and r['opens_on']>r['closes_on']: raise ValueError('invalid application period')
        if r['local_available'] not in ['가능','불가','확인 필요']: raise ValueError('invalid round availability')
        safe_url(r['source_url'])
    return orgs,sorted(services,key=lambda s:int(s['row_order'])),contacts,rounds,taxonomy

def generate():
    orgs,services,contacts,rounds,taxonomy=load()
    phone={c['owner_id']:c['phone'] for c in contacts if c['owner_type']=='organization' and c['note']=='대표전화'}
    om={o['org_id']:o for o in orgs}; grouped={}; flat=[]
    for o in orgs:
        grouped[o['org_id']]={'id':o['org_id'],'name':o['기관명'],'level':o['범주'],'kind':o['기관유형'],'summary':o['기관소개'],'site':o['홈페이지'],'phone':phone.get(o['org_id'],''),'source':o['근거URL'],'reviewed':'','status':o['status'],'services':[]}
        grouped[o['org_id']]['contact']=next((c for c in contacts if c['owner_type']=='organization' and c['owner_id']==o['org_id'] and c['note']=='대표전화'),{})
        grouped[o['org_id']].update({'address':o['address'],'addressSource':o['address_source_url'],'addressStatus':o['address_status'],'addressCheckedOn':o['address_checked_on'],'addressNote':o['address_note']})
    for s in services:
        o=om[s['org_id']]; g=grouped[s['org_id']]
        flat.append({**{k:o[k] for k in FIELDS[:5]},**{k:s[k] for k in FIELDS[7:]},'대표전화':phone.get(s['org_id'],''),'근거URL':o['근거URL']})
        g['reviewed']=max(g['reviewed'],s['최종검토일'])
        v={'status':s['verification_status'],'date':s['verified_on'],'method':s['verification_method'],'by':s['verified_by'],'next':s['next_check_on']}
        g['services'].append({'id':s['service_id'],'name':s['서비스명'],'category':s['지원분야'],'target':s['지원대상'],'description':s['주요내용'],'method':s['신청·연계방법'],'operation':s['운영확인'],'editedOn':s['최종검토일'],'tags':{axis:s[k].split('|') if s[k] else [] for axis,k in [('target','tags_target'),('need','tags_need'),('form','tags_form'),('intake','intake_channels')]},'operationType':s['operation_type'],'localAvailable':s['local_available'],'source':s['source_url'],'verification':v,'contacts':[c for c in contacts if c['owner_type']=='service' and c['owner_id']==s['service_id']],'rounds':[r for r in rounds if r['service_id']==s['service_id']]})
    output={'date':max((s['최종검토일'] for s in services),default='미확인'),'schemaVersion':2,'note':'기존 자료 정리일이며, 기관·사업별 실제 운영 확인일과 다릅니다. 연계 전 최신 공식 공고를 확인해 주세요.','taxonomy':taxonomy,'organizations':list(grouped.values())}
    data=('/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */\nwindow.WELFARE_DATA = '+json.dumps(output,ensure_ascii=False,indent=2)+';\n').encode('utf-8')
    html=(ROOT/'docs/index.html').read_text(encoding='utf-8')
    for id_,value in [('statOrgs',str(len(orgs))),('statServices',str(len(services))),('statDate',output['date'].replace('-','. ')+'.')]:
        html=re.sub(r'(<strong id="'+id_+r'">)[^<]*(</strong>)',lambda m:m[1]+value+m[2],html)
    public_csv=csv_bytes(flat,FIELDS)
    queue=[]
    for s in services:
        o=om[s['org_id']]; issues=[]
        if not phone.get(o['org_id']): issues.append('대표전화 미기재')
        if 'osan.go.kr' in o['홈페이지']: issues.append('기관별 공식 URL 확인')
        if s['verification_status']!='확인완료': issues.append('실제 운영·접수 검증 필요')
        if not s['verified_on']: issues.append('실제 확인일 미기록')
        if s['local_available']=='확인 필요': issues.append('오산 접수 가능 여부 확인')
        if not s['tags_need']: issues.append('욕구 영역 분류 확인')
        if issues: queue.append({'org_id':o['org_id'],'service_id':s['service_id'],'범주':o['범주'],'기관명':o['기관명'],'서비스명':s['서비스명'],'확인사항':' / '.join(issues),'근거URL':s['source_url']})
    coverage={axis:{tag:sum(tag in (s[k].split('|') if s[k] else []) for s in services) for tag in taxonomy[axis]} for axis,k in [('need','tags_need'),('target','tags_target')]}
    coverage['note']='기존 자료의 검색용 분류 수이며, 확인된 접수 가능 자원 수가 아닙니다. 0개 영역은 수록 검토 예정입니다.'
    public_contacts=[]
    for c in contacts:
        org=om.get(c['owner_id']) if c['owner_type']=='organization' else om.get(next((s['org_id'] for s in services if s['service_id']==c['owner_id']),''))
        public_contacts.append({**c,'address':org['address'] if org else '',
                                'address_status':org['address_status'] if org else '미확인',
                                'address_source_url':org['address_source_url'] if org else '',
                                'address_checked_on':org['address_checked_on'] if org else ''})
    public_contact_columns=['contact_id','owner_type','owner_id','dept','phone','fax','email','hours','note','source_url','verified_on','address','address_status','address_source_url','address_checked_on']
    return {ROOT/'data/resources.csv':public_csv,ROOT/'docs/resources.csv':public_csv,ROOT/'docs/contacts.csv':csv_bytes(public_contacts,public_contact_columns),ROOT/'docs/assets/data.js':data,ROOT/'docs/index.html':html.encode('utf-8'),ROOT/'docs/review-queue.csv':csv_bytes(queue,['org_id','service_id','범주','기관명','서비스명','확인사항','근거URL']),ROOT/'docs/coverage.json':(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n').encode('utf-8')}

def main():
    p=argparse.ArgumentParser(); p.add_argument('--check',action='store_true');args=p.parse_args()
    try: artifacts=generate()
    except (ValueError,KeyError) as e: sys.exit(f'Build failed: {e}')
    stale=[str(p.relative_to(ROOT)) for p,b in artifacts.items() if not p.exists() or p.read_bytes()!=b]
    if args.check:
        if stale: sys.exit('Generated files differ: '+', '.join(stale))
    else:
        for p,b in artifacts.items(): p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(b)
    print('OK: normalized source validated; compatible CSV / data.js / statistics synchronized')

if __name__=='__main__': main()
