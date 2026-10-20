CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, event TEXT NOT NULL CHECK(event IN ('visit','assessment')), day TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0, assessments INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER IF NOT EXISTS count_event AFTER INSERT ON events BEGIN
 INSERT INTO daily(day,visits,assessments) VALUES(NEW.day,NEW.event='visit',NEW.event='assessment')
 ON CONFLICT(day) DO UPDATE SET visits=visits+(NEW.event='visit'),assessments=assessments+(NEW.event='assessment');
END;
