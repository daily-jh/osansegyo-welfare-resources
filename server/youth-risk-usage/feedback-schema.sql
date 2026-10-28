-- 이용자 의견: report(오류·수정 요청, 비공개)와 review(사용 후기, 승인 후 공개).
-- 이름·연락처·IP는 저장하지 않는다. rate는 하루 단위 익명 키(솔트 해시)와 건수만 두고 이틀 지나면 지운다.
CREATE TABLE IF NOT EXISTS feedback (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('report','review')),
 area TEXT NOT NULL,
 rating INTEGER CHECK(rating IS NULL OR rating BETWEEN 1 AND 5),
 role TEXT NOT NULL DEFAULT '',
 body TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('new','done','pending','approved','hidden')),
 day TEXT NOT NULL,
 created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_kind_status ON feedback(kind,status,created);
CREATE TABLE IF NOT EXISTS feedback_rate (key TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0);
