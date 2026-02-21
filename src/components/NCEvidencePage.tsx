/**
 * NCEvidencePage — full-page evidence viewer/generator for a single NC
 * Route: /nc-evidence/:ncId
 * Replaces the modal dialog for a better full-screen experience with shareable URL.
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import { callGeminiAPI, supabase } from '../lib/supabase';
import { getHospitalInfo } from '../config/hospitalConfig';
import { useNABHStore } from '../store/nabhStore';
import type { NcRecord } from './NCTrackerPage';
import {
  EVIDENCE_TYPES,
  buildContentPrompt,
  assembleHTML,
  captureIframeHtml,
} from './NCEvidenceModal';

interface StaffMember {
  name: string;
  designation: string;
  department: string;
}

export default function NCEvidencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const ncId = location.pathname.split('/nc-evidence/')[1];

  const { selectedHospital } = useNABHStore();
  const hospitalId = selectedHospital || 'hope';
  const hospital = getHospitalInfo(hospitalId);

  const logoUrl = hospital.logo.startsWith('http')
    ? hospital.logo
    : `${window.location.origin}${hospital.logo}`;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [nc, setNc] = useState<NcRecord | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['corrective', 'supporting', 'training', 'auditor']);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewHtml, setViewHtml] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Load NC record and staff on mount
  useEffect(() => {
    if (!ncId) return;
    (async () => {
      setPageLoading(true);
      const [{ data: ncData }, { data: staffData }] = await Promise.all([
        (supabase as any).from('nabh_ncs').select('*').eq('id', ncId).single(),
        (supabase as any)
          .from('nabh_team_members')
          .select('name, designation, department')
          .order('name'),
      ]);
      if (ncData) {
        setNc(ncData as NcRecord);
        setViewHtml((ncData as NcRecord).evidence_html || null);
      }
      if (staffData && staffData.length > 0) setStaff(staffData);
      setPageLoading(false);
    })();
  }, [ncId]);

  const handleIframeLoad = () => {
    if (editMode && iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'on';
    }
  };

  const toggleType = (id: string) =>
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleEnterEdit = () => {
    if (iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'on';
      iframeRef.current.contentDocument.body?.focus();
    }
    setEditMode(true);
  };

  const handleDoneEditing = () => {
    const captured = captureIframeHtml(iframeRef.current);
    if (iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.designMode = 'off';
    }
    setEditMode(false);
    if (captured) setViewHtml(captured);
  };

  const handleGenerate = async () => {
    if (!nc) return;
    if (selectedTypes.length === 0) { setError('Select at least one evidence type.'); return; }
    setGenerating(true);
    setEditMode(false);
    setError(null);
    try {
      const sectionDefs = [
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

  const handleSave = async () => {
    if (!nc) return;
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
      setNc((prev) => prev ? { ...prev, evidence_html: toSave! } : prev);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nc) return;
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
      setNc((prev) => prev ? { ...prev, evidence_html: null } : prev);
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

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

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading NC evidence…</Typography>
      </Box>
    );
  }

  if (!nc) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">NC not found. The link may be invalid.</Alert>
        <Button startIcon={<Icon>arrow_back</Icon>} onClick={() => navigate('/nc-tracker')} sx={{ mt: 2 }}>
          Back to NC Tracker
        </Button>
      </Box>
    );
  }

  const isMajor = nc.score === 2;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* ── Top toolbar ── */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', flexShrink: 0, flexWrap: 'wrap',
        }}
      >
        <Button
          startIcon={<Icon>arrow_back</Icon>}
          onClick={() => navigate('/nc-tracker')}
          variant="outlined"
          size="small"
        >
          NC Tracker
        </Button>

        <Icon color="primary" sx={{ fontSize: 20 }}>auto_awesome</Icon>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            NC Evidence: {nc.standard_code}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {nc.nc_description}
          </Typography>
        </Box>

        <Chip
          label={isMajor ? 'Major NC' : 'Minor NC'}
          size="small"
          color={isMajor ? 'error' : 'warning'}
        />
        {viewHtml && (
          <Chip label="Evidence Stored" size="small" color="success" icon={<Icon>check_circle</Icon>} />
        )}

        {/* Action buttons — shown when evidence exists */}
        {viewHtml && !generating && (
          <>
            {!editMode ? (
              <Button size="small" variant="outlined" startIcon={<Icon>edit</Icon>} onClick={handleEnterEdit}>
                Edit
              </Button>
            ) : (
              <Button size="small" variant="contained" color="warning" startIcon={<Icon>done</Icon>} onClick={handleDoneEditing}>
                Done Editing
              </Button>
            )}
            <Button size="small" variant="outlined" startIcon={<Icon>refresh</Icon>} onClick={handleGenerate}>
              Regenerate
            </Button>
            <Button size="small" variant="outlined" startIcon={<Icon>picture_as_pdf</Icon>} onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Icon>save</Icon>}
              onClick={handleSave}
              disabled={saving}
            >
              Save to DB
            </Button>
            <Tooltip title="Delete evidence document">
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Icon>delete</Icon>}
                onClick={handleDelete}
                disabled={deleting}
              >
                Delete
              </Button>
            </Tooltip>
          </>
        )}

        {/* Generate button — shown when no evidence yet */}
        {!viewHtml && !generating && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<Icon>auto_awesome</Icon>}
            onClick={handleGenerate}
            disabled={selectedTypes.length === 0}
          >
            Generate All
          </Button>
        )}
      </Box>

      {/* ── Edit mode banner ── */}
      {editMode && (
        <Box sx={{
          bgcolor: 'warning.light', px: 2, py: 0.75, fontSize: 13, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Icon sx={{ fontSize: 16 }}>edit</Icon>
          Edit mode active — click anywhere in the document to edit text directly
        </Box>
      )}

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, my: 1, flexShrink: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Evidence type selector (before first generation) ── */}
      {!viewHtml && !generating && (
        <Box sx={{ p: 2.5, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Select evidence types to generate:
          </Typography>
          <FormGroup row>
            {EVIDENCE_TYPES.map((t) => (
              <FormControlLabel
                key={t.id}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(t.id)}
                    onChange={() => toggleType(t.id)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{t.label}</Typography>}
                sx={{ mr: 3, mb: 0.5 }}
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

      {/* ── Generating spinner ── */}
      {generating && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, flexShrink: 0 }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">
            Generating evidence documents… this may take 30–60 seconds
          </Typography>
        </Box>
      )}

      {/* ── Document preview fills remaining height ── */}
      {viewHtml && !generating && (
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <iframe
            ref={iframeRef}
            srcDoc={viewHtml}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            onLoad={handleIframeLoad}
            title={`NC Evidence ${nc.standard_code}`}
          />
        </Box>
      )}
    </Box>
  );
}
