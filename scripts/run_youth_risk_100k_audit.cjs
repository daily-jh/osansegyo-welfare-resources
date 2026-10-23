#!/usr/bin/env node
'use strict';
// Test artifacts only: never pass real names, assessments, health details or actual case records.
global.window=global;
const path=require('node:path');
const fs=require('node:fs');
const criteria=require('../docs/youth-risk/criteria.js');
const planning=require('../docs/youth-risk/planning-model.js');
const matrix=require('../docs/youth-risk/evidence-matrix.js');
const guidance=require('../docs/youth-risk/referral-guidance.js');
const examples=require('../docs/youth-risk/case-examples-model.js');
global.YouthCaseExamples=examples;
global.YouthReferralGuide=guidance;
global.YouthEvidenceMatrix=matrix;
require('../docs/youth-risk/case-documents.js');
const docs=global.YouthCaseDocuments;
const {run}=require('./youth_risk_100k_audit.js');
const cases=Number(process.argv[2]||100000);
if(!Number.isInteger(cases)||cases<=0||cases>1000000)throw Error('Case count must be 1..1,000,000');
const result=run({criteria,planning,matrix,guidance,docs,examples},{cases,seed:20261023,documentEvery:100});
const out=JSON.stringify(result,null,2);
if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),out+'\n',{encoding:'utf8',flag:'w'});
console.log(out);
if(result.failures)process.exitCode=1;
