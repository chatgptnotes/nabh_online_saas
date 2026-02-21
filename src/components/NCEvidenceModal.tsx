import { useState, useEffect } from 'react';
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
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
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
  onSaved: (html: string) => void;
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
  .logo-area { width: 350px; height: 80px; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; }
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
      <img src="${logoUrl}" alt="${hospital.name} Logo" onerror="this.style.display='none'" />
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

REAL STAFF LIST (USE ONLY THESE NAMES — never invent names):
${staffTable}

KEY QUALITY TEAM (signing authorities):
- Dr. Shiraz Khan — Quality Coordinator / Administrator
- Sonali Kakde — Clinical Audit Coordinator (Prepared By)
- Gaurav Agrawal — Hospital Administrator (Reviewed By)
- Jagruti Tembhare — Quality Manager & HR Head

DEPARTMENTS: Casualty, Cath Lab, CSSD, General Ward, HR, ICU, Infection Control, Laboratory, Maintenance, MRD, OT, Pathology, Pharmacy, Physiotherapy, Radiology, Reception, Ultrasound, X-ray

OUTPUT FORMAT:
- Return ONLY the inner HTML content — NO DOCTYPE, NO <html>, NO <head>, NO <body>, NO <style>
- Use ONLY these CSS classes: section, section-title, section-content, data-table, highlight-box, procedure-step, step-number
- All dates in March–April 2026 range
- No markdown, only valid HTML`;

  if (type === 'corrective') return `${base}

