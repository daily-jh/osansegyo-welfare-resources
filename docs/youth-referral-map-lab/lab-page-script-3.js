
(function(){
const section=document.createElement('section');
section.innerHTML='<h2>지원연계 실무 검토 시트</h2><p class="muted">영역 일치만으로 서비스 이용 자격이나 의뢰 가능 여부가 확인되지는 않습니다. 기관에 문의하기 전에 학생의 동의·보호자 연락의 안전성·신고의무를 검토하세요.</p><label for="referral-stage">현재 단계</label><select id="referral-stage"><option>초기상담 및 욕구 확인</option><option>안전확인 및 보호절차 검토</option><option>기관 적합성 및 이용조건 확인</option><option>의뢰 및 사례협의</option></select><button id="referral-copy">비식별 의뢰 확인사항 복사</button><p id="referral-status" aria-live="polite"></p>';
document.querySelector('main').append(section);
document.getElementById('referral-copy').addEventListener('click',async()=>{
const domains=[...document.querySelectorAll('#filters input:checked')].map(x=>x.value);
const stage=document.getElementById('referral-stage').value;
const msg=['[청소년 지원연계 검토 시트]','진행 단계: '+stage,'확인된 지원 필요 영역: '+(domains.join(', ')||'미선택'),'1. 현재 안전 및 긴급보호 필요 여부 확인','2. 학생 의견·동의 및 보호자 연락의 안전성 검토','3. 기관의 서비스 대상·신청조건·담당창구 확인','4. 접수 가능 여부 및 대체기관 확인','5. 의뢰 후 접수 여부와 후속 일정 기록','※ 척도 결과 및 기관 적합성은 실무자가 별도 검토하며 학생 개인정보는 이 링크에 포함하지 않습니다.'].join('\n');
try{await navigator.clipboard.writeText(msg);document.getElementById('referral-status').textContent='개인정보 없는 검토 시트를 복사했습니다.'}catch(e){document.getElementById('referral-status').textContent='복사 실패: 브라우저 권한을 확인하세요.'}
});
})();
