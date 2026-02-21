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
  { id: 'training', label: 'Training Record' },
  { id: 'auditor', label: 'Auditor Response Letter' },
];

function buildPrompt(nc: NcRecord, types: string[]): string {
  const typeLabels = EVIDENCE_TYPES.filter((t) => types.includes(t.id))
    .map((t) => t.label)
    .join(', ');

  return `You are a NABH quality expert helping Hope Hospital in Mumbai resolve a Non-Conformity identified during their February 2026 NABH accreditation audit.

NON-CONFORMITY DETAILS:
- Standard: ${nc.standard_code}
- Chapter: ${nc.chapter_code}
- Finding: ${nc.nc_description}
- Severity: ${nc.score === 2 ? 'Major NC (Score 2)' : 'Minor NC (Score 3)'}
- Audit Date: ${nc.audit_date}

Generate a professional HTML document containing the following sections: ${typeLabels}.

Use this HTML structure:
- Use inline styles for all formatting (no external CSS)
- Professional blue header with "HOPE HOSPITAL — NC CLOSURE EVIDENCE"
- Sub-header showing NC code and date
- For EACH requested section, use an <h2> with section title
- Content in <p>, <ul>, <li> tags
- Tables where appropriate for action plans
- A signatures section at the bottom with: Quality Manager | Department Head | CEO
- Use proper NABH terminology and realistic action items, timelines (use March-April 2026 dates), responsible persons
- Include document reference number like HOH/NC/${nc.standard_code.replace(/\s/g, '-')}/2026

Corrective Action Report should include:
- Description of NC
- Root cause analysis (Why-Why analysis with 5 whys)
- Immediate correction taken
- Corrective action plan with timeline
- Preventive measures

Supporting Evidence should include:
- Evidence list checklist
- Photographs / document description placeholders
- Verification records

Training Record should include:
- Topic, date, trainer name, venue
- List of staff trained (at least 10 names in a table with designation, signature)
- Pre/post test scores table
- Training effectiveness evaluation

Auditor Response Letter should include:
- Formal letter format to NABH Assessment Team
- Reference to audit and NC number
- Corrective actions taken
- Timeline for compliance
- Closing statement

Return ONLY the raw HTML document starting with <!DOCTYPE html>.`;
}

export default function NCEvidenceModal({ nc, open, onClose, onSaved }: NCEvidenceModalProps) {
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
      const prompt = buildPrompt(nc, selectedTypes);
      const result = await callGeminiAPI(prompt, 0.7, 8192);
      let text: string =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // strip markdown code fences if present
      text = text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/, '').trim();
      if (!text.toLowerCase().startsWith('<!doctype') && !text.toLowerCase().startsWith('<html')) {
        // wrap if just a fragment
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
    setTimeout(() => {
      win.print();
    }, 500);
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
        {/* Evidence type selector */}
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
                Evidence generated successfully
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
                maxHeight: 500,
                bgcolor: 'white',
              }}
            >
              <iframe
                srcDoc={html}
                title="Evidence Preview"
                style={{ width: '100%', minHeight: 480, border: 'none' }}
              />
            </Box>
          </Box>
        )}

        {generating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              Generating evidence with Gemini AI…
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
            startIcon={generating ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Icon>auto_awesome</Icon>}
            onClick={handleGenerate}
            disabled={generating || selectedTypes.length === 0}
          >
            {generating ? 'Generating…' : 'Generate All'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
