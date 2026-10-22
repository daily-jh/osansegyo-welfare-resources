import copy, csv, importlib.util, io, json, tempfile, unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('builder',Path(__file__).resolve().parents[1]/'scripts/build_data.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)

class Resources(unittest.TestCase):
    def setUp(self):
        self.original=b.ROOT
        scratch=self.original/'artifacts';scratch.mkdir(exist_ok=True)
        self.tmp=tempfile.TemporaryDirectory(dir=scratch);b.ROOT=Path(self.tmp.name)
        (b.ROOT/'data').mkdir();(b.ROOT/'docs').mkdir()
        for p in (self.original/'data').iterdir(): (b.ROOT/'data'/p.name).write_bytes(p.read_bytes())
        (b.ROOT/'docs/index.html').write_bytes((self.original/'docs/index.html').read_bytes())
    def tearDown(self): b.ROOT=self.original;self.tmp.cleanup()
    def change(self,name,fn):
        path=b.ROOT/'data'/name
        with path.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
        fields=list(rows[0]);fn(rows)
        path.write_bytes(b.csv_bytes(rows,fields))
    def test_legacy_compatibility_and_ids(self):
        orgs,services,contacts,rounds,taxonomy=b.load()
        generated=b.generate();flat=list(csv.DictReader(io.StringIO(generated[b.ROOT/'docs/resources.csv'].decode('utf-8-sig'))))
        with (self.original/'data/resources.csv').open(encoding='utf-8-sig',newline='') as f: old=list(csv.DictReader(f))
        self.assertEqual(flat,old);self.assertTrue(orgs);self.assertTrue(services)
        registry=b.read_table('id-registry.csv',['org_id','legacy_hash'])
        self.assertTrue(set(r['org_id'] for r in registry).issubset(o['org_id'] for o in orgs))
        self.assertTrue(all(r['org_id']==r['legacy_hash'] for r in registry))
    def test_rename_preserves_id(self):
        old=b.load()[0][0]['org_id']
        self.change('organizations.csv',lambda rs:rs[0].update(기관명='변경된 기관명'))
        generated=b.generate()[b.ROOT/'docs/assets/data.js'].decode()
        self.assertIn('"id": "'+old+'"',generated)
    def test_invalid_reference_rejected(self):
        self.change('services.csv',lambda rs:rs[0].update(org_id='MISSING'))
        with self.assertRaises(ValueError):b.generate()
    def test_duplicate_id_rejected(self):
        self.change('services.csv',lambda rs:rs[1].update(service_id=rs[0]['service_id']))
        with self.assertRaises(ValueError):b.generate()
    def test_verified_requires_evidence(self):
        self.change('services.csv',lambda rs:rs[0].update(verification_status='확인완료'))
        with self.assertRaises(ValueError):b.generate()
    def test_unknown_tag_and_bad_date_rejected(self):
        self.change('services.csv',lambda rs:rs[0].update(tags_need='없는 분류'))
        with self.assertRaises(ValueError):b.generate()
        self.change('services.csv',lambda rs:rs[0].update(tags_need='',verified_on='2026-02-30'))
        with self.assertRaises(ValueError):b.generate()
    def test_regeneration_idempotent(self):
        first=b.generate()
        for p,v in first.items():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(v)
        self.assertEqual(first,b.generate())

if __name__=='__main__':unittest.main()
