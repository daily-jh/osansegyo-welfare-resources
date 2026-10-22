"""Read-only data/link audit. Reports candidates; never rewrites or deletes records."""
import argparse, collections, datetime as dt, json, re, time, urllib.request, urllib.error
from pathlib import Path
from build_data import load, csv_bytes

def main():
    p=argparse.ArgumentParser();p.add_argument('--links',action='store_true');p.add_argument('--output',default='artifacts/resource-audit');args=p.parse_args()
    orgs,services,contacts,rounds,taxonomy=load();today=dt.date.today();warnings=[];links=[]
    def warn(id_,kind,note): warnings.append({'id':id_,'kind':kind,'note':note})
    for o in orgs:
        if not any(c['owner_type']=='organization' and c['owner_id']==o['org_id'] and c['phone'] for c in contacts): warn(o['org_id'],'전화 미기재','공식 대표·접수 전화 확인 필요')
    for c in contacts:
        if c['phone'] and not re.fullmatch(r'[0-9\-+() ,~]+',c['phone']): warn(c['contact_id'],'전화 형식','공식 번호와 형식 대조 필요')
    for s in services:
        if s['verification_status']!='확인완료': warn(s['service_id'],'운영 미확인',s['verification_status'])
        if not s['next_check_on']: warn(s['service_id'],'다음 점검일 미기록','실제 확인 후 점검 주기 설정')
        elif s['next_check_on']<today.isoformat(): warn(s['service_id'],'검증 재점검','예정일 경과; 자동 폐지하지 않음')
    for r in rounds:
        if r['closes_on'] and r['closes_on']<today.isoformat(): warn(r['round_id'],'접수기간 경과','회차 마감 여부 확인; 서비스는 유지')
    if args.links:
        urls=sorted({r[k] for rows,keys in [(orgs,['홈페이지','근거URL']),(services,['source_url']),(rounds,['source_url'])] for r in rows for k in keys if r[k]})
        for url in urls:
            result={'url':url,'status':None,'result':'수동 확인 필요'}
            for attempt in range(2):
                try:
                    req=urllib.request.Request(url,headers={'User-Agent':'WelfareResourceLinkAudit/1.0 (+https://github.com/daily-jh/osansegyo-welfare-resources)'})
                    with urllib.request.urlopen(req,timeout=12) as response:
                        result.update(status=response.status,result='응답 확인 (사업 운영 검증 아님)',final_url=response.url)
                    break
                except urllib.error.HTTPError as e:
                    result['status']=e.code
                    if e.code not in [429,500,502,503,504]: break
                except (OSError,ValueError): pass
                time.sleep(1+attempt)
            links.append(result);time.sleep(.3)
    target=Path(args.output);target.mkdir(parents=True,exist_ok=True)
    report={'checked_at_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'organizations':len(orgs),'services':len(services),'warnings':warnings,'links':links,'note':'자동 점검 결과는 수정·삭제·운영확인 근거가 아닙니다. 공식 출처와 담당자 검토가 필요합니다.'}
    (target/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (target/'review.csv').write_bytes(csv_bytes(warnings,['id','kind','note']))
    lines=['# 복지자원 정기 점검',f"기관 {len(orgs)}개 / 서비스 {len(services)}개 / 확인 요청 {len(warnings)}건",'',report['note'],'','## 확인 요청 종류']
    lines.extend(f'- {k}: {n}건' for k,n in collections.Counter(x['kind'] for x in warnings).items())
    lines.extend(['','## 링크 응답','403·429·시간초과는 열람 제한일 수 있습니다. 200 응답도 정보의 정확성을 보장하지 않습니다.'])
    lines.extend(f"- {x['status'] or '응답 실패'}: {x['url']} — {x['result']}" for x in links)
    (target/'summary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(f'Audit complete: {len(warnings)} review items, {len(links)} URL checks; no source changed.')

if __name__=='__main__': main()
