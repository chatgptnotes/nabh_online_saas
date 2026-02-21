import { useState } from 'react';
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

const EVIDENCE_TYPES = [
  { id: 'corrective', label: 'Corrective Action Report (Root Cause + Actions)' },
  { id: 'supporting', label: 'Supporting Evidence Document' },
  { id: 'training',   label: 'Training Record' },
  { id: 'auditor',   label: 'Auditor Response Letter' },
];

// ─── Prompt builder ──────────────────────────────────────────────────────────
function buildPrompt(nc: NcRecord, types: string[], hospitalId: string): string {
  const hospital = getHospitalInfo(hospitalId);
  const logoUrl  = `${window.location.origin}${hospital.logo}`;
  const today    = getFormattedDate();
  const review   = getReviewDate();
  const docCode  = nc.standard_code.replace(/\s+/g, '-').toUpperCase();
  const docNo    = `HOH/NC/${docCode}/2026`;
  const severity = nc.score === 2 ? 'Major NC (Score 2)' : 'Minor NC (Score 3)';

  const selectedLabels = EVIDENCE_TYPES
    .filter((t) => types.includes(t.id))
    .map((t) => t.label);

  // CSS is taken verbatim from the standard evidence template used across the app
  const CSS = `
    html { height: 100%; overflow-y: auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.6; color: #333; padding: 2px 20px 20px; max-width: 800px; margin: 0 auto; }
    .page { page-break-after: always; padding-bottom: 30px; }
    .page:last-child { page-break-after: auto; }
    .header { text-align: center; border-bottom: 3px solid #1565C0; padding-bottom: 2px; margin-bottom: 5px; }
    .logo-area { width: 350px; height: 80px; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; }
    .logo-area img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .hospital-name { font-size: 24px; font-weight: bold; color: #1565C0; margin: 10px 0 5px; }
    .hospital-address { font-size: 11px; color: #666; }
    .doc-title { background: #1565C0; color: white; padding: 12px; font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; border-radius: 5px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .info-table th { background: #f5f5f5; font-weight: 600; width: 25%; }
    .auth-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .auth-table th { background: #1565C0; color: white; padding: 10px; text-align: center; }
    .auth-table td { border: 1px solid #ddd; padding: 10px; text-align: center; vertical-align: top; min-height: 80px; }
    .section { margin: 20px 0; }
    .section-title { background: #e3f2fd; padding: 8px 12px; font-weight: bold; color: #1565C0; border-left: 4px solid #1565C0; margin-bottom: 10px; }
    .section-content { padding: 10px 15px; }
    .procedure-step { margin: 10px 0; padding: 10px; background: #fafafa; border-radius: 5px; }
    .step-number { display: inline-block; width: 25px; height: 25px; background: #1565C0; color: white; border-radius: 50%; text-align: center; line-height: 25px; margin-right: 10px; font-weight: bold; }
    .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .data-table th { background: #1565C0; color: white; padding: 10px; text-align: left; }
    .data-table td { border: 1px solid #ddd; padding: 8px; }
    .data-table tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1565C0; text-align: center; font-size: 10px; color: #666; }
    .revision-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
    .revision-table th { background: #455a64; color: white; padding: 8px; }
    .revision-table td { border: 1px solid #ddd; padding: 8px; }
    .stamp-area { border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 20px 0; color: #999; }
    .objective-line { font-size: 12px; color: #333; margin: 15px 0; font-weight: 500; }
    .highlight-box { background: #e3f2fd; padding: 12px; border-left: 4px solid #1565C0; margin: 15px 0; }
    ul, ol { padding-left: 20px; margin: 8px 0; }
    li { margin: 4px 0; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  `;

  // Standard header block reused on every page
  const pageHeader = (docTitle: string, dept: string, category: string) => `
    <div class="header">
      <div class="logo-area"><img src="${logoUrl}" alt="${hospital.name} Logo" /></div>
    </div>

    <div class="objective-line">NC Closure Evidence &nbsp;|&nbsp; ${nc.standard_code} &nbsp;|&nbsp; ${nc.chapter_code} Chapter &nbsp;|&nbsp; NABH Audit: February 2026</div>

    <div class="doc-title">${docTitle}</div>

    <table class="info-table">
      <tr><th>Document No</th><td>${docNo}</td><th>Version</th><td>1.0</td></tr>
      <tr><th>Department</th><td>${dept}</td><th>Category</th><td>${category}</td></tr>
      <tr><th>Effective Date</th><td>${today}</td><th>Review Date</th><td>${review}</td></tr>
      <tr><th>NC Standard</th><td>${nc.standard_code}</td><th>Severity</th><td>${severity}</td></tr>
    </table>

    <table class="auth-table">
      <tr><th>PREPARED BY</th><th>REVIEWED BY</th><th>APPROVED BY</th></tr>
      <tr>
        <td>Name: Sonali Kakde<br>Designation: Clinical Audit Coordinator<br>Date: ${today}<br><br>Signature:<br><img src="/Sonali's signature.png" alt="Sonali Kakde Signature" style="height:50px;max-width:120px;object-fit:contain;"></td>
        <td>Name: Gaurav Agrawal<br>Designation: Hospital Administrator<br>Date: ${today}<br><br>Signature:<br><img src="/Gaurav's signature.png" alt="Gaurav Agrawal Signature" style="height:50px;max-width:120px;object-fit:contain;"></td>
        <td>Name: Dr. Shiraz Khan<br>Designation: NABH Coordinator / Administrator<br>Date: ${today}<br><br>Signature:<br><img src="/Dr shiraz's signature.png" alt="Dr. Shiraz Khan Signature" style="height:50px;max-width:120px;object-fit:contain;"></td>
      </tr>
    </table>
  `;

  // Standard footer block reused on every page
  const pageFooter = `
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
  `;

  return `You are a NABH quality expert helping ${hospital.name} close a Non-Conformity from their February 2026 NABH accreditation audit.

NON-CONFORMITY:
- Standard: ${nc.standard_code}
- Chapter: ${nc.chapter_code}
- Finding: ${nc.nc_description}
- Severity: ${severity}
- Document No: ${docNo}

Generate a SINGLE complete HTML document with ${selectedLabels.length} section(s), one per page (use page-break-after: always between pages).

MANDATORY: Use EXACTLY the HTML structure and CSS provided below. Do NOT invent new CSS or change the template layout.

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NC Closure Evidence — ${nc.standard_code} — ${hospital.name}</title>
  <style>${CSS}</style>
</head>
<body>

${types.includes('corrective') ? `
<!-- ═══════════════════ PAGE 1: CORRECTIVE ACTION REPORT ═══════════════════ -->
<div class="page">
  ${pageHeader('CORRECTIVE ACTION REPORT', nc.chapter_code + ' Department', 'NC Closure')}

  <div class="section">
    <div class="section-title">1. Non-Conformity Description</div>
    <div class="section-content">
      <p><strong>Finding:</strong> ${nc.nc_description}</p>
      <p><strong>Audit Date:</strong> February 2026 &nbsp;|&nbsp; <strong>Standard:</strong> ${nc.standard_code} &nbsp;|&nbsp; <strong>Severity:</strong> ${severity}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Immediate Correction Taken</div>
    <div class="section-content">
      [Generate 3–4 specific immediate corrections taken within 48 hours of the audit observation. Be precise and relevant to the finding: "${nc.nc_description}"]
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Root Cause Analysis (5-Why Method)</div>
    <div class="section-content">
      [Generate a complete 5-Why analysis table relevant to the NC. Use a .data-table with columns: Why # | Question | Answer]
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Corrective Action Plan</div>
    <div class="section-content">
      [Generate a .data-table with columns: Sr | Action Item | Responsible Person | Target Date | Status. Use March–April 2026 dates. Minimum 5 action items specific to resolving: "${nc.nc_description}"]
    </div>
  </div>

  <div class="section">
    <div class="section-title">5. Preventive Measures</div>
    <div class="section-content">
      [Generate 4–5 long-term preventive measures as bullet points to ensure this NC does not recur]
    </div>
  </div>

  ${pageFooter}
</div>` : ''}

${types.includes('supporting') ? `
<!-- ═══════════════════ PAGE 2: SUPPORTING EVIDENCE DOCUMENT ═══════════════════ -->
<div class="page">
  ${pageHeader('SUPPORTING EVIDENCE DOCUMENT', nc.chapter_code + ' Department', 'Evidence Record')}

  <div class="section">
    <div class="section-title">1. Evidence Checklist</div>
    <div class="section-content">
      [Generate a .data-table with columns: Sr | Evidence Item | Document Reference | Status (Available/In Progress) | Verified By. List 8–10 specific evidence items relevant to closing NC: "${nc.nc_description}"]
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Photographic / Documentary Evidence Summary</div>
    <div class="section-content">
      [Generate a .data-table listing 5–6 photos or documents with: Sr | Evidence Description | Date Captured | Location | Remarks. Be specific to the NC finding]
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Verification and Closure Records</div>
    <div class="section-content">
      [Generate a .data-table with: Verification Item | Date Verified | Verified By | Observation | Result (Compliant / Pending). 4–5 rows]
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. NC Status Update</div>
    <div class="section-content">
      <div class="highlight-box">
        [Write a 3–4 line status summary confirming that the NC has been addressed, evidence collected, and closure is being sought from the NABH assessor]
      </div>
    </div>
  </div>

  ${pageFooter}
</div>` : ''}

${types.includes('training') ? `
<!-- ═══════════════════ PAGE 3: TRAINING RECORD ═══════════════════ -->
<div class="page">
  ${pageHeader('TRAINING RECORD — NC CLOSURE', nc.chapter_code + ' Department', 'Training Evidence')}

  <div class="section">
    <div class="section-title">1. Training Details</div>
    <div class="section-content">
      [Generate a .data-table (2-column key-value) with: Training Topic | [topic relevant to NC] | Date | [March 2026 date] | Time | 11:30 AM | Duration | 1.5 Hours | Venue | Conference Room, ${hospital.name} | Trainer | Dr. Shiraz Khan | Objective | [objective relevant to closing this NC]]
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Staff Trained — Attendance Record</div>
    <div class="section-content">
      [Generate a .data-table with columns: Sr | Name | Designation | Department | Signature. Include 12–15 staff members from Hope Hospital (nurses, technicians, pharmacist, wardboys, etc.) relevant to the NC chapter]
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Assessment Results</div>
    <div class="section-content">
      [Generate a .data-table with columns: Sr | Name | Pre-Test Score | Post-Test Score | % | Result (Pass/Fail). 8–10 staff with mostly passing scores (≥70%). Include a summary box below: Total Assessed | Average Pre-Test | Average Post-Test | Pass Rate]
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Training Effectiveness Evaluation</div>
    <div class="section-content">
      [Generate 3–4 bullet points on how this training directly addresses the NC finding and prevents recurrence]
    </div>
  </div>

  ${pageFooter}
</div>` : ''}

${types.includes('auditor') ? `
<!-- ═══════════════════ PAGE 4: AUDITOR RESPONSE LETTER ═══════════════════ -->
<div class="page">
  ${pageHeader('AUDITOR RESPONSE LETTER', 'Quality & Administration', 'Formal Correspondence')}

  <div class="section">
    <div class="section-content">
      <p style="text-align:right; margin-bottom:20px;">Date: ${today}</p>

      <p><strong>To,</strong><br>
      The NABH Assessment Team<br>
      National Accreditation Board for Hospitals & Healthcare Providers<br>
      Quality Council of India, New Delhi</p>

      <p style="margin-top:16px;"><strong>Subject: Corrective Action Response for Non-Conformity — ${nc.standard_code}</strong></p>

      <p style="margin-top:16px;">Reference: NABH Audit — February 2026 | ${hospital.name} | NC Standard: ${nc.standard_code}</p>

      <p style="margin-top:16px;">Dear Assessment Team,</p>

      <div class="section-title" style="margin-top:16px;">NC Finding Reference</div>
      <p>${nc.nc_description}</p>

      <div class="section-title" style="margin-top:16px;">Corrective Actions Taken</div>
      [Generate 4–5 numbered paragraphs describing specific corrective actions taken to address the NC. Use formal letter language. Include dates (March–April 2026), responsible persons, and measurable outcomes]

      <div class="section-title" style="margin-top:16px;">Compliance Timeline</div>
      [Generate a .data-table with columns: Action | Completion Date | Status | Evidence Reference. 4–5 rows showing all actions are complete or near-complete]

      <div class="section-title" style="margin-top:16px;">Closure Request</div>
      <p>[Write a formal 2–3 sentence paragraph requesting the assessor to consider the NC as closed, referencing the attached evidence and improvements made]</p>

      <p style="margin-top:30px;">Yours sincerely,</p>
      <br>
      <p><strong>Dr. Shiraz Khan</strong><br>
      NABH Coordinator / Administrator<br>
      ${hospital.name}<br>
      ${hospital.phone} | ${hospital.email}</p>
    </div>
  </div>

  ${pageFooter}
</div>` : ''}

</body>
</html>

INSTRUCTIONS:
1. Return ONLY the complete HTML starting with <!DOCTYPE html>. No markdown fences.
2. Fill in ALL [bracketed placeholders] with real, specific content relevant to: "${nc.nc_description}"
3. Use proper NABH terminology. All dates must be in March–April 2026 range.
4. Keep ALL CSS classes and template structure exactly as shown. Do not add new inline styles.
5. Tables must use class="data-table". Sections must use class="section", class="section-title", class="section-content".
6. Each <div class="page"> must end with the revision-table, stamp-area, and footer exactly as shown.`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NCEvidenceModal({ nc, open, onClose, onSaved }: NCEvidenceModalProps) {
  const { selectedHospital } = useNABHStore();
  const hospitalId = selectedHospital || 'hope';

  const [selectedTypes, setSelectedTypes] = useState<string[]>(['corrective', 'supporting', 'training', 'auditor']);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(nc.evidence_html || null);

  const isMajor = nc.score === 2;

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError('Select at least one evidence type.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const prompt = buildPrompt(nc, selectedTypes, hospitalId);
      const result = await callGeminiAPI(prompt, 0.7, 8192);
      let text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // strip markdown code fences if present
      text = text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/, '').trim();
      if (!text.toLowerCase().startsWith('<!doctype') && !text.toLowerCase().startsWith('<html')) {
        text = `<!DOCTYPE html><html><body>${text}</body></html>`;
      }
      setHtml(text);
    } catch (e: any) {
      setError(e.message || 'Failed to generate evidence');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!html) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await (supabase as any)
        .from('nabh_ncs')
        .update({ evidence_html: html, updated_at: new Date().toISOString() })
        .eq('id', nc.id);
      if (err) throw err;
      onSaved(html);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!html) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon color="primary">auto_awesome</Icon>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Generate Evidence for NC: {nc.standard_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nc.nc_description}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={isMajor ? 'Major NC' : 'Minor NC'}
            size="small"
            color={isMajor ? 'error' : 'warning'}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Evidence type selector — only shown before generation */}
        {!html && (
          <Box sx={{ mb: 3 }}>
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
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* HTML Preview */}
        {html && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Icon color="success">check_circle</Icon>
              <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                Evidence generated — uses standard hospital template
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => setHtml(null)} startIcon={<Icon>refresh</Icon>}>
                Regenerate
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'auto',
                maxHeight: 520,
                bgcolor: 'white',
              }}
            >
              <iframe
                srcDoc={html}
                title="Evidence Preview"
                style={{ width: '100%', minHeight: 500, border: 'none' }}
              />
            </Box>
          </Box>
        )}

        {generating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              Generating evidence with Gemini AI — using standard hospital template…
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {html ? (
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
              startIcon={saving ? <CircularProgress size={18} /> : <Icon>save</Icon>}
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
                ? <CircularProgress size={18} sx={{ color: 'white' }} />
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
