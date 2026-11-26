#!/usr/bin/env python3
"""쉬운 주소(사용자 지정 도메인) 한 번에 적용하기 (2026-11-26).

도메인을 산 뒤 한 번만 실행한다. 하는 일:
  1) docs/CNAME 에 도메인을 적는다(GitHub Pages가 이 주소로 사이트를 연다).
  2) 공유 미리보기(og:url·og:image)·대표 주소(canonical)·화면 속 안내 링크의
     https://daily-jh.github.io/osansegyo-welfare-resources 를 https://<도메인> 으로 바꾼다.
  3) 의견 창구·AI Worker 설정(wrangler.toml)의 SITE_ORIGINS 에 새 주소를 넣는다(배포는 wrangler deploy 따로).
기존 github.io 주소는 GitHub이 새 주소로 자동으로 넘겨 주므로 예전 링크·QR도 계속 열린다.
연구 기록(.md)과 시험 파일은 당시 기록이라 바꾸지 않는다.

  python3 scripts/set-custom-domain.py example.kr --dry-run   # 바뀔 곳만 보기
  python3 scripts/set-custom-domain.py example.kr             # 적용
"""
import argparse, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD = 'https://daily-jh.github.io/osansegyo-welfare-resources'
EXTS = {'.html', '.js', '.json', '.txt', '.webmanifest', '.xml', '.csv'}
WRANGLERS = ['server/youth-risk-usage/wrangler.toml', 'server/youth-risk-ai/cloudflare/wrangler.toml']


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('domain', help='예: example.kr (https:// 없이)')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    domain = a.domain.strip().lower().removeprefix('https://').removeprefix('http://').strip('/')
    if not re.fullmatch(r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}', domain) and not re.fullmatch(r'(?:[a-z0-9-]+\.)+xn--[a-z0-9-]+', domain):
        sys.exit(f'도메인 형식이 아닙니다: {a.domain} (한글 도메인은 퓨니코드 xn-- 형태로 넣어 주세요)')
    new = 'https://' + domain
    changed = []
    for p in sorted((ROOT / 'docs').rglob('*')):
        if not p.is_file() or p.suffix not in EXTS:
            continue
        try:
            s = p.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        if OLD in s:
            n = s.count(OLD)
            changed.append((p.relative_to(ROOT), n))
            if not a.dry_run:
                p.write_text(s.replace(OLD, new), encoding='utf-8')
    readme = ROOT / 'README.md'
    if readme.exists() and OLD in readme.read_text(encoding='utf-8'):
        changed.append((readme.relative_to(ROOT), readme.read_text(encoding='utf-8').count(OLD)))
        if not a.dry_run:
            readme.write_text(readme.read_text(encoding='utf-8').replace(OLD, new), encoding='utf-8')
    # www를 붙여 들어와도 같이 허용(DNS에서 www도 연결하라고 안내함)
    origins = new if domain.startswith('www.') else f'{new},https://www.{domain}'
    for w in WRANGLERS:
        p = ROOT / w
        s = p.read_text(encoding='utf-8')
        s2 = re.sub(r'^SITE_ORIGINS = ".*"$', f'SITE_ORIGINS = "{origins}"', s, flags=re.M)
        if s2 != s:
            changed.append((p.relative_to(ROOT), 1))
            if not a.dry_run:
                p.write_text(s2, encoding='utf-8')
    if not a.dry_run:
        (ROOT / 'docs' / 'CNAME').write_text(domain + '\n', encoding='utf-8')
    for path, n in changed:
        print(f'{"(미리보기) " if a.dry_run else ""}{path}: {n}곳')
    print(f'docs/CNAME → {domain}' + (' (미리보기)' if a.dry_run else ''))
    print(f'Worker 허용 주소 SITE_ORIGINS = "{origins}" → 의견 창구·AI Worker 폴더에서 wrangler deploy 필요')


if __name__ == '__main__':
    main()