Generate a Corrective Action Report with these sections:
1. Non-Conformity Description (table: Finding | Audit Date | Standard | Severity)
2. Immediate Correction Taken (3–4 specific actions taken within 48 hrs — relevant to: "${nc.nc_description}")
3. Root Cause Analysis — 5-Why Method (data-table: Why # | Question | Answer — 5 rows deep, specific to the NC)
4. Corrective Action Plan (data-table: Sr | Action Item | Responsible Person | Target Date | Status — min 5 rows, use real staff names above)
5. Preventive Measures (4–5 bullet points, long-term steps to prevent recurrence)`;

  if (type === 'supporting') return `${base}

Generate a Supporting Evidence Document with these sections:
1. Evidence Checklist (data-table: Sr | Evidence Item | Document Reference | Status | Verified By — 8 rows, use real staff names for Verified By)
2. Photographic / Documentary Evidence Log (data-table: Sr | Evidence Description | Date | Location | Remarks — 5 rows relevant to the NC)
3. Verification Records (data-table: Verification Item | Date Verified | Verified By | Observation | Result — 4 rows, use real staff names)
4. NC Closure Status (highlight-box: 3-line summary confirming NC is addressed and evidence is attached)`;

  if (type === 'training') return `${base}

Generate a Training Record with these sections:

1. Training Details (data-table 2-col: Topic | [relevant to "${nc.nc_description}"] | Date | [March 2026 date] | Time | 11:30 AM | Duration | 1.5 Hours | Venue | Conference Room, ${hospital.name} | Trainer | Dr. Shiraz Khan)

2. Pre-Training Assessment — MCQ (10 questions)
- 5 MCQs testing BASELINE knowledge BEFORE training
- Format: numbered questions with options A/B/C/D, correct answer marked ✓ in a note below each question
- Questions must be directly relevant to the NC topic

3. Attendance Sheet (data-table: Sr | Name | Designation | Department | Pre-Score | Post-Score | Signature — use 15 names from the real staff list above, pick those relevant to the NC chapter: ${nc.chapter_code})

4. Post-Training Assessment — MCQ (10 questions)
- 5 MCQs testing KNOWLEDGE GAINED AFTER training (slightly harder than pre-test, same topic)
- Format: same as pre-training MCQs
- Note: Use the SAME topics but phrase questions differently to test deeper understanding

5. Assessment Results Summary (data-table: Sr | Name | Pre-Test /10 | Post-Test /10 | Improvement | Result — use the same 15 staff from attendance, realistic scores: pre avg 4–5/10, post avg 7–9/10, all Pass)

6. Training Effectiveness Evaluation (highlight-box: 3–4 points on how this training directly resolves "${nc.nc_description}")`;

  // auditor
  return `${base}

Generate a formal Auditor Response Letter with these sections:
1. Letter Header (to: NABH Assessment Team, QCI, New Delhi | subject: Corrective Action Response for NC ${nc.standard_code} | ref: NABH Audit February 2026)
2. NC Finding Reference (paragraph quoting the finding: "${nc.nc_description}")
3. Corrective Actions Taken (4–5 numbered paragraphs, formal letter language, specific actions with March–April 2026 dates, named responsible persons from the real staff list)
4. Compliance Timeline (data-table: Action | Completion Date | Status | Evidence Reference — 4 rows)
5. Closure Request (2-sentence formal paragraph requesting assessor to consider NC closed)
6. Signoff (formal closing: Dr. Shiraz Khan, NABH Coordinator / Administrator, ${hospital.name})`;
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

  const [staff, setStaff]               = useState<StaffMember[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['corrective', 'supporting', 'training', 'auditor']);
  const [generating, setGenerating]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [html, setHtml]                 = useState<string | null>(nc.evidence_html || null);
  const [tab, setTab]                   = useState(0); // 0 = Preview, 1 = Edit HTML
  const [editedHtml, setEditedHtml]     = useState('');

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

  // Sync editedHtml when html changes
  useEffect(() => {
    if (html) setEditedHtml(html);
  }, [html]);

  const toggleType = (id: string) =>
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) { setError('Select at least one evidence type.'); return; }
    setGenerating(true);
    setError(null);
    try {
      const sectionDefs: { id: string; title: string; dept: string; category: string }[] = [
        { id: 'corrective', title: 'CORRECTIVE ACTION REPORT',       dept: `${nc.chapter_code} Department`,      category: 'NC Closure — Corrective Action' },
        { id: 'supporting', title: 'SUPPORTING EVIDENCE DOCUMENT',    dept: `${nc.chapter_code} Department`,      category: 'NC Closure — Evidence Record' },
        { id: 'training',   title: 'TRAINING RECORD & ASSESSMENT',    dept: `${nc.chapter_code} Department`,      category: 'NC Closure — Training Evidence' },
        { id: 'auditor',    title: 'AUDITOR RESPONSE LETTER',         dept: 'Quality & Administration',           category: 'NC Closure — Formal Correspondence' },
      ];

      const selected = sectionDefs.filter((s) => selectedTypes.includes(s.id));

      // Generate each section in parallel
      const results = await Promise.all(
        selected.map(async (sec) => {
          const prompt = buildContentPrompt(sec.id, nc, staff, hospital);
          const res    = await callGeminiAPI(prompt, 0.7, 4096);
          let content: string = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // strip any accidental code fences or HTML wrappers
          content = content
            .replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/g, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<\/?html[^>]*>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '').replace(/<\/?body[^>]*>/gi, '')
            .replace(/<style>[\s\S]*?<\/style>/gi, '')
            .trim();
          return { ...sec, content };
        })
      );

      const assembled = assembleHTML(results, nc, hospital, logoUrl);
      setHtml(assembled);
      setTab(0);
    } catch (e: any) {
      setError(e.message || 'Failed to generate evidence');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const toSave = tab === 1 ? editedHtml : html;
    if (!toSave) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await (supabase as any)
        .from('nabh_ncs')
        .update({ evidence_html: toSave, updated_at: new Date().toISOString() })
        .eq('id', nc.id);
      if (err) throw err;
      if (tab === 1) setHtml(editedHtml); // commit edited version
      onSaved(toSave);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const src = tab === 1 ? editedHtml : html;
    if (!src) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(src);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const currentHtml = tab === 1 ? editedHtml : html;

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
            {html && (
              <Chip
                label="Evidence Stored"
                size="small"
                color="success"
                icon={<Icon>check_circle</Icon>}
              />
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
        {/* Evidence type selector — shown only before generation */}
        {!html && (
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
                ✓ Loaded {staff.length} real staff members from master — will be used in attendance records
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mx: 2.5, mb: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Preview / Edit tabs — shown after generation */}
        {html && (
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 42 }}>
                  <Tab label="Preview" icon={<Icon sx={{ fontSize: 18 }}>visibility</Icon>} iconPosition="start" sx={{ minHeight: 42, py: 0 }} />
                  <Tab label="Edit HTML" icon={<Icon sx={{ fontSize: 18 }}>code</Icon>} iconPosition="start" sx={{ minHeight: 42, py: 0 }} />
                </Tabs>
                <Button size="small" onClick={() => { setHtml(null); setTab(0); }} startIcon={<Icon>refresh</Icon>}>
                  Regenerate
                </Button>
              </Box>
            </Box>

            {tab === 0 && (
              <Box sx={{ height: 520, bgcolor: 'white' }}>
                <iframe
                  srcDoc={html}
                  title="Evidence Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Edit the raw HTML below. Click "Save to DB" to persist your changes.
                </Typography>
                <TextField
                  multiline
                  fullWidth
                  rows={22}
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: 11 } }}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        )}

        {generating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">
              Generating {selectedTypes.length} evidence section(s) using real staff from master…
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Close</Button>

        {currentHtml ? (
          <>
            <Button
              variant="outlined"
              startIcon={<Icon>picture_as_pdf</Icon>}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Icon>save</Icon>}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save to DB'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={
              generating
                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                : <Icon>auto_awesome</Icon>
            }
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
