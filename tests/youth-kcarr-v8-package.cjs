const assert=require('node:assert/strict');
const K=require('../docs/youth-risk/k-carr-narrative-v8.js');
const I=require('../docs/youth-risk/oy-rals-v8-integration.js');
const cases=[
 ['학생은 ADHD 약물을 먹는다고 말합니다. 학교에서는 수업 집중이 어렵다는 보고가 있습니다.',false,false],
 ['보호자가 때린 적 없다고 했습니다.',false,false],
 ['학생은 폭행을 부인했습니다. 그러나 어제 집에서 맞았다고 뒤늦게 진술했습니다.',true,false],
 ['학생이 아동학대를 신고한 사실은 확인되나 보호조치 여부는 모릅니다.',true,false],
 ['학교가 보호자에게 연락한 뒤 학생이 맞았다고 말했습니다.',true,true],
 ['보호자가 전화에 응답하지 않았고 학생은 폭력 피해를 따로 진술했습니다.',true,false],
 ['학생은 다시 부모에게 전화하면 집에서 때릴까 봐 두려워합니다.',true,true],
 ['온라인 게임에서 누군가 연락처 제공과 금전 거래를 요구했습니다.',true,false],
 ['가정의 경제적 형편이 어렵지만 학생은 안정적으로 양육되고 있습니다.',false,false],
 ['학생은 어제 자해를 했다고 이야기합니다.',true,false],
 ['자해는 없다고 명확하게 말했습니다.',false,false],
 ['만약 학대가 생긴다면 신고해야 한다는 가상 예시입니다.',false,false],
 ['귀가를 피하고 지인 집에서 잤다는 보고가 있습니다.',true,false],
 ['학교폭력은 없다고 말합니다.',false,false],
 ['학생은 SNS로 개인사진을 퍼뜨리겠다는 협박을 받았다고 말했습니다.',true,false],
 ['친구는 괴롭힘을 당했지만 본 학생은 학교생활을 편안하게 한다고 합니다.',true,false],
 ['지난 학기 집에서 폭행을 당한 사실이 있다는 진술입니다.',true,false],
 ['부모가 장기 입원했고 학생은 혼자 밥을 먹고 잠드는 날이 많다고 합니다.',true,false],
 ['학생은 교실 소음에 예민하지만 적절한 휴식 시간을 통해 수업 참여가 늘었다고 말합니다.',false,false],
 ['보호자에게 연락하면 보복을 당할까 걱정되어 연락을 미뤘습니다.',true,true],
 ['신고가 이뤄졌다는 언급만 있습니다. 신고 이후 어떤 조치를 했는지는 확인되지 않았습니다.',false,false],
 ['최근 수업방해가 반복된다는 교사 관찰이 있습니다.',false,false],
 ['학생은 학교에 안 가는 것이 아니라 병원에 입원하여 진료받고 있습니다.',false,false],
 ['학생은 또래의 물건을 빼앗으라는 압력을 받았습니다.',true,false],
 ['보호자 연락으로 인하여 학생이 폭력 피해를 입을 수 있다는 우려가 있습니다.',true,true]
];
let fails=[];
for(let i=0;i<cases.length;i++){
 const [story,safe,linked]=cases[i],r=K.assess({caseContext:story,role:'teacher',officialScore:47});
 if(r.hasSafetySignal!==safe||r.caregiverContactHazard!==linked)fails.push({case:i+1,expected:[safe,linked],actual:[r.hasSafetySignal,r.caregiverContactHazard]});
 assert.equal(r.officialScoreUntouched,47);assert.equal(r.scoredByCORE,false);
 assert.equal(r.officialSafetyChanged,false);
 assert.ok(r.executionPlan.every(x=>x.status.includes('미확인')&&x.isDraft));
 assert.ok(r.evidence.every(x=>!x.text.includes('010-')));
 if(linked)assert.equal(r.needsCaregiverContactSafetyReview,true);
}
assert.deepEqual(fails,[],JSON.stringify(fails));
const caseText='ADHD 진단 언급과 학교생활 어려움이 있습니다. 학교에서 보호자에게 전화한 뒤 집에서 맞았다고 합니다. 학대 신고는 했다는 말만 있습니다.';
for(const role of ['teacher','education-welfare','social-worker']){
 const p={answers:Array(25).fill(0),caseContext:caseText};const res=I.build(p,{role,core:{knownTotal:41,urgent:false}});
 assert.equal(res.active,true);assert.equal(res.model.officialScoreUntouched,41);
 assert.equal(res.panels.optionalRecord.collapsed,true);assert.equal(res.viewContract.keepExistingDomainGraph,true);
 assert.equal(res.viewContract.itemScoresCollapsed,true);assert.equal(res.viewContract.supportMapHandledByExistingModule,true);
 assert.ok(res.model.executionPlan.some(x=>x.action.includes('보호자 연락')));
}
const empty=I.build({answers:Array(25).fill(0),caseContext:''},{role:'teacher'});assert.equal(empty.active,false);
console.log('V8 REGRESSION PASSED',cases.length,'independent test narratives + 3 roles + empty-path and CORE invariance');
