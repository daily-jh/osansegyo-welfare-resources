#!/usr/bin/env python3
"""Keep docs/service-review-queue.csv covering every service in data/services.csv.

The review queue is a hand-kept ledger. This script only ADDS rows for services that
are missing from it, marked as not yet reviewed ('미검토'). It never marks a row as
reviewed or verified, and never rewrites or drops an existing row: a service removed
from data/services.csv must be resolved by a person (keep the record, note its status).

  python scripts/sync_service_review_queue.py          # add missing rows
  python scripts/sync_service_review_queue.py --check  # fail if the two ID sets differ
"""
import csv, io, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVICES = ROOT / 'data/services.csv'
ORGS = ROOT / 'data/organizations.csv'
CONTACTS = ROOT / 'data/contacts.csv'
QUEUE = ROOT / 'docs/service-review-queue.csv'
COLUMNS = ['service_id', 'organization', 'service', 'region', 'existing_source_state',
           'official_evidence_rechecked', 'service_specific_contact', 'fallback_institution_phone',
           'source_url', 'target_condition', 'application_method', 'current_intake_verified',
           'followup_priority', 'followup_questions']
NOT_REVIEWED = '미검토(신규 등록·검토대장 자동 추가)'
QUESTIONS = '담당부서·직통번호, 연령·거주·소득·비용·서류, 현재 모집·대기·예산, 부적합 시 대체경로'


def read(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def new_row(svc, orgs, contacts):
    org = orgs.get(svc['org_id'], {})
    own = [c for c in contacts if c['owner_type'] == 'service' and c['owner_id'] == svc['service_id'] and c['phone']]
    org_phone = next((c['phone'] for c in contacts if c['owner_type'] == 'organization' and c['owner_id'] == svc['org_id'] and c['phone']), '')
    return {
        'service_id': svc['service_id'],
        'organization': org.get('기관명', ''),
        'service': svc['서비스명'],
        'region': org.get('범주', ''),
        # The source file's own state, copied as-is; it is not this ledger's review result.
        'existing_source_state': svc.get('verification_status') or '미확인',
        'official_evidence_rechecked': NOT_REVIEWED,
        'service_specific_contact': '있음' if own else '없음',
        'fallback_institution_phone': org_phone,
        'source_url': svc.get('source_url', ''),
        'target_condition': svc.get('지원대상', ''),
        'application_method': svc.get('신청·연계방법', ''),
        'current_intake_verified': '미확인',
        'followup_priority': '미검토(1단계 담당·요건 확인)',
        'followup_questions': QUESTIONS,
    }


def main(argv):
    services = read(SERVICES)
    queue = read(QUEUE)
    src_ids = [s['service_id'] for s in services]
    queue_ids = {r['service_id'] for r in queue}
    missing = [i for i in src_ids if i not in queue_ids]
    orphans = sorted(queue_ids - set(src_ids))
    if '--check' in argv:
        ok = not missing and not orphans
        print(f'services {len(set(src_ids))}, review queue {len(queue_ids)}, missing {len(missing)}, orphan {len(orphans)}')
        if missing: print('missing from review queue:', ', '.join(missing))
        if orphans: print('in review queue but not in services:', ', '.join(orphans))
        return 0 if ok else 1
    orgs = {o['org_id']: o for o in read(ORGS)}
    contacts = read(CONTACTS)
    by_id = {s['service_id']: s for s in services}
    rows = queue + [new_row(by_id[i], orgs, contacts) for i in missing]
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLUMNS, quoting=csv.QUOTE_ALL, lineterminator='\n')
    w.writeheader(); w.writerows(rows)
    QUEUE.write_bytes(('﻿' + buf.getvalue()).encode('utf-8'))
    print(f'added {len(missing)} rows as 미검토; orphans left for manual review: {len(orphans)}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
