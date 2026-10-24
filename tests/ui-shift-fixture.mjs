import {portrait as applicantPortrait} from '../dist/heist-art.mjs';
import {readFile} from 'node:fs/promises';
import * as career from '../dist/career-core.mjs';
const source=(await readFile(new URL('../dist/shift-session.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
export function installShift(w){
 w.testCareer=career;w.testApplicantPortrait=applicantPortrait;
 w.eval(`(()=>{const applicantPortrait=window.testApplicantPortrait;const {${Object.keys(career).join(',')}}=window.testCareer;\n${source}\nwindow.testShift={ShiftSession,portrait,difficultyMarkup,recordsMarkup,rememberReport,reportMarkup,endingMarkup,completedJourney};})();`);
}
