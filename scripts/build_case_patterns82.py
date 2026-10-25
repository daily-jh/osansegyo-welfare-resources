"""Build reference actions from synthetic records, never private case files."""
import argparse
import gzip
import hashlib
import json
import pathlib
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', required=True, type=pathlib.Path)
parser.add_argument('--output', type=pathlib.Path, default=pathlib.Path('docs/youth-risk/case-patterns-v82.js'))
args = parser.parse_args()
patterns = {}
files = []
count = 0
for source in sorted(args.source.rglob('*.jsonl.gz')):
    files.append({'file': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    for line in gzip.open(source, 'rt'):
        record = json.loads(line)
        if record.get('synthetic') is not True:
            raise ValueError('Only explicitly synthetic records are accepted')
        count += 1
        for task in record['evaluation'].get('plan', []):
            key = (task['task'], task['done'])
            value = patterns.setdefault(key, {'id': 'P' + str(len(patterns) + 1).zfill(2), 'task': task['task'], 'check': task['done'], 'sourceCount': 0, 'sourceIds': []})
            value['sourceCount'] += 1
            if len(value['sourceIds']) < 2:
                value['sourceIds'].append(record['id'])
rules = {'safety': r'안전|보호|신고|위해|피해|협박|접촉', 'school': r'수업|학습|등교|출결|교육|과제|학교', 'care': r'돌봄|식사|양육|가족|휴식|생활', 'basic': r'생활|주거|경제|비용|급식|물품', 'peer': r'또래|관계|친구|피해|참여', 'health': r'진료|의료|약물|처방|건강', 'mental': r'정서|상담|수면|심리', 'access': r'접근|편의|감각|통역|조정', 'digital': r'온라인|디지털|유포|계정', 'resource': r'담당|역할|기관|연계|지원|접수'}
for value in patterns.values():
    value['tags'] = [key for key, rx in rules.items() if re.search(rx, value['task'] + ' ' + value['check'])]
result = {'version': '8.2-pattern-index', 'sourceRecords': count, 'patternCount': len(patterns), 'kind': 'synthetic-action-patterns-not-case-evidence', 'files': files, 'patterns': list(patterns.values())}
args.output.write_text('/* Deduplicated synthetic action references; never facts about a student. */\n(function(r){const x=' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ";if(typeof module!=='undefined'&&module.exports)module.exports=x;else r.YouthCasePatterns82=x;})(typeof window!=='undefined'?window:globalThis);\n")
print(json.dumps({'sourceRecords': count, 'patterns': len(patterns)}))
