/* OY-RALS evidence registry v1: one list of the sources behind interpretation, intervention and rules.
   Interpretation only. Nothing here feeds scores, CORE levels or criteria.js; it explains why a step is advised.
   Older reference sets keep their own numbers: references.html [1]~[18], research-v1 L01~L19, grade lens S1~S12. */
(function(root){'use strict';
const VERSION='1.0.0-20261029';
const CHECKED='2026-10-29';
const KINDS={paper:'학술지 논문',guide:'공식 지침·보고서',book:'도서·매뉴얼',law:'법령·조약',video:'교육영상·교육과정'};
const FIELDS={safety:'자해·자살 안전',protect:'학대·보호',peer:'학교폭력·또래',emotion:'정서·정신건강',school:'학습·출결',behavior:'행동·물질',access:'장애·발달 접근성',family:'가족·돌봄',econ:'경제·주거',relation:'관계·보호요인',digital:'디지털 안전',practice:'사례관리·개입 구조',measure:'측정·검증'};
const doi=d=>'https://doi.org/'+d;
const E=[
 {id:'E01',kind:'paper',field:'safety',ref:'Horowitz, L. M., Bridge, J. A., Teach, S. J., et al. (2012). Ask Suicide-Screening Questions (ASQ): A brief instrument for the pediatric emergency department. Archives of Pediatrics & Adolescent Medicine, 166(12), 1170–1176.',url:doi('10.1001/archpediatrics.2012.1276'),use:'네 질문 중 하나만 "예"여도 양성으로 보고 추가 확인. 1·2·7·25번을 1점부터 안전확인으로 두는 근거.'},
 {id:'E02',kind:'paper',field:'safety',ref:'Posner, K., Brown, G. K., Stanley, B., et al. (2011). The Columbia–Suicide Severity Rating Scale: Initial validity and internal consistency findings from three multisite studies with adolescents and adults. American Journal of Psychiatry, 168(12), 1266–1277.',url:doi('10.1176/appi.ajp.2011.10111704'),use:'생각·계획·수단·최근 행동을 나눠 묻는 확인 순서. 7번 도움말의 확인 항목.'},
 {id:'E03',kind:'paper',field:'safety',ref:'Franklin, J. C., Ribeiro, J. D., Fox, K. R., et al. (2017). Risk factors for suicidal thoughts and behaviors: A meta-analysis of 50 years of research. Psychological Bulletin, 143(2), 187–232.',url:doi('10.1037/bul0000084'),use:'위험요인으로 자살을 예측하는 힘은 우연 수준에 가까움. 저·중·고 위험 등급 대신 직접 확인하는 근거.'},
 {id:'E04',kind:'paper',field:'safety',ref:'Dazzi, T., Gribble, R., Wessely, S., & Fear, N. T. (2014). Does asking about suicide and related behaviours induce suicidal ideation? What is the evidence? Psychological Medicine, 44(16), 3361–3363.',url:doi('10.1017/S0033291714001299'),use:'자살에 대해 직접 물어도 자살생각이 늘지 않음.'},
 {id:'E05',kind:'paper',field:'safety',ref:'Gould, M. S., Marrocco, F. A., Kleinman, M., et al. (2005). Evaluating iatrogenic risk of youth suicide screening programs: A randomized controlled trial. JAMA, 293(13), 1635–1643.',url:doi('10.1001/jama.293.13.1635'),use:'학교 선별에서 자살 질문을 받은 학생의 고통·자살생각이 늘지 않음(무작위 대조).'},
 {id:'E06',kind:'paper',field:'safety',ref:'Stanley, B., Brown, G. K., Brenner, L. A., et al. (2018). Comparison of the Safety Planning Intervention with follow-up vs usual care of suicidal patients treated in the emergency department. JAMA Psychiatry, 75(9), 894–900.',url:doi('10.1001/jamapsychiatry.2018.1776'),use:'안전계획을 함께 쓰고 후속 전화를 한 경우 자살행동이 줄고 치료 연결이 늘어남.'},
 {id:'E07',kind:'paper',field:'safety',ref:'Motto, J. A., & Bostrom, A. G. (2001). A randomized controlled trial of postcrisis suicide prevention. Psychiatric Services, 52(6), 828–833.',url:doi('10.1176/appi.ps.52.6.828'),use:'위기 후 짧고 정기적인 안부 연락(돌봄 연락). 위기 후 다시 연락하는 시점의 근거.'},
 {id:'E08',kind:'paper',field:'safety',ref:'Hawton, K., Saunders, K. E. A., & O\'Connor, R. C. (2012). Self-harm and suicide in adolescents. The Lancet, 379(9834), 2373–2382.',url:doi('10.1016/S0140-6736(12)60322-5'),use:'청소년 자해는 흔하고 대부분 드러나지 않으며, 자해 경험은 이후 자살의 주요 위험요인.'},
 {id:'E09',kind:'paper',field:'safety',ref:'Wasserman, D., Hoven, C. W., Wasserman, C., et al. (2015). School-based suicide prevention programmes: The SEYLE cluster-randomised, controlled trial. The Lancet, 385(9977), 1536–1544.',url:doi('10.1016/S0140-6736(14)61213-7'),use:'학교 단위 정신건강 교육(YAM)이 자살시도·심한 자살생각을 줄임. 학교 예방교육 연계의 근거.'},
 {id:'E10',kind:'paper',field:'emotion',ref:'US Preventive Services Task Force (2022). Screening for depression and suicide risk in children and adolescents: Recommendation statement. JAMA, 328(15), 1534–1542.',url:doi('10.1001/jama.2022.16946'),use:'12~18세 우울 선별 권고, 단 선별 후 진단·치료 연결 체계가 있어야 함. 자살위험 선별은 근거 불충분.'},
 {id:'E11',kind:'paper',field:'emotion',ref:'US Preventive Services Task Force (2022). Screening for anxiety in children and adolescents: Recommendation statement. JAMA, 328(14), 1438–1444.',url:doi('10.1001/jama.2022.16936'),use:'8~18세 불안 선별 권고. 정서 영역 발견 뒤 평가·치료 연결을 계획에 넣는 근거.'},
 {id:'E12',kind:'guide',field:'practice',ref:'Brymer, M., Taylor, M., Escudero, P., et al. (2012). Psychological First Aid for Schools: Field Operations Guide (2nd ed.). National Child Traumatic Stress Network.',url:'https://www.nctsn.org/resources/psychological-first-aid-schools-pfa-s-field-operations-guide',use:'위기 직후 학교의 첫 만남: 안전·진정·연결·실제 도움 순서.'},
 {id:'E13',kind:'paper',field:'protect',ref:'Felitti, V. J., Anda, R. F., Nordenberg, D., et al. (1998). Relationship of childhood abuse and household dysfunction to many of the leading causes of death in adults: The Adverse Childhood Experiences (ACE) Study. American Journal of Preventive Medicine, 14(4), 245–258.',url:doi('10.1016/S0749-3797(98)00017-8'),use:'학대·가정 기능 문제 경험이 겹칠수록 장기 건강 결과가 나빠짐.'},
 {id:'E14',kind:'paper',field:'protect',ref:'Hughes, K., Bellis, M. A., Hardcastle, K. A., et al. (2017). The effect of multiple adverse childhood experiences on health: A systematic review and meta-analysis. The Lancet Public Health, 2(8), e356–e366.',url:doi('10.1016/S2468-2667(17)30118-4'),use:'불리한 경험 4개 이상에서 정신건강·폭력·물질 문제 위험이 크게 높아짐. 여러 영역이 겹치면 지원 강도를 올리는 근거.'},
 {id:'E15',kind:'paper',field:'protect',ref:'Finkelhor, D., Ormrod, R. K., & Turner, H. A. (2007). Poly-victimization: A neglected component in child victimization. Child Abuse & Neglect, 31(1), 7–26.',url:doi('10.1016/j.chiabu.2006.06.008'),use:'여러 종류의 피해를 함께 겪는 아동의 증상이 가장 큼. 피해 문항 하나를 보면 다른 피해도 묻는 근거.'},
 {id:'E16',kind:'paper',field:'protect',ref:'Lamb, M. E., Orbach, Y., Hershkowitz, I., Esplin, P. W., & Horowitz, D. (2007). A structured forensic interview protocol improves the quality and informativeness of investigative interviews with children: A review of research using the NICHD Investigative Interview Protocol. Child Abuse & Neglect, 31(11–12), 1201–1231.',url:doi('10.1016/j.chiabu.2007.03.021'),use:'유도·반복 질문은 아동 진술을 흐림. 학교는 들은 말을 그대로 적고 조사 면담은 전문기관에 맡기는 근거.'},
 {id:'E17',kind:'guide',field:'practice',ref:'SAMHSA (2014). SAMHSA\'s Concept of Trauma and Guidance for a Trauma-Informed Approach (HHS Publication No. SMA 14-4884). Substance Abuse and Mental Health Services Administration.',url:'https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs',use:'안전·신뢰·선택·협력·역량 강화 원칙. 재피해를 막고 학생에게 선택권을 주는 면담 방식.'},
 {id:'E18',kind:'paper',field:'peer',ref:'Cook, C. R., Williams, K. R., Guerra, N. G., Kim, T. E., & Sadek, S. (2010). Predictors of bullying and victimization in childhood and adolescence: A meta-analytic investigation. School Psychology Quarterly, 25(2), 65–83.',url:doi('10.1037/a0020149'),use:'피해와 가해를 함께 겪는 학생이 개인·가정·학교 어려움이 가장 큼.'},
 {id:'E19',kind:'paper',field:'peer',ref:'Holt, M. K., Vivolo-Kantor, A. M., Polanin, J. R., et al. (2015). Bullying and suicidal ideation and behaviors: A meta-analysis. Pediatrics, 135(2), e496–e509.',url:doi('10.1542/peds.2014-1864'),use:'괴롭힘 피해·가해 모두 자살생각·행동과 관련. 피해가 있으면 자해·죽음 생각을 직접 확인하는 근거.'},
 {id:'E20',kind:'paper',field:'peer',ref:'Moore, S. E., Norman, R. E., Suetani, S., et al. (2017). Consequences of bullying victimization in childhood and adolescence: A systematic review and meta-analysis. World Journal of Psychiatry, 7(1), 60–76.',url:doi('10.5498/wjp.v7.i1.60'),use:'괴롭힘 피해 뒤 우울·불안·자해·학업 문제 위험 증가.'},
 {id:'E21',kind:'paper',field:'digital',ref:'Whittle, H., Hamilton-Giachritsis, C., Beech, A., & Collings, G. (2013). A review of online grooming: Characteristics and concerns. Aggression and Violent Behavior, 18(1), 62–70.',url:doi('10.1016/j.avb.2012.09.003'),use:'그루밍은 신뢰 쌓기→고립→성적 요구 순서로 진행. 처음 만난 사람과의 비밀 연락을 확인하는 근거.'},
 {id:'E22',kind:'guide',field:'digital',ref:'Thorn & National Center for Missing & Exploited Children (2024). Trends in Financial Sextortion: An investigation of sextortion reports in NCMEC CyberTipline data.',url:'https://www.thorn.org/research/library/financial-sextortion/',use:'금전형 성착취가 10대 남학생 중심으로 급증. 돈을 보내지 않고 대화·자료를 지우지 않은 채 신고하도록 안내.'},
 {id:'E23',kind:'paper',field:'digital',ref:'Orben, A., & Przybylski, A. K. (2019). The association between adolescent well-being and digital technology use. Nature Human Behaviour, 3(2), 173–182.',url:doi('10.1038/s41562-018-0506-1'),use:'디지털 이용 시간과 웰빙의 관련은 매우 작음. 시간보다 기능 저하를 보는 근거.'},
 {id:'E24',kind:'guide',field:'digital',ref:'WHO Regional Office for Europe (2024). A focus on adolescent social media use and gaming in Europe, central Asia and Canada: Health Behaviour in School-aged Children international report from the 2021/2022 survey, Volume 6.',url:'https://www.who.int/europe/de/news/item/25-09-2024-teens--screens-and-mental-health',use:'문제적 소셜미디어 사용이 2018년 7%에서 2022년 11%로 증가. 조절 실패와 생활 지장을 기준으로 봄.'},
 {id:'E25',kind:'paper',field:'behavior',ref:'Knight, J. R., Sherritt, L., Shrier, L. A., Harris, S. K., & Chang, G. (2002). Validity of the CRAFFT substance abuse screening test among adolescent clinic patients. Archives of Pediatrics & Adolescent Medicine, 156(6), 607–614.',url:doi('10.1001/archpedi.156.6.607'),use:'청소년 물질 사용은 짧은 질문으로 확인하고 간단 개입·의뢰로 이음.'},
 {id:'E26',kind:'paper',field:'school',ref:'Kearney, C. A. (2002). Identifying the function of school refusal behavior: A revision of the School Refusal Assessment Scale. Journal of Psychopathology and Behavioral Assessment, 24(4), 235–245.',url:doi('10.1023/A:1020774932043'),use:'등교 거부의 네 기능(불편 피하기, 평가 상황 피하기, 관심 얻기, 학교 밖 보상). 결석 이유에 따라 도움이 다름.'},
 {id:'E27',kind:'paper',field:'school',ref:'Heyne, D., Gren-Landell, M., Melvin, G., & Gentle-Genitty, C. (2019). Differentiation between school attendance problems: Why and how? Cognitive and Behavioral Practice, 26(1), 8–34.',url:doi('10.1016/j.cbpra.2018.03.006'),use:'등교 거부·무단결석·학교 배제·부모에 의한 결석을 구분해야 맞는 지원을 고름.'},
 {id:'E28',kind:'paper',field:'school',ref:'Gubbels, J., van der Put, C. E., & Assink, M. (2019). Risk factors for school absenteeism and dropout: A meta-analytic review. Journal of Youth and Adolescence, 48(9), 1637–1667.',url:doi('10.1007/s10964-019-01072-5'),use:'결석·학업중단 위험요인은 개인·가정·학교에 걸쳐 있음. 출결만 따로 다루지 않는 근거.'},
 {id:'E29',kind:'paper',field:'school',ref:'Fuchs, D., & Fuchs, L. S. (2006). Introduction to response to intervention: What, why, and how valid is it? Reading Research Quarterly, 41(1), 93–99.',url:doi('10.1598/RRQ.41.1.4'),use:'단계적 지원(1단계 교실→2단계 소집단→3단계 개별). 교실 조정의 효과 기록이 다음 단계를 정함.'},
 {id:'E30',kind:'guide',field:'access',ref:'CAST (2018). Universal Design for Learning Guidelines version 2.2.',url:'https://udlguidelines.cast.org/',use:'설명·참여·표현 방식을 여러 갈래로 두어 진단 없이도 참여 장벽을 낮춤.'},
 {id:'E31',kind:'paper',field:'family',ref:'Lacey, R. E., Xue, B., & McMunn, A. (2022). The mental and physical health of young carers: A systematic review. The Lancet Public Health, 7(9), e787–e796.',url:doi('10.1016/S2468-2667(22)00161-X'),use:'가족을 돌보는 청소년은 정서·신체 건강 어려움이 더 많음. 대체 돌봄을 먼저 연결하는 근거.'},
 {id:'E32',kind:'paper',field:'econ',ref:'Shankar, P., Chung, R., & Frank, D. A. (2017). Association of food insecurity with children\'s behavioral, emotional, and academic outcomes: A systematic review. Journal of Developmental & Behavioral Pediatrics, 38(2), 135–150.',url:doi('10.1097/DBP.0000000000000383'),use:'끼니 부족은 아동의 정서·행동·학업 문제와 함께 나타남.'},
 {id:'E33',kind:'paper',field:'practice',ref:'Evans, G. W., Li, D., & Whipple, S. S. (2013). Cumulative risk and child development. Psychological Bulletin, 139(6), 1342–1396.',url:doi('10.1037/a0031808'),use:'위험요인 하나보다 개수가 늘수록 발달 결과가 누적적으로 나빠짐. 영역이 겹칠수록 공동사정·다기관으로 올리는 근거.'},
 {id:'E34',kind:'paper',field:'relation',ref:'Masten, A. S. (2001). Ordinary magic: Resilience processes in development. American Psychologist, 56(3), 227–238.',url:doi('10.1037/0003-066X.56.3.227'),use:'회복탄력성은 돌보는 어른·유능감·소속 같은 평범한 보호체계에서 나옴.'},
 {id:'E35',kind:'paper',field:'relation',ref:'Wyman, P. A., Pickering, T. A., Pisani, A. R., et al. (2019). Peer-adult network structure and suicide attempts in 38 high schools: Implications for network-informed suicide prevention. Journal of Child Psychology and Psychiatry, 60(10), 1065–1075.',url:doi('10.1111/jcpp.13102'),use:'믿을 만한 어른과 연결된 학생이 많은 학교일수록 자살시도가 적음. 신뢰 어른 한 명을 정하는 근거.'},
 {id:'E36',kind:'paper',field:'practice',ref:'Lundy, L. (2007). \'Voice\' is not enough: Conceptualising Article 12 of the United Nations Convention on the Rights of the Child. British Educational Research Journal, 33(6), 927–942.',url:doi('10.1080/01411920701657033'),use:'공간·목소리·청중·영향. 학생 의견을 듣는 데서 끝내지 않고 계획에 반영하고 알려 주는 근거.'},
 {id:'E37',kind:'book',field:'practice',ref:'Bronfenbrenner, U. (1979). The Ecology of Human Development: Experiments by Nature and Design. Harvard University Press.',url:'',use:'개인·가정·학교·지역을 함께 보는 생태체계 관점. 생태체계 지도와 기관 역할 나누기의 이론 바탕.'},
 {id:'E38',kind:'paper',field:'practice',ref:'Suter, J. C., & Bruns, E. J. (2009). Effectiveness of the wraparound process for children with emotional and behavioral disorders: A meta-analysis. Clinical Child and Family Psychology Review, 12(4), 336–351.',url:doi('10.1007/s10567-009-0059-y'),use:'복합 욕구 아동에게 한 팀·한 계획으로 움직이는 방식의 효과. 통합사례관리(2개 이상 기관)의 근거.'},
 {id:'E39',kind:'paper',field:'practice',ref:'Fazel, M., Hoagwood, K., Stephan, S., & Ford, T. (2014). Mental health interventions in schools in high-income countries. The Lancet Psychiatry, 1(5), 377–387.',url:doi('10.1016/S2215-0366(14)70312-8'),use:'학교 정신건강은 보편 예방·선별 지원·집중 지원의 단계 구조. 개입 수준 5단계의 틀.'},
 {id:'E40',kind:'book',field:'behavior',ref:'Borum, R., Bartel, P., & Forth, A. (2006). Manual for the Structured Assessment of Violence Risk in Youth (SAVRY). Psychological Assessment Resources.',url:'',use:'구조화된 전문가 판단: 정해진 문항을 보되 최종 판단은 전문가가 하고 보호요인을 함께 봄. OY-RALS 전체 구조의 모형.'},
 {id:'E41',kind:'paper',field:'measure',ref:'Smith, P. C., & Kendall, L. M. (1963). Retranslation of expectations: An approach to the construction of unambiguous anchors for rating scales. Journal of Applied Psychology, 47(2), 149–155.',url:doi('10.1037/h0047060'),use:'점수마다 구체적 행동 예시(앵커)를 두면 평가자 간 차이가 줄어듦. 0~4점 기준 문장 연구과제의 근거.'},
 {id:'E42',kind:'paper',field:'measure',ref:'Goodman, R. (1997). The Strengths and Difficulties Questionnaire: A research note. Journal of Child Psychology and Psychiatry, 38(5), 581–586.',url:doi('10.1111/j.1469-7610.1997.tb01545.x'),use:'증상과 함께 일상 기능 지장(영향)을 따로 확인. 문항이 기능 저하를 묻는 근거.'},
 {id:'E43',kind:'book',field:'practice',ref:'Naar, S., & Suarez, M. (2021). Motivational Interviewing with Adolescents and Young Adults (2nd ed.). Guilford Press.',url:'',use:'청소년 면담에서 설득보다 학생의 이유와 바람을 끌어내는 대화. 면담 질문 문장의 바탕.'},
 {id:'E44',kind:'law',field:'family',ref:'가족돌봄 등 위기아동·청년 지원에 관한 법률 (2025년 제정, 2026년 3월 시행).',url:'https://www.law.go.kr/',use:'가족을 돌보는 아동·청년을 발굴·지원하는 법적 근거. 세부 연령 기준은 시행령 원문 확인 필요.'},
 {id:'E45',kind:'law',field:'digital',ref:'아동·청소년의 성보호에 관한 법률 제15조의2(아동·청소년에 대한 성착취 목적 대화 등), 2021년 9월 24일 시행.',url:'https://www.law.go.kr/',use:'성착취 목적의 온라인 대화·유인만으로도 범죄. 사진 전송 전 단계에서 신고할 수 있음.'},
 {id:'E46',kind:'book',field:'protect',ref:'Turnell, A., & Edwards, S. (1999). Signs of Safety: A Solution and Safety Oriented Approach to Child Protection Casework. W. W. Norton.',url:'',use:'걱정·잘 되고 있는 것·필요한 것을 가족과 함께 정리하는 아동보호 방식. 보호자와 안전계획을 세우는 근거.'},
 {id:'E47',kind:'law',field:'practice',ref:'유엔 아동권리협약(UN Convention on the Rights of the Child, 1989) 제12조 아동 의견 존중. 대한민국 1991년 비준.',url:'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child',use:'자신에게 영향을 주는 결정에 의견을 말하고 그 의견이 존중될 권리.'},
 {id:'V1',kind:'video',field:'safety',ref:'NIMH (미국 국립정신건강연구원). Ask Suicide-Screening Questions (ASQ) Toolkit: 진행 스크립트·교육 영상(외래·응급·입원용).',url:'https://www.nimh.nih.gov/ASQ',use:'자살 관련 질문을 묻고 답을 받는 실제 말투와 순서. 의료 환경용이므로 학교에서는 문장 예시로만 참고.'},
 {id:'V2',kind:'video',field:'safety',ref:'한국생명존중희망재단(중앙자살예방센터). 「보고 듣고 말하기」 자살예방 생명지킴이 교육(청소년·교직원·일반인 과정).',url:'',use:'신호 보기→이야기 듣기→전문기관 연결 말하기의 3단계. 교직원 연수 자료로 연결.'},
 {id:'V3',kind:'video',field:'protect',ref:'아동권리보장원. 아동학대 신고의무자 교육(직군별 온라인 교육 영상).',url:'',use:'신고의무자는 의심만으로 신고, 아동에게 반복 진술을 요구하지 않기. 교직원 법정 교육과 연결.'}
];
const byId=Object.fromEntries(E.map(e=>[e.id,e]));
// Why each domain's first steps look the way they do. Text stays free of item numbers and scores (reader-facing).
const DOMAIN=[
 {name:'아동학대·보호',why:'신고의무는 확신이 아니라 의심에서 생기고, 반복되거나 유도하는 질문은 아이의 진술을 흐리고 상처를 다시 건드릴 수 있습니다. 그래서 들은 말을 그대로 적고 조사 면담은 전문기관에 맡깁니다.',ev:['E16','E17','E13','E46','V3'],old:['14']},
 {name:'학교폭력·또래 안전',why:'괴롭힘 피해는 이후 우울·자살생각과 함께 나타나는 경우가 많고, 피해와 가해를 함께 겪는 학생의 어려움이 가장 큽니다. 그래서 피해가 있으면 죽고 싶은 마음까지 직접 묻고, 행동한 학생의 피해 경험도 함께 살핍니다.',ev:['E19','E20','E18','E15'],old:['13']},
 {name:'자해·정서·정신건강',why:'자해·죽음에 대해 직접 물어도 생각이 늘지 않으며, 안전계획을 함께 쓰고 다시 연락한 경우 자살행동이 줄었습니다. 위험 등급으로 예측하기보다 지금의 생각·계획·도울 사람을 직접 확인하고, 정서 어려움은 실제 상담·치료 연결까지 챙깁니다.',ev:['E04','E05','E06','E07','E03','E10','E11','V1','V2'],old:['9','18']},
 {name:'학습·출결',why:'같은 결석이라도 피하고 싶은 것이 있는지, 혼자 남기 싫은지, 학교 밖에 끌리는 것이 있는지에 따라 맞는 도움이 다릅니다. 학습 어려움은 진단을 기다리지 않고 교실 조정을 먼저 해 보고 그 효과를 기록하면 다음 지원을 정하는 근거가 됩니다.',ev:['E26','E27','E28','E29'],old:[]},
 {name:'행동·건강 안전',why:'행동 위험은 점수 하나보다 행동 앞뒤의 상황과 보호요인을 함께 볼 때 실제 계획에 쓸 수 있습니다. 물질 사용은 짧게 확인하고 간단한 개입이나 의뢰로 이어 갑니다.',ev:['E40','E25'],old:[]},
 {name:'장애·발달 및 접근성',why:'참여가 막히는 이유는 학생의 특성보다 설명·환경·수업 방식이 맞지 않아서인 경우가 많아, 진단명보다 조정을 먼저 찾습니다.',ev:['E30'],old:['7']},
 {name:'가족·돌봄',why:'가족을 돌보는 청소년은 정서·신체 건강 어려움이 더 많아, 쉬라고 말하기보다 학생 대신 돌볼 어른과 서비스를 먼저 연결해야 휴식이 생깁니다. 2026년 3월부터 가족돌봄 아동·청년 지원의 법적 근거가 있습니다.',ev:['E31','E44'],old:['15']},
 {name:'경제·주거',why:'끼니·생활자원 부족은 아이의 정서·행동·학업 어려움과 함께 나타나고, 어려움이 겹칠수록 영향이 커집니다. 기본생활을 낙인 없는 방식으로 먼저 채우면 다른 지원이 힘을 받습니다.',ev:['E32','E33'],old:[]},
 {name:'관계·지지체계',why:'믿을 만한 어른과 연결된 학생이 많은 학교일수록 자살시도가 적었고, 회복탄력성은 평범한 보호 관계에서 나옵니다. 그래서 학생이 고른 어른 한 명과 정기적으로 만나는 것부터 시작합니다.',ev:['E35','E34'],old:['4','5']},
 {name:'디지털·온라인 안전',why:'이용 시간 자체와 웰빙의 관련은 매우 작아 시간보다 잠·수업·만남의 지장을 봅니다. 그루밍은 신뢰 쌓기에서 고립, 요구로 진행되고 금전형 성착취가 늘고 있어, 돈을 보내지 않고 대화·자료를 지우지 않은 채 신고하도록 돕습니다. 성착취 목적 대화만으로도 범죄입니다.',ev:['E23','E24','E21','E22','E45'],old:['6','8']}
];
// Intervention levels (oy-deep-interpretation L ids). The contact counts are local operating rules, not research findings.
const LEVEL={
 note:'접촉 빈도와 회의 시점은 연구에서 나온 수치가 아니라 이 시스템의 운영 기준입니다. 기관 기준에 맞춰 조정합니다.',
 monitor:{why:'보편 예방 단계: 관계를 유지하며 변화를 지켜봅니다.',ev:['E39','E29']},
 brief:{why:'선별 지원 단계: 한 영역을 담당자가 직접 돕고 효과를 기록합니다.',ev:['E39','E29']},
 general:{why:'두 개 이상 생활영역이 겹치면 결과가 누적적으로 나빠져, 학교와 복지가 역할을 나눕니다.',ev:['E33','E37']},
 intensive:{why:'복합 욕구에는 여러 기관이 한 팀·한 계획으로 움직이는 방식이 효과가 있습니다.',ev:['E38','E33','E14']},
 crisis:{why:'위기 직후에는 안전·진정·연결이 먼저이며, 안전계획과 정기적인 후속 연락이 자살행동을 줄였습니다.',ev:['E12','E06','E07']}
};
// Cross-cutting rules: what the system does and why.
const RULES=[
 {id:'safety-first',rule:'안전 문항은 1점부터, 총점과 따로 즉시 확인합니다.',ev:['E01','E02'],old:['9','14']},
 {id:'no-risk-grade',rule:'자살위험을 저·중·고 등급으로 나누지 않고 지금의 안전과 욕구를 직접 확인합니다.',ev:['E03'],old:['9']},
 {id:'ask-directly',rule:'자해·죽음에 대해 돌려 말하지 않고 직접 묻습니다.',ev:['E04','E05']},
 {id:'unknown',rule:'미상은 0점이 아니며 확인 전까지 전체 판단을 보류합니다.',ev:['E42'],old:['17']},
 {id:'cumulative',rule:'어려움이 모인 영역이 늘수록 공동사정·다기관 지원으로 올립니다.',ev:['E33','E14','E15']},
 {id:'integrated',rule:'통합사례관리는 2개 이상 기관의 전문적 개입이 필요할 때 선정합니다(학교와 Wee는 하나).',ev:['E38','E37'],old:['10','11','12']},
 {id:'voice',rule:'학생이 원하는 도움을 듣고, 그 의견이 계획을 어떻게 바꿨는지 학생에게 알려 줍니다.',ev:['E36','E47']},
 {id:'spj',rule:'점수와 규칙은 판단을 돕는 구조이며 최종 판단은 담당자와 사례회의가 합니다.',ev:['E40'],old:['2','3']},
 {id:'anchors',rule:'0~4점 기준 문장과 평가자 간 일치는 아직 검증되지 않았습니다(연구과제).',ev:['E41'],old:['17']}
];
// Extra non-scoring checks the interpretation shows (CORE unchanged).
const CHECKS=[
 {id:'housing-tonight',when:v=>v(20)>=3,text:'주거가 불안정하거나 안전하지 않다고 응답되었습니다. 오늘 밤 안전하게 머물 곳이 있는지 먼저 확인합니다.',ev:['E33']},
 {id:'bullying-ask',when:v=>v(3)>=2&&!(v(7)>=1),text:'괴롭힘 피해가 응답되었습니다. 자해·죽음 문항이 보고 없음이나 미상이어도 "요즘 죽고 싶다는 생각까지 든 적이 있는지" 한 번 직접 물어 확인합니다.',ev:['E19','E04']}
];
const ids=list=>Array.from(new Set(list)).filter(id=>byId[id]);
function forCase(domainIdx,levelId,checkIds){
 const out=[];(domainIdx||[]).forEach(i=>DOMAIN[i]&&out.push(...DOMAIN[i].ev));
 if(levelId&&LEVEL[levelId])out.push(...LEVEL[levelId].ev);
 (checkIds||[]).forEach(id=>{const c=CHECKS.find(x=>x.id===id);if(c)out.push(...c.ev)});
 ['E01','E03','E40'].forEach(id=>out.push(id));
 return ids(out).map(id=>byId[id]);
}
function checks(values){
 const v=n=>{const x=values&&values[n-1];return typeof x==='number'?x:-1};
 return CHECKS.filter(c=>c.when(v)).map(c=>({id:c.id,text:c.text,ev:c.ev.slice()}));
}
const cite=list=>'['+list.join(', ')+']';
const api=Object.freeze({VERSION,CHECKED,KINDS,FIELDS,SOURCES:E,byId,DOMAIN,LEVEL,RULES,CHECKS,forCase,checks,cite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYEvidence=api;
})(typeof window!=='undefined'?window:globalThis);
