"""One-time migration. Refuses to overwrite normalized sources."""
from pathlib import Path
import csv, hashlib, json
from build_data import ROOT, FIELDS, csv_bytes

def migrate():
    if (ROOT/'data/organizations.csv').exists(): raise SystemExit('Already migrated; edit normalized sources instead.')
    rows=list(csv.DictReader((ROOT/'data/resources.csv').open(encoding='utf-8-sig',newline='')))
    need_map={'경제·긴급':['소득·생계'],'사례관리':['사례관리'],'가족·아동':['가족지원'],'교육·청소년':['교육'],'보건·의료':['의료·건강'],'정신건강':['정신건강'],'주거':['주거'],'돌봄·생활':['돌봄'],'장애인':[],'노인':[],'취업·자립':['고용·자립'],'법률·금융':['법률·금융'],'지역협력':['지역참여·자원봉사']}
    targets={'영유아':['영유아'],'아동':['아동','어린이'],'청소년':['청소년','학생','중고생'],'청년':['청년'],'중장년':['중장년'],'노인':['노인','어르신','고령'],'가족·한부모':['가족','한부모','양육'],'다문화':['다문화'],'위기가구':['위기','취약','저소득'],'1인가구':['1인','독거'],'장애인':['장애','발달'],'질환':['질환'],'기관·실무자':['기관','시설','실무자','종사자']}
    taxonomy={'version':1,'target':list(targets),'need':['소득·생계','주거','의료·건강','정신건강','돌봄','교육','고용·자립','법률·금융','안전·권리보호','지역참여·자원봉사','가족지원','사례관리'],'form':['현금','현물','서비스 제공','상담','정보 제공','시설 이용'],'intake':['직접 방문','전화','온라인','동 행정복지센터 경유','협력기관 추천','공모'],'legacy_need_map':need_map,'note':'기존 지원분야·지원대상 원문에서 옮긴 검색용 분류. 자격·관할·운영 확인을 뜻하지 않음. 복합 분야는 세부 서비스 확인 후 수동 보완.'}
    organizations={}; services=[]; contacts=[]; registry=[]
    for n,r in enumerate(rows,1):
        oid=hashlib.sha1((r['범주']+'|'+r['기관명']).encode()).hexdigest()[:10]
        if oid not in organizations:
            organizations[oid]={'org_id':oid,**{k:r[k] for k in FIELDS[:5]},'근거URL':r['근거URL'],'address':'','jurisdiction':'','status':'미확인'}
            if r['대표전화']: contacts.append({'contact_id':'CON-'+oid,'owner_type':'organization','owner_id':oid,'dept':'','phone':r['대표전화'],'fax':'','email':'','hours':'','note':'대표전화','source_url':'','verified_on':''})
            registry.append({'org_id':oid,'original_scope':r['범주'],'original_name':r['기관명'],'legacy_hash':oid})
        else:
            o=organizations[oid]
            if any(o[k]!=r[k] for k in FIELDS[:5]+['근거URL']): raise ValueError('Conflicting repeated organization fields')
            existing=next((c['phone'] for c in contacts if c['owner_id']==oid),'')
            if r['대표전화']!=existing: raise ValueError('Conflicting repeated phone')
        tag_target=[k for k,words in targets.items() if any(w in r['지원대상'] for w in words)]
        # Category names that explicitly identify an audience retain that audience.
        for cat,target in [('장애인','장애인'),('노인','노인')]:
            if r['지원분야']==cat and target not in tag_target: tag_target.append(target)
        services.append({'service_id':f'SVC-{n:05d}','org_id':oid,'row_order':str(n),**{k:r[k] for k in FIELDS[7:]},'tags_target':'|'.join(tag_target),'tags_need':'|'.join(need_map[r['지원분야']]),'tags_form':'','intake_channels':'','operation_type':'확인 필요','local_available':'확인 필요','source_url':r['근거URL'],'verification_status':'미확인','verified_on':'','verification_method':'','verified_by':'','next_check_on':''})
        classify(services[-1])
    def write(name,rs,fields=None): (ROOT/'data'/name).write_bytes(csv_bytes(rs,fields or list(rs[0])))
    write('organizations.csv',list(organizations.values())); write('services.csv',services); write('contacts.csv',contacts)
    write('applications.csv',[],['round_id','service_id','name','opens_on','closes_on','local_available','source_url','verified_on'])
    write('verification_log.csv',[],['target_type','target_id','verified_on','method','verifier_role','result','source_url','next_check_on'])
    write('id-registry.csv',registry)
    (ROOT/'data/taxonomy.json').write_text(json.dumps(taxonomy,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Migrated: {len(organizations)} organizations, {len(services)} services; existing IDs preserved.')

def classify(s):
    """Search labels only, explicitly grounded in the legacy service wording."""
    text=s['서비스명']+' '+s['주요내용'];needs=s['tags_need'].split('|') if s['tags_need'] else []
    rules={'주거':['주거','주택','집수리'],'정신건강':['정신건강'],'의료·건강':['의료비','보건','치료비'],'돌봄':['돌봄'],'교육':['교육','장학'],'고용·자립':['취업','일자리','직업'],'안전·권리보호':['학대','폭력','권리보호']}
    for tag,words in rules.items():
        if tag not in needs and any(word in text for word in words):needs.append(tag)
    s['tags_need']='|'.join(needs)
    s['tags_form']='|'.join(tag for tag,word in [('상담','상담'),('현금','현금'),('현물','현물'),('정보 제공','정보 제공'),('시설 이용','시설 이용')] if word in text)
    s['intake_channels']='|'.join(tag for tag,word in [('전화','전화'),('온라인','온라인'),('직접 방문','방문'),('협력기관 추천','기관 추천'),('공모','공모')] if word in s['신청·연계방법'])
    s['operation_type']='공모형' if '공모' in (text+' '+s['운영확인']) else '상시' if s['운영확인'].startswith('상시 ') else '확인 필요'

if __name__=='__main__': migrate()
