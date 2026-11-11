#!/usr/bin/env python3
"""월간 자료 확인 목록: 이번 달에 다시 확인할 서비스와 확인이 비어 있는 기관을 한 장으로 뽑는다.

자료를 바꾸지 않는다(읽기 전용). 담당자가 이 목록을 보고 공식 자료로 확인한 뒤
data/services.csv의 verified_on·next_check_on과 data/verification_log.csv를 직접 고친다.
검증 완료는 사람이 확인했을 때만 적는다.

  python scripts/monthly_recheck.py                      # 오늘(한국 시각) 기준, 앞으로 30일 안 예정까지
  python scripts/monthly_recheck.py --date 2026-12-01 --days 31
  python scripts/monthly_recheck.py --csv out.csv        # 표 파일로도 저장
"""
import argparse, csv, sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(name):
    with open(ROOT / 'data' / name, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def build(day, days):
    orgs = {o['org_id']: o for o in read('organizations.csv')}
    until = (day + timedelta(days=days)).isoformat()
    today = day.isoformat()
    rows = []
    for s in read('services.csv'):
        nxt = s.get('next_check_on', '')
        o = orgs.get(s['org_id'], {})
        if nxt and nxt < today:
            why = '예정일 지남'
        elif nxt and nxt <= until:
            why = '이번 기간 예정'
        elif not s.get('verified_on'):
            why = '확인 기록 없음'
        else:
            continue
        rows.append({'구분': why, '다음 확인': nxt or '-', '기관': o.get('기관명', ''), '범주': o.get('범주', ''),
                     '서비스': s['서비스명'], '현재 상태': s.get('verification_status', ''),
                     '마지막 확인': s.get('verified_on') or '-', '근거 URL': s.get('source_url') or o.get('근거URL', ''),
                     'service_id': s['service_id']})
    order = {'예정일 지남': 0, '이번 기간 예정': 1, '확인 기록 없음': 2}
    rows.sort(key=lambda r: (order[r['구분']], r['다음 확인'], r['범주'] != '오산시', r['기관'], r['서비스']))
    no_addr = [o for o in orgs.values() if o.get('address_status') == '미확인']
    return rows, no_addr


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    kst = datetime.now(timezone(timedelta(hours=9))).date()
    p.add_argument('--date', default=kst.isoformat())
    p.add_argument('--days', type=int, default=30)
    p.add_argument('--csv')
    a = p.parse_args(argv)
    day = date.fromisoformat(a.date)
    rows, no_addr = build(day, a.days)
    count = {k: sum(r['구분'] == k for r in rows) for k in ['예정일 지남', '이번 기간 예정', '확인 기록 없음']}
    print(f'# 월간 자료 확인 목록 · 기준 {day} · 앞으로 {a.days}일')
    print(f'- 예정일 지남 {count["예정일 지남"]} · 이번 기간 예정 {count["이번 기간 예정"]} · 확인 기록 없음 {count["확인 기록 없음"]} · 주소 미확인 기관 {len(no_addr)}')
    print('- 오산시 기관을 먼저, 예정일이 지난 것부터 봅니다. 확인 후 services.csv와 verification_log.csv를 직접 고칩니다.\n')
    for kind in ['예정일 지남', '이번 기간 예정']:
        part = [r for r in rows if r['구분'] == kind]
        if part:
            print(f'## {kind} ({len(part)})')
            for r in part:
                print(f"- [{r['다음 확인']}] {r['기관']} · {r['서비스']} ({r['현재 상태']}) {r['근거 URL']}")
            print()
    left = [r for r in rows if r['구분'] == '확인 기록 없음']
    if left:
        osan = [r for r in left if r['범주'] == '오산시']
        print(f'## 확인 기록 없음 ({len(left)}, 이 중 오산시 {len(osan)}) · 오산시 앞 15개')
        for r in osan[:15]:
            print(f"- {r['기관']} · {r['서비스']} {r['근거 URL']}")
        print()
    if no_addr:
        print(f'## 주소 미확인 기관 ({len(no_addr)})')
        print('- ' + ', '.join(sorted(o['기관명'] for o in no_addr)))
    if a.csv:
        with open(a.csv, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ['구분'])
            w.writeheader(); w.writerows(rows)
    return 0


if __name__ == '__main__':
    sys.exit(main())
