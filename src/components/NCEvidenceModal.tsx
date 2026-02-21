import { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { callGeminiAPI } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { getHospitalInfo } from '../config/hospitalConfig';
import { useNABHStore } from '../store/nabhStore';
import { getFormattedDate, getReviewDate } from '../utils/documentNumbering';
import type { NcRecord } from './NCTrackerPage';

interface NCEvidenceModalProps {
  nc: NcRecord;
  open: boolean;
  onClose: () => void;
  onSaved: (html: string | null) => void;
}

interface StaffMember {
  name: string;
  designation: string;
  department: string;
}

const EVIDENCE_TYPES = [
  { id: 'corrective', label: 'Corrective Action Report (Root Cause + Actions)' },
  { id: 'supporting', label: 'Supporting Evidence Document' },
  { id: 'training',   label: 'Training Record (with Pre/Post MCQ Assessment)' },
  { id: 'auditor',   label: 'Auditor Response Letter' },
];

// ── Standard CSS used across the entire app ──────────────────────────────────
const STANDARD_CSS = `
  html { height: 100%; overflow-y: auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.6; color: #333; padding: 2px 20px 20px; max-width: 800px; margin: 0 auto; }
  .page { page-break-after: always; padding-bottom: 30px; margin-bottom: 10px; }
  .page:last-child { page-break-after: auto; }
  .header { text-align: center; border-bottom: 3px solid #1565C0; padding-bottom: 6px; margin-bottom: 8px; }
  .logo-area { width: 525px; height: auto; min-height: 60px; margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; }
  .logo-area img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .doc-title { background: #1565C0; color: white; padding: 12px; font-size: 16px; font-weight: bold; text-align: center; margin: 14px 0; border-radius: 5px; }
  .objective-line { font-size: 12px; color: #333; margin: 10px 0; font-weight: 500; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  .info-table th { background: #f5f5f5; font-weight: 600; width: 25%; }
  .auth-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .auth-table th { background: #1565C0; color: white; padding: 10px; text-align: center; }
  .auth-table td { border: 1px solid #ddd; padding: 10px; text-align: center; vertical-align: top; min-height: 80px; }
  .auth-table img { display: block; height: 45px; max-width: 120px; object-fit: contain; margin: 6px auto 0; }
  .section { margin: 16px 0; }
  .section-title { background: #e3f2fd; padding: 8px 12px; font-weight: bold; color: #1565C0; border-left: 4px solid #1565C0; margin-bottom: 8px; }
  .section-content { padding: 8px 15px; }
  .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .data-table th { background: #1565C0; color: white; padding: 8px; text-align: left; font-size: 11px; }
  .data-table td { border: 1px solid #ddd; padding: 7px 8px; font-size: 11px; }
  .data-table tr:nth-child(even) { background: #f9f9f9; }
  .highlight-box { background: #e3f2fd; padding: 12px; border-left: 4px solid #1565C0; margin: 10px 0; }
  .procedure-step { margin: 8px 0; padding: 10px; background: #fafafa; border-radius: 5px; }
  .step-number { display: inline-block; width: 24px; height: 24px; background: #1565C0; color: white; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 8px; font-weight: bold; font-size: 11px; }
  ul, ol { padding-left: 20px; margin: 6px 0; } li { margin: 3px 0; }
  .revision-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; }
  .revision-table th { background: #455a64; color: white; padding: 7px; }
  .revision-table td { border: 1px solid #ddd; padding: 7px; }
  .stamp-area { border: 2px dashed #ccc; padding: 18px; text-align: center; margin: 16px 0; color: #999; font-style: italic; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #1565C0; text-align: center; font-size: 10px; color: #666; }
  .pass { color: #2e7d32; font-weight: 600; }
  .fail { color: #c62828; font-weight: 600; }
  @media print { body { padding: 0; } }
`;

// ── JS-generated page wrapper (logo never breaks here) ─────────────────────
function wrapInPage(
  content: string,
  title: string,
  dept: string,
  category: string,
  nc: NcRecord,
  hospital: ReturnType<typeof getHospitalInfo>,
  logoUrl: string,
  today: string,
  review: string,
  docNo: string,
  isLast: boolean,
): string {
  const severity = nc.score === 2 ? 'Major NC (Score 2)' : 'Minor NC (Score 3)';
  return `
<div class="${isLast ? 'page last' : 'page'}">
  <div class="header">
    <div class="logo-area">
      <img src="${logoUrl}" alt="${hospital.name} Logo" onerror="this.style.display='none'" style="width:100%;height:auto;object-fit:contain;" />
    </div>
    <div style="font-size:11px;color:#444;text-align:center;line-height:1.6;margin-top:2px;">
      ${hospital.address}<br>
      Phone: ${hospital.phone} &nbsp;|&nbsp; Email: ${hospital.email}<br>
      <strong>SPOC: Dr. B.K. Murali</strong> — CMD &amp; Chairman
    </div>
  </div>

  <div class="objective-line">NC Closure Evidence &nbsp;|&nbsp; <strong>${nc.standard_code}</strong> &nbsp;|&nbsp; ${nc.chapter_code} Chapter &nbsp;|&nbsp; NABH Audit: February 2026</div>

  <div class="doc-title">${title}</div>

  <table class="info-table">
    <tr><th>Document No</th><td>${docNo}</td><th>Version</th><td>1.0</td></tr>
    <tr><th>Department</th><td>${dept}</td><th>Category</th><td>${category}</td></tr>
    <tr><th>Effective Date</th><td>${today}</td><th>Review Date</th><td>${review}</td></tr>
    <tr><th>NC Standard</th><td>${nc.standard_code}</td><th>Severity</th><td>${severity}</td></tr>
  </table>

  <table class="auth-table">
    <tr><th>PREPARED BY</th><th>REVIEWED BY</th><th>APPROVED BY</th></tr>
    <tr>
      <td>
        Name: Sonali Kakde<br>Designation: Clinical Audit Coordinator<br>Date: ${today}<br>
        <img src="/Sonali's signature.png" alt="Signature" />
      </td>
      <td>
        Name: Gaurav Agrawal<br>Designation: Hospital Administrator<br>Date: ${today}<br>
        <img src="/Gaurav's signature.png" alt="Signature" />
      </td>
      <td>
        Name: Dr. Shiraz Khan<br>Designation: NABH Coordinator / Administrator<br>Date: ${today}<br>
        <img src="/Dr shiraz's signature.png" alt="Signature" />
      </td>
    </tr>
  </table>

  ${content}

  <table class="revision-table">
    <tr><th>Version</th><th>Date</th><th>Description</th><th>Changed By</th></tr>
    <tr><td>1.0</td><td>${today}</td><td>Initial Release — NC Closure Document</td><td>Sonali Kakde</td></tr>
  </table>

  <div class="stamp-area">HOSPITAL STAMP / SEAL</div>

  <div class="footer">
    <strong>${hospital.name}</strong> | ${hospital.address}<br>
    Phone: ${hospital.phone} | Email: ${hospital.email} | Website: ${hospital.website}<br>
    This is a controlled document. Unauthorized copying or distribution is prohibited.
  </div>
</div>`;
}

// ── Build the final full HTML from section contents ────────────────────────
function assembleHTML(
  sections: { title: string; dept: string; category: string; content: string }[],
  nc: NcRecord,
  hospital: ReturnType<typeof getHospitalInfo>,
  logoUrl: string,
): string {
  const today  = getFormattedDate();
  const review = getReviewDate();
  const docNo  = `HOH/NC/${nc.standard_code.replace(/\s+/g, '-').toUpperCase()}/2026`;

  const pages = sections.map((s, i) =>
    wrapInPage(s.content, s.title, s.dept, s.category, nc, hospital, logoUrl, today, review, docNo, i === sections.length - 1)
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NC Closure Evidence — ${nc.standard_code} — ${hospital.name}</title>
  <style>${STANDARD_CSS}</style>
</head>
<body>
${pages}
</body>
</html>`;
}

// ── Full master data embedded in every prompt ────────────────────────────────
const MASTER_STAFF_LIST = `
1. Dr. B.K. Murali | CMD | Admin
2. Dr. Shiraz Khan | Quality Co-ordinator | ICU
3. Gaurav Agrawal | Administrator | Admin
4. Dr. Afzal Sheikh | RMO | ICU
5. Dr. Suhash Tiple | Consultant | ICU
6. Dr. Sachin Gathibande | RMO | ICU
7. Dr. Swapnil Charpe | RMO | Casualty
8. Dr. Sharad Kawale | RMO | General Ward
9. Brother Chandraprakash Bisen | ICN | ICU
10. Sister Farzana Khan | Head Nurse | ICU
11. Brother Ajay Meshram | Nursing Staff | Casualty
12. Nitin Bawane | X-Ray Technician | Radiology
13. Apeksha Wandre | OT Technician | OT
14. Shruti Uikey | OT Technician | OT
15. Sarvesh Bhramhe | OT Technician | OT
16. Digesh Bisen | Lab Technician | Laboratory
17. Rachana Rathore | Lab Technician | Laboratory
18. Sarita Rangari | Lab Attendant | Laboratory
19. Nisha Sharma | Receptionist | Front Office
20. Diksha Sakhare | Receptionist | Front Office
21. Ruchika Jambhulkar | Pharmacist | Pharmacy
22. Tejash Akhare | Pharmacist | Pharmacy
23. Abhishek Dannar | Pharmacist | Pharmacy
24. Lalit Meshram | Attendant Pharmacist | Pharmacy
25. Jagruti Tembhare | Quality Manager & HR Head | Admin
26. Azhar Khan | Billing Staff | Billing
27. Madhuri Marwate | Billing Staff | Billing
28. Pragati Nandeshwar | Billing Staff | Billing
29. Kashish Jagwani | MRD Attendant | MRD
30. Aman Rajak | Fire Safety Officer | Safety
31. Afroz Khan | Security Guard | Security
32. Kiran Kadbe | Security Guard | Security
33. Roma Kangwani | Physiotherapist | Physiotherapy
34. Sonali Kakde | Clinical Audit Coordinator | Admin`;

const EQUIPMENT_MASTER_LIST = `
HOP-BME-ICU-CCE-VEN-01 | Ventilator | Mindray | ICU | Operational
HOP-BME-ICU-CCE-VEN-02 | Ventilator | Mindray | ICU | Operational
HOP-BME-2007-ICU-CCE-VEN-01 | Ventilator | NELLCOR PURITAN BENNETT | ICU | Operational
HOP-BME-2012-ICU-CCE-MON-01 | Multipara Monitor | NASAN | ICU | Operational
HOP-BME-ICU-CCE-MON-05 | Multipara Monitor | MEDIAID | ICU | Operational
HOP-BME-ICU-CCE-DEF-01 | Defibrillator | BPL | ICU | Operational
HOP-BME-ICU-CCE-SUC-01 | Suction Machine | GOLEY | ICU | Operational
HOP-BME-ICU-CCE-SYP-01 | Syringe Pump | SMITH | ICU | Operational
HOP-BME-ICU-CCE-SYP-02 | Syringe Pump | SMITH | ICU | Operational
HOP-BME-ICU-CCE-ABG-01 | ABG Machine | i-STAT | ICU | Operational
HOP-BME-ICU-CCE-GLU-01 | Glucometer | SD-Codefree | ICU | Operational
HOP-BME-ICU-CCE-BPA-01 | BP Apparatus | Diamond | ICU | Operational
HOP-BME-ICU-CCE-NEB-01 | Nebulizer | LIFE-LINE | ICU | Operational
HOP-BME-2012-ICU-CCE-BIP-01 | BiPAP | Harmony | ICU | Operational`;

// ── Content-only prompt for each evidence type ─────────────────────────────
function buildContentPrompt(
  type: string,
  nc: NcRecord,
  staff: StaffMember[],
  hospital: ReturnType<typeof getHospitalInfo>,
): string {
  const severity   = nc.score === 2 ? 'Major NC (Score 2)' : 'Minor NC (Score 3)';
  const staffTable = staff
    .map((s, i) => `${i + 1}. ${s.name} | ${s.designation} | ${s.department}`)
    .join('\n');

  const base = `You are a NABH quality expert for ${hospital.name}.

NC DETAILS:
- Standard: ${nc.standard_code}
- Chapter: ${nc.chapter_code}
- Finding: ${nc.nc_description}
- Severity: ${severity}

MASTER STAFF LIST — USE ONLY THESE NAMES (never invent names):
${MASTER_STAFF_LIST}

ADDITIONAL STAFF FROM DATABASE:
${staffTable}

EQUIPMENT MASTER (use tag codes when referencing equipment):
${EQUIPMENT_MASTER_LIST}

DEPARTMENTS: Admin, Billing, Casualty, Cath Lab, CSSD, Front Office, General Ward, Housekeeping, ICU, Infection Control, Laboratory, Maintenance, MRD, OT, Pathology, Pharmacy, Physiotherapy, Radiology, Safety, Security

MANDATORY TABLE RULES:
- Every data-table MUST have ALL cells filled with realistic values — NEVER leave cells empty or write just "N/A"
- Use staff names from the MASTER STAFF LIST above for "Responsible Person", "Verified By", "Observed By", "Done By", "Signature" columns
- Make up realistic dates (Jan–Apr 2026), scores (e.g. 8/10, 72%), readings, measurements, and pass/fail results
- For registers and logs: minimum 10 filled rows per table — make up realistic plausible data
- Equipment references must use the tag codes from EQUIPMENT MASTER above

OUTPUT FORMAT:
- Return ONLY the inner HTML content — NO DOCTYPE, NO <html>, NO <head>, NO <body>, NO <style>
- Use ONLY these CSS classes: section, section-title, section-content, data-table, highlight-box, procedure-step, step-number
- All dates in Jan–April 2026 range
- No markdown, only valid HTML`;

  if (type === 'corrective') return `${base}

Generate a Corrective Action Report with these sections:

1. Non-Conformity Description (data-table: Finding | Audit Date: 14/02/2026 | Standard: ${nc.standard_code} | Chapter: ${nc.chapter_code} | Severity: ${severity})

2. Immediate Correction Taken — actions within 48 hrs of audit (data-table: Sr | Action Taken | Done By | Date | Status — 5 rows, all "Completed", use real staff names, specific actions directly addressing: "${nc.nc_description}")

3. Root Cause Analysis — 5-Why Method (data-table: Why No. | Question Asked | Root Cause Found — 5 rows deep, each row building on the previous, specific to: "${nc.nc_description}")

4. Corrective Action Plan (data-table: Sr | Action Item | Responsible Person | Target Date | Completion Date | Status — 6 rows minimum, use real staff names, target dates Mar–Apr 2026, Status = "Completed" or "In Progress", each action directly linked to the NC)

5. Monitoring Register (data-table showing ongoing compliance monitoring after corrective action — 10 rows, columns relevant to the NC type e.g. for medication: Date | Ward | Item Checked | Observations | Compliant Y/N | Checked By | Remarks — use real staff names, realistic observations, mostly "Yes" with 1–2 "No" showing improvement)

6. Preventive Measures (highlight-box: 4–5 specific long-term steps to prevent recurrence, each as a bullet)`;

  if (type === 'supporting') return `${base}

Generate a Supporting Evidence Document with these sections:

1. Evidence Checklist (data-table: Sr | Evidence Item | Document Ref No. | Date Obtained | Status | Verified By — 10 rows, status = "Attached" / "Submitted", all with document reference numbers like HOH/NC/${nc.standard_code.replace(/\s+/g, '-').toUpperCase()}/2026, use real staff names for Verified By)

2. Observation / Monitoring Log (data-table relevant to the NC — 12 filled rows showing compliance monitoring. Columns depend on NC type:
   - For medication NC: Date | Time | Ward/Location | Item | Observation | Compliant | Observer
   - For infection control NC: Date | Department | Activity Observed | Technique | Compliant Y/N | Corrective Remark | Observer
   - For equipment NC: Date | Equipment ID | Equipment Name | Check Parameter | Reading | Normal Range | Status | Checked By
   - For documentation NC: Date | Record Type | Patient ID/Ref | Completeness | Signature Present | Abbreviations Used | Auditor
   - For training/awareness NC: Date | Staff Name | Designation | Knowledge Area | Score | Pass/Fail | Evaluated By
   Use equipment tag codes from EQUIPMENT MASTER for equipment NCs. Use real staff names throughout.)

3. Documentary Evidence Log (data-table: Sr | Document Type | Reference No. | Issue Date | Submitted To | Acknowledgement Date | Remarks — 6 rows, realistic document references)

4. Photographic Evidence Register (data-table: Sr | Description of Evidence | Location | Date | Photographer | File Reference | Remark — 5 rows, specific to the NC scenario)

5. NC Closure Verification (highlight-box: 4-line formal statement with date confirming NC is closed, evidence reference, and verified by Sonali Kakde, Clinical Audit Coordinator)`;

  if (type === 'training') return `${base}

Generate a Training Record with these sections:

1. Training Programme Details (data-table 2-col key-value: Training Topic | [topic directly addressing "${nc.nc_description}"] | Date | 15/03/2026 | Day | Sunday | Time | 10:00 AM – 11:30 AM | Duration | 90 minutes | Venue | Conference Hall, ${hospital.name} | Facilitator/Trainer | Dr. Shiraz Khan, NABH Coordinator | Co-Trainer | Jagruti Tembhare, Quality Manager | Target Audience | Staff from ${nc.chapter_code}-related departments | Total Enrolled | 15 | Total Attended | 14)

2. Pre-Training MCQ Assessment — 10 Questions (BEFORE training)
Test BASELINE awareness. Format: numbered questions each with 4 options (A/B/C/D), mark correct answer with ✓. Topics must relate directly to "${nc.nc_description}". Questions should reveal gaps (i.e. some questions that untrained staff likely don't know).

3. Training Attendance Sheet (data-table: Sr | Employee ID | Name | Designation | Department | Present Y/N | Pre-Test Score /10 | Post-Test Score /10 | Signature — 15 rows using names from MASTER STAFF LIST relevant to NC chapter ${nc.chapter_code}. Pre-Test scores: 3–6/10. Post-Test scores: 7–10/10. Mark 14 Present, 1 Absent. Use realistic employee IDs like HH-001, HH-002...)

4. Post-Training MCQ Assessment — 10 Questions (AFTER training)
Test KNOWLEDGE GAINED. Same topics but deeper/harder questions. Format same as pre-test. Mark correct answers.

5. Assessment Results Summary (data-table: Sr | Name | Department | Pre-Test /10 | Post-Test /10 | Improvement (+) | % Improvement | Result — 15 rows matching attendance. Show improvement of +3 to +5 marks. Result = Pass for all present. 1 Absent = "—")

6. Training Feedback Summary (data-table: Sr | Feedback Parameter | Rating 1-5 (Avg) | Remarks — 6 rows: Content Quality | Trainer Effectiveness | Relevance to Work | Time Management | Overall Satisfaction | Would Recommend to Colleagues — realistic ratings 4.0–4.8)

7. Training Effectiveness Evaluation (highlight-box: 4 bullet points showing how this training directly resolves "${nc.nc_description}" with reference to specific improvement in scores and planned re-audit date)`;

  // auditor response letter
  return `${base}

Generate a formal Auditor Response Letter with these sections:

1. Letter Header (formal layout: From: Dr. Shiraz Khan, NABH Coordinator, ${hospital.name} | To: The Chief Assessor, NABH Assessment Team, QCI, New Delhi | Date: 20/03/2026 | Subject: Submission of Corrective Action Response — NC ${nc.standard_code} | Ref: NABH Audit February 2026)

2. Introduction Paragraph (2 sentences: acknowledging the NC finding and expressing commitment to addressing it)

3. NC Finding Reference (quoted block showing the exact finding: "${nc.nc_description}" — formatted as a blockquote or highlighted box)

4. Corrective Actions Taken (5 numbered paragraphs in formal letter language, each describing one specific action taken with:
   - What was done (specific to the NC)
   - Who did it (real staff name and designation from master list)
   - When it was completed (Mar 2026 date)
   - What evidence is available)

5. Compliance Evidence Summary (data-table: Sr | Action Taken | Responsible Person | Completion Date | Evidence Document | Status — 6 rows, use real staff names, all "Completed")

6. Supporting Documents Submitted (data-table: Sr | Document Name | Document No. | Date | Pages — 5 rows listing the evidence package: CAR report, training record, photos, audit log, SOP revision)

7. Closure Request Paragraph (2 formal sentences requesting the assessor to consider NC ${nc.standard_code} as closed, citing evidence attached)

8. Formal Signoff (Dr. Shiraz Khan | NABH Coordinator / Administrator | ${hospital.name} | Nagpur | Date: 20/03/2026)`;
}

// ── Capture current HTML from iframe (works in view and edit mode) ──────────
function captureIframeHtml(iframeEl: HTMLIFrameElement | null): string | null {
  if (!iframeEl?.contentDocument) return null;
  const raw = iframeEl.contentDocument.documentElement.outerHTML;
  return raw.startsWith('<!DOCTYPE') ? raw : '<!DOCTYPE html>\n' + raw;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function NCEvidenceModal({ nc, open, onClose, onSaved }: NCEvidenceModalProps) {
  const { selectedHospital } = useNABHStore();
  const hospitalId = selectedHospital || 'hope';
  const hospital   = getHospitalInfo(hospitalId);

  // Resolve logo URL — prefer absolute (DB storage URL), fall back to origin + path
  const logoUrl = hospital.logo.startsWith('http')
    ? hospital.logo
    : `${window.location.origin}${hospital.logo}`;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [staff, setStaff]               = useState<StaffMember[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['corrective', 'supporting', 'training', 'auditor']);
  const [generating, setGenerating]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  // viewHtml drives the iframe srcDoc; kept stable while editing so React doesn't reload the iframe
  const [viewHtml, setViewHtml]         = useState<string | null>(nc.evidence_html || null);
  const [editMode, setEditMode]         = useState(false);

  const isMajor = nc.score === 2;

  // Load real staff from master on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('nabh_team_members')
        .select('name, designation, department')
        .order('name');
      if (data && data.length > 0) setStaff(data);
    })();
  }, [open]);

  // When the iframe loads (after generation), enable designMode if edit mode is active
  const handleIframeLoad = () => {
    if (editMode && iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'on';
    }
  };

  const toggleType = (id: string) =>
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  // ── Enter / exit edit mode ────────────────────────────────────────────────
  const handleEnterEdit = () => {
    if (iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'on';
      // Focus so cursor appears immediately
      iframeRef.current.contentDocument.body?.focus();
    }
    setEditMode(true);
  };

  const handleDoneEditing = () => {
    // Capture current iframe DOM back into viewHtml
    const captured = captureIframeHtml(iframeRef.current);
    if (iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'off';
    }
    setEditMode(false);
    if (captured) setViewHtml(captured); // iframe reloads with committed content
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (selectedTypes.length === 0) { setError('Select at least one evidence type.'); return; }
    setGenerating(true);
    setEditMode(false);
    setError(null);
    try {
      const sectionDefs: { id: string; title: string; dept: string; category: string }[] = [
        { id: 'corrective', title: 'CORRECTIVE ACTION REPORT',    dept: `${nc.chapter_code} Department`, category: 'NC Closure — Corrective Action' },
        { id: 'supporting', title: 'SUPPORTING EVIDENCE DOCUMENT', dept: `${nc.chapter_code} Department`, category: 'NC Closure — Evidence Record' },
        { id: 'training',   title: 'TRAINING RECORD & ASSESSMENT', dept: `${nc.chapter_code} Department`, category: 'NC Closure — Training Evidence' },
        { id: 'auditor',    title: 'AUDITOR RESPONSE LETTER',      dept: 'Quality & Administration',      category: 'NC Closure — Formal Correspondence' },
      ];

      const selected = sectionDefs.filter((s) => selectedTypes.includes(s.id));

      const results = await Promise.all(
        selected.map(async (sec) => {
          const prompt = buildContentPrompt(sec.id, nc, staff, hospital);
          const res    = await callGeminiAPI(prompt, 0.7, 4096);
          let content: string = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          content = content
            .replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/g, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<\/?html[^>]*>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '').replace(/<\/?body[^>]*>/gi, '')
            .replace(/<style>[\s\S]*?<\/style>/gi, '')
            .trim();
          return { ...sec, content };
        })
      );

      setViewHtml(assembleHTML(results, nc, hospital, logoUrl));
    } catch (e: any) {
      setError(e.message || 'Failed to generate evidence');
    } finally {
      setGenerating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // If editing, commit current iframe content first
    let toSave = viewHtml;
    if (editMode) {
      const captured = captureIframeHtml(iframeRef.current);
      if (captured) {
        if (iframeRef.current?.contentDocument) {
          iframeRef.current.contentDocument.designMode = 'off';
        }
        setEditMode(false);
        setViewHtml(captured);
        toSave = captured;
      }
    }
    if (!toSave) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await (supabase as any)
        .from('nabh_ncs')
        .update({ evidence_html: toSave, updated_at: new Date().toISOString() })
        .eq('id', nc.id);
      if (err) throw err;
      onSaved(toSave);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this evidence document? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      const { error: err } = await (supabase as any)
        .from('nabh_ncs')
        .update({ evidence_html: null, updated_at: new Date().toISOString() })
        .eq('id', nc.id);
      if (err) throw err;
      setViewHtml(null);
      setEditMode(false);
      onSaved(null);
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const src = editMode ? captureIframeHtml(iframeRef.current) : viewHtml;
    if (!src) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(src);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Icon color="primary" sx={{ mt: 0.5 }}>auto_awesome</Icon>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              NC Evidence: {nc.standard_code}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {nc.nc_description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {viewHtml && (
              <Chip label="Evidence Stored" size="small" color="success" icon={<Icon>check_circle</Icon>} />
            )}
            <Chip
              label={isMajor ? 'Major NC' : 'Minor NC'}
              size="small"
              color={isMajor ? 'error' : 'warning'}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── Evidence type selector (shown before generation) ── */}
        {!viewHtml && !generating && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Select evidence types to generate:
            </Typography>
            <FormGroup>
              {EVIDENCE_TYPES.map((t) => (
                <FormControlLabel
                  key={t.id}
                  control={
                    <Checkbox
                      checked={selectedTypes.includes(t.id)}
                      onChange={() => toggleType(t.id)}
                    />
                  }
                  label={t.label}
                />
              ))}
            </FormGroup>
            {staff.length > 0 && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                ✓ Loaded {staff.length} real staff members from master
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mx: 2.5, my: 1 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Generating spinner ── */}
        {generating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">
              Generating {selectedTypes.length} section(s) using real staff from master…
            </Typography>
          </Box>
        )}

        {/* ── Document viewer / editor ── */}
        {viewHtml && (
          <Box>
            {/* Toolbar */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 0.75,
                bgcolor: editMode ? 'warning.light' : 'grey.50',
                borderBottom: '1px solid', borderColor: 'divider',
              }}
            >
              {editMode ? (
                <Typography variant="caption" fontWeight={600} color="warning.dark">
                  Edit mode — click anywhere in the document to edit text, tables, or values
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Document preview — use Edit to make changes directly in the document
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editMode ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<Icon>check</Icon>}
                    onClick={handleDoneEditing}
                  >
                    Done Editing
                  </Button>
                ) : (
                  <Tooltip title="Click inside the document to edit text directly">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Icon>edit</Icon>}
                      onClick={handleEnterEdit}
                    >
                      Edit Document
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Discard and regenerate">
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Icon>refresh</Icon>}
                    onClick={() => { setViewHtml(null); setEditMode(false); }}
                    disabled={editMode}
                  >
                    Regenerate
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* The document iframe */}
            <Box sx={{ height: 520, bgcolor: 'white' }}>
              <iframe
                ref={iframeRef}
                srcDoc={viewHtml}
                title="Evidence Document"
                onLoad={handleIframeLoad}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: editMode ? '2px solid #ED6C02' : 'none',
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Close</Button>

        {viewHtml ? (
          <>
            {/* Delete */}
            <Button
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={16} color="error" /> : <Icon>delete</Icon>}
              onClick={handleDelete}
              disabled={deleting || editMode}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>

            <Box sx={{ flex: 1 }} />

            {/* Download PDF */}
            <Button
              variant="outlined"
              startIcon={<Icon>picture_as_pdf</Icon>}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>

            {/* Save to DB */}
            <Button
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Icon>save</Icon>}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : editMode ? 'Save Changes' : 'Save to DB'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Icon>auto_awesome</Icon>}
            onClick={handleGenerate}
            disabled={generating || selectedTypes.length === 0}
          >
            {generating ? 'Generating…' : 'Generate Evidence'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
