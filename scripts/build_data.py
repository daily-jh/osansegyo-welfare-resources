#!/usr/bin/env python3
"""Copyright (c) 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
CSV -> website data.js. Website groups repeated organization rows by organization name and level.
"""
from pathlib import Path
import csv, json, hashlib, sys, collections
ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'data' / 'resources.csv'
OUTPUT = ROOT / 'docs' / 'assets' / 'data.js'
PUBLIC_CSV = ROOT / 'docs' / 'resources.csv'
FIELDS = ['범주','기관명','기관유형','기관소개','홈페이지','대표전화','근거URL','서비스명','지원분야','지원대상','주요내용','신청·연계방법','운영확인','최종검토일']

def safe_url(v):
    v=(v or '').strip()
    return v if v.startswith(('https://','http://')) else ''

def main():
    with SOURCE.open(newline='',encoding='utf-8-sig') as f:
        reader=csv.DictReader(f)
        missing=[k for k in FIELDS if k not in (reader.fieldnames or [])]
        if missing: sys.exit('Missing headers: '+str(missing))
        rows=list(reader)
    grouped={}
    for n,row in enumerate(rows,2):
        level=row['범주'].strip(); name=row['기관명'].strip()
        if not name or level not in ('오산시','경기도','민간') or not row['서비스명'].strip():
            print(f'Skipped incomplete row {n}',file=sys.stderr); continue
        key=(level,name)
        if key not in grouped:
            uid=hashlib.sha1((level+'|'+name).encode('utf-8')).hexdigest()[:10]
            grouped[key]={'id':uid,'name':name,'level':level,'kind':row['기관유형'].strip(),
                'summary':row['기관소개'].strip(),'site':safe_url(row['홈페이지']),
                'phone':row['대표전화'].strip(),'source':safe_url(row['근거URL']),
                'reviewed':row['최종검토일'].strip(),'services':[]}
        group=grouped[key]
        if row['홈페이지'].strip() and safe_url(row['홈페이지'])!=group['site']:
            print(f'Warning: inconsistent website for {name}, row {n}',file=sys.stderr)
        service={'name':row['서비스명'].strip(),'category':row['지원분야'].strip(),
                 'target':row['지원대상'].strip(),'description':row['주요내용'].strip(),
                 'method':row['신청·연계방법'].strip(),'operation':row['운영확인'].strip()}
        if service['name'] not in [s['name'] for s in group['services']]:
            group['services'].append(service)
    output={'date':'2026-10-20','note':'1차 조사 자료입니다. 개별 사업의 신청대상·지원금액·접수기간 및 운영 여부는 반드시 공식 기관에 확인해주세요.',
            'organizations':list(grouped.values())}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    with OUTPUT.open('w',encoding='utf-8') as f:
        f.write('/* Copyright (c) 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */\n')
        f.write('window.WELFARE_DATA = '+json.dumps(output,ensure_ascii=False,indent=2)+';\n')
    PUBLIC_CSV.write_bytes(SOURCE.read_bytes())
    print(f"OK: {len(output['organizations'])} institutions, {sum(len(o['services']) for o in output['organizations'])} services")

if __name__=='__main__': main()
