import sys, unittest
from datetime import date
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
import monthly_recheck as M


class MonthlyRecheckTest(unittest.TestCase):
    def test_overdue_comes_first_and_is_read_only(self):
        before = (M.ROOT / 'data/services.csv').read_bytes()
        rows, _ = M.build(date(2026, 11, 11), 30)
        self.assertEqual((M.ROOT / 'data/services.csv').read_bytes(), before)
        kinds = [r['구분'] for r in rows]
        self.assertEqual(kinds, sorted(kinds, key=['예정일 지남', '이번 기간 예정', '확인 기록 없음'].index))
        for r in rows:
            if r['구분'] == '예정일 지남':
                self.assertLess(r['다음 확인'], '2026-11-11')
            if r['구분'] == '이번 기간 예정':
                self.assertTrue('2026-11-11' <= r['다음 확인'] <= '2026-12-11')


if __name__ == '__main__':
    unittest.main()
