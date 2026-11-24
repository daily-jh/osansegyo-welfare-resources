import copy, hashlib, json, shutil, sys, tempfile, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import public_api_refresh as p  # noqa: E402

NOW = '2026-11-24T21:00:00+09:00'


def xml(items, total=None):
    body = ''.join('<servList>' + ''.join(f'<{k}>{v}</{k}>' for k, v in i.items()) + '</servList>' for i in items)
    return (f'<response><header><resultCode>0</resultCode></header><body><totalCount>{total or len(items)}</totalCount>'
            f'{body}</body></response>').encode('utf-8')


class PublicApiRefresh(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / 'data').mkdir()
        for name in ('organizations.csv', 'services.csv', 'contacts.csv'):
            shutil.copy(ROOT / 'data' / name, self.tmp / 'data' / name)
        self.fx = self.tmp / 'fx'
        self.fx.mkdir()
        self.config = json.loads((ROOT / 'data/public-api-sources.json').read_text(encoding='utf-8'))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def write(self, name, raw):
        (self.fx / name).write_bytes(raw)

    def fixtures_ok(self):
        self.write('ssis-local-osan-p1.xml', xml([
            {'servId': 'L1', 'servNm': '청소년 심리상담', 'sggNm': '오산시', 'ctpvNm': '경기도', 'servDgst': '상담'},
            {'servId': 'L2', 'servNm': '오산시 청소년 교통비 지원', 'sggNm': '오산시', 'ctpvNm': '경기도', 'servDgst': '교통비'},
        ]))
        self.write('ssis-local-gyeonggi-p1.xml', xml([
            {'servId': 'G1', 'servNm': '경기도 청년 마음건강 지원', 'sggNm': '', 'ctpvNm': '경기도', 'servDgst': '심리상담'},
            {'servId': 'G2', 'servNm': '수원시 출산축하금', 'sggNm': '수원시', 'ctpvNm': '경기도', 'servDgst': '현금'},
            {'servId': 'G3', 'servNm': '(파주시)무연고 사망자 장례비 지원', 'sggNm': '', 'ctpvNm': '경기도', 'bizChrDeptNm': '경기도 파주시 복지정책국 노인장애인과'},
            {'servId': 'G4', 'servNm': '정신질환자 치료지원사업', 'sggNm': '', 'ctpvNm': '경기도', 'bizChrDeptNm': '경기도 안양시 보건소'},
            {'servId': 'G5', 'servNm': '경기도 청소년복지시설 퇴소청소년 자립정착금 지급', 'sggNm': '', 'ctpvNm': '경기도', 'bizChrDeptNm': '경기도 미래평생교육국 청소년과'},
        ]))
        self.write('ssis-national-national-p1.xml', xml([
            {'servId': 'N1', 'servNm': '자립준비청년 자립수당', 'servDgst': '보호종료 청년 지원', 'jurMnofNm': '보건복지부'},
            {'servId': 'N2', 'servNm': '농지연금', 'servDgst': '고령 농업인 노후', 'jurMnofNm': '농식품부'},
            {'servId': 'N3', 'servNm': '석면피해구제급여', 'servDgst': '석면 피해자 의료비', 'jurMnofNm': '환경부'},
            {'servId': 'N4', 'servNm': '보훈가족 심리재활서비스 지원', 'servDgst': '심리 상담', 'jurMnofNm': '국가보훈부'},
        ]))

    def test_osan_required_gyeonggi_province_level_and_national_representative_only(self):
        self.fixtures_ok()
        status, payload, failures = p.run(self.config, self.tmp, NOW, fixtures=self.fx, env={})
        self.assertEqual(failures, [])
        names = {r['name']: r for r in payload['items']}
        self.assertEqual(names['청소년 심리상담']['change'], '기존과 일치')
        self.assertEqual(names['청소년 심리상담']['match_id'], 'SVC-00023')
        self.assertEqual(names['오산시 청소년 교통비 지원']['change'], '신규 후보')
        self.assertIn('경기도 청년 마음건강 지원', names)
        self.assertNotIn('수원시 출산축하금', names)          # 시군구 사업은 경기도 수집에서 제외
        self.assertIn('자립준비청년 자립수당', names)
        self.assertIn('independence', names['자립준비청년 자립수당']['area'])
        self.assertNotIn('농지연금', names)                    # 전국은 대표 영역만
        self.assertNotIn('석면피해구제급여', names)            # '피해자'만으로는 대표 영역 아님
        self.assertNotIn('보훈가족 심리재활서비스 지원', names)  # 제외 낱말
        self.assertNotIn('(파주시)무연고 사망자 장례비 지원', names)  # 경기도 수집의 시·군 사업
        self.assertNotIn('정신질환자 치료지원사업', names)
        self.assertIn('경기도 청소년복지시설 퇴소청소년 자립정착금 지급', names)
        self.assertEqual(status['runs']['ssis-local:osan']['lastSuccessAt'], NOW)
        self.assertTrue(status['runs']['ssis-local:osan']['required'])

    def test_source_tables_are_never_modified(self):
        self.fixtures_ok()
        before = {f: hashlib.sha256((self.tmp / 'data' / f).read_bytes()).hexdigest() for f in ('organizations.csv', 'services.csv', 'contacts.csv')}
        status, payload, _ = p.run(self.config, self.tmp, NOW, fixtures=self.fx, env={})
        p.write_outputs(self.tmp, status, payload)
        after = {f: hashlib.sha256((self.tmp / 'data' / f).read_bytes()).hexdigest() for f in before}
        self.assertEqual(before, after)
        csv_text = (self.tmp / 'docs/public-api/candidates.csv').read_text(encoding='utf-8-sig')
        self.assertNotIn('기존과 일치', csv_text)
        self.assertNotIn('확인완료', csv_text)

    def test_missing_key_is_recorded_and_required_run_fails(self):
        status, payload, failures = p.run(self.config, self.tmp, NOW, env={})
        self.assertIn('ssis-local:osan', failures)
        self.assertIn('DATA_GO_KR_KEY', status['runs']['ssis-local:osan']['lastError'])
        self.assertNotIn('lastSuccessAt', status['runs']['ssis-local:osan'])

    def test_key_is_redacted_from_errors_and_outputs(self):
        secret = 'SeCrEt+Key/123=='

        def boom(source, params, key):
            raise OSError('failed url https://x?serviceKey=' + key)

        status, payload, _ = p.run(self.config, self.tmp, NOW, env={'DATA_GO_KR_KEY': secret}, fetcher=boom)
        p.write_outputs(self.tmp, status, payload)
        for f in ('status.json', 'candidates.json', 'candidates.csv'):
            self.assertNotIn(secret, (self.tmp / 'docs/public-api' / f).read_text(encoding='utf-8-sig'))
        self.assertIn('***', status['runs']['ssis-local:osan']['lastError'])

    def test_failed_run_keeps_previous_candidates(self):
        self.fixtures_ok()
        status, payload, _ = p.run(self.config, self.tmp, NOW, fixtures=self.fx, env={})
        p.write_outputs(self.tmp, status, payload)
        (self.fx / 'ssis-local-osan-p1.xml').unlink()           # 다음 실행에서 오산 응답 없음
        status2, payload2, failures2 = p.run(self.config, self.tmp, '2026-12-01T21:00:00+09:00', fixtures=self.fx, env={})
        self.assertIn('ssis-local:osan', failures2)
        self.assertIn('오산시 청소년 교통비 지원', {r['name'] for r in payload2['items']})
        self.assertEqual(status2['runs']['ssis-local:osan']['lastSuccessAt'], NOW)

    def test_api_error_payload_is_failure_not_empty_success(self):
        self.fixtures_ok()
        self.write('ssis-local-osan-p1.xml', b'<OpenAPI_ServiceResponse><cmmMsgHeader><returnReasonCode>30</returnReasonCode>'
                   b'<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>')
        status, _, failures = p.run(self.config, self.tmp, NOW, fixtures=self.fx, env={})
        self.assertIn('ssis-local:osan', failures)
        self.assertIn('SERVICE_KEY_IS_NOT_REGISTERED', status['runs']['ssis-local:osan']['lastError'])

    def test_facility_source_flags_phone_difference_and_filters_address(self):
        cfg = copy.deepcopy(self.config)
        src = next(s for s in cfg['sources'] if s['id'] == 'mogef-youth-counsel')
        src.update(enabled=True, endpoint='https://example.invalid/api', itemPath='item',
                   regionRuns=[{'region': 'osan', 'params': {}}],
                   fields={'name': 'fcltyNm', 'address': 'rdnmadr', 'phone': 'telno'})
        cfg['sources'] = [src]
        self.write('mogef-youth-counsel-osan-p1.json', json.dumps({'response': {'body': {'items': {'item': [
            {'fcltyNm': '오산시청소년상담복지센터', 'rdnmadr': '경기도 오산시 오산로278번길 3', 'telno': '031-000-0000'},
            {'fcltyNm': '수원시청소년상담복지센터', 'rdnmadr': '경기도 수원시 팔달구', 'telno': '031-111-1111'},
        ]}}}}, ensure_ascii=False).encode('utf-8'))
        src['itemPath'] = 'items'
        status, payload, failures = p.run(cfg, self.tmp, NOW, fixtures=self.fx, env={})
        self.assertEqual(failures, [])
        self.assertEqual(len(payload['items']), 1)
        row = payload['items'][0]
        self.assertEqual(row['change'], '정보 다름')
        self.assertEqual(row['match_id'], '6dff4fa866')
        self.assertIn('전화', row['field_diffs'])

    def test_config_contract(self):
        regions = self.config['regions']
        self.assertTrue(regions['osan']['required'])
        self.assertEqual(regions['osan']['sggNm'], '오산시')
        self.assertTrue(regions['national']['representativeOnly'])
        ids = [s['id'] for s in self.config['sources']]
        self.assertEqual(len(ids), len(set(ids)))
        for s in self.config['sources']:
            self.assertIn(s['kind'], ('service', 'facility'))
            self.assertTrue(s['keyEnv'].isupper())
            for r in s['regionRuns']:
                self.assertIn(r['region'], regions)
            if s['enabled']:
                self.assertTrue(s['endpoint'].startswith('https://'))
        enabled_osan = [s for s in self.config['sources'] if s['enabled'] and any(r['region'] == 'osan' for r in s['regionRuns'])]
        self.assertTrue(enabled_osan, '오산 수집이 하나 이상 켜져 있어야 함')


if __name__ == '__main__':
    unittest.main()
