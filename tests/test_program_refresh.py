import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('refresh', ROOT / 'scripts/program_refresh.py')
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)


class ProgramRefreshTests(unittest.TestCase):
    def setUp(self):
        self.feed = json.loads((ROOT / 'docs/programs.json').read_text(encoding='utf-8'))
        self.config = {'sourceUrl': 'https://official.example/list', 'hosts': ['official.example'], 'organizationId': '1'}
        self.at = '2026-11-10T09:00:00+09:00'
        self.p = dict(id='notice-1', sourceId='test', organizationId='1', organization='기관', title='사업',
                      target='공고 대상', method='공고 신청방법', summary='공고 내용', periodText='공고 기간',
                      verifiedOn='2026-11-10', sourceUrl='https://official.example/notice/1',
                      evidenceType='official_notice', evidenceNote='개별 공고 확인', status='확인 필요')

    def apply(self, programs=None, error=None, feed=None):
        return R.apply_attempt(feed or self.feed, 'test', self.config, {'1': '기관'}, self.at, programs, error)

    def test_failure_only_changes_attempt_and_error(self):
        before = copy.deepcopy(self.feed)
        result = R.apply_attempt(before, 'welinfo', self.config, {}, self.at, error='접근 오류')
        expected = copy.deepcopy(before)
        expected.update(lastAttemptAt=self.at, lastError='접근 오류')
        self.assertEqual(result, expected)
        self.assertEqual(before, self.feed)

    def test_fallback_success_isolated_and_upsert_preserves_missing(self):
        result = self.apply([self.p])
        self.assertEqual(result['lastSuccessAt'], self.feed['lastSuccessAt'])
        self.assertEqual(result['lastError'], self.feed['lastError'])
        self.assertEqual(result['programs'][:-1], self.feed['programs'])
        self.assertEqual(result['sources']['test']['lastSuccessAt'], self.at)
        self.assertEqual(self.apply([self.p], feed=result), result)
        failed = self.apply(error='상세 공고 비어 있음', feed=result)
        self.assertEqual(failed['programs'], result['programs'])
        self.assertEqual(failed['sources']['test']['lastSuccessAt'], self.at)

    def test_invalid_batches_are_atomic(self):
        for invalid in ([], [None], ['not a notice'], [self.p, {**self.p, 'id': 'bad', 'organizationId': 'unknown'}],
                        [{**self.p, 'sourceUrl': 'https://official.example.evil/notice'}],
                        [{**self.p, 'target': ''}], [{**self.p, 'evidenceType': 'list_only'}],
                        [{**self.p, 'opensOn': '2026-02-30'}], [{**self.p, 'opensOn': '20261110'}], [self.p, self.p]):
            with self.subTest(invalid=invalid):
                result = self.apply(invalid)
                self.assertEqual(result['programs'], self.feed['programs'])
                self.assertTrue(result['sources']['test']['lastError'])
                self.assertNotIn('lastSuccessAt', result['sources']['test'])

    def test_id_conflicts_rejected(self):
        result = self.apply([{**self.p, 'id': self.feed['programs'][0]['id']}])
        self.assertEqual(result['programs'], self.feed['programs'])
        self.assertTrue(result['sources']['test']['lastError'])

    def test_monthly_first_actual_run_and_korean_month_boundary(self):
        self.assertTrue(R.run_scope('2026-11-09T09:00:00+09:00', '2026-10-26T09:00:00+09:00')['resourceReview'])
        self.assertFalse(R.run_scope('2026-11-09T09:00:00+09:00', '2026-11-02T09:00:00+09:00')['resourceReview'])
        self.assertTrue(R.run_scope('2026-10-31T15:00:00Z', '2026-10-31T14:59:00Z')['resourceReview'])
        self.assertTrue(R.run_scope('2027-01-04T09:00:00+09:00', '2026-12-28T09:00:00+09:00')['resourceReview'])
        self.assertTrue(R.run_scope(self.at)['resourceReview'])
        with self.assertRaises(ValueError):
            R.run_scope(self.at, '2026-12-01T09:00:00+09:00')


if __name__ == '__main__':
    unittest.main()
