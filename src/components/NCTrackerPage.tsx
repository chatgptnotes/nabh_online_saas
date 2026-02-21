import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { supabase } from '../lib/supabase';
import { useNABHStore } from '../store/nabhStore';
import NCEvidenceModal from './NCEvidenceModal';

// ---------- types ----------
export interface NcRecord {
  id: string;
  hospital_id: string;
  chapter_code: string;
  standard_code: string;
  nc_description: string;
  score: number;
  status: 'Open' | 'In Progress' | 'Closed';
  corrective_action: string | null;
  evidence_html: string | null;
  audit_date: string;
  created_at: string;
  updated_at: string;
}

// ---------- seed data ----------
const SEED_NCS: Omit<NcRecord, 'id' | 'created_at' | 'updated_at'>[] = [
  // AAC
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 2.e', nc_description: 'Prioritisation as per clinical conditions was not evidenced in OPD', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 4.f', nc_description: 'MOU with outsourced lab did not incorporate Quality assurance parameters', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 4.g', nc_description: 'Reagents stored in a fridge where temperature monitoring was not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 5.d', nc_description: 'TAT of X-Ray report was not evidenced to be monitored', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 5.f', nc_description: 'MOU with outsourced imaging centre did not incorporate Quality assurance parameters', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC Imaging peer review', nc_description: 'Peer review reports not signed by primary and reviewing radiologist', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 6.c', nc_description: 'Screening before X-Ray not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 6.d', nc_description: 'TLD badges not available for Cardiologist in Cathlab and staff using C-Arm', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'AAC', standard_code: 'AAC 6.e', nc_description: 'Radiation Hazard Signage not displayed outside Cathlab and OT where C-Arm is used', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // COP
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP CPR', nc_description: 'Post analysis of all CPR by multidisciplinary committee was not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP Patient care', nc_description: 'Nursing assignments are not as per acuity based assignments', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 6.a', nc_description: 'ICU staffs are unaware about admission and discharge criteria of ICU', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 7.c', nc_description: 'Antenatal assessment form was not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 7.d', nc_description: 'Perinatal and postnatal forms are not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 9.e', nc_description: 'Post procedure monitoring using objective criteria was not documented in recovery room', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 11.h', nc_description: 'Differential pressure was not monitored in two Modular OTs', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'COP', standard_code: 'COP 13.b', nc_description: 'Pain alleviation measures are not titrated as per patient needs', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // MOM
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 2.c', nc_description: 'LASA medicines separate lists not evidenced; Atropine & Adrenaline stored adjacent', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 4.c', nc_description: 'Medication orders are not legible uniformly', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 5.c', nc_description: 'Expiry dates of medicines not monitored in Crash carts in SHCO', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 6.b', nc_description: 'Medication labelling before preparing second drug was not evidenced in ICU', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 6.f', nc_description: 'Measures to avoid catheter and tubing misconnections was not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'MOM', standard_code: 'MOM 8.e', nc_description: 'When remaining part of controlled substance is discarded entry not signed by two persons', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // PRE
  { hospital_id: 'hope', chapter_code: 'PRE', standard_code: 'PRE 4.a', nc_description: 'Patient and family education was not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PRE', standard_code: 'PRE 4.b', nc_description: 'Education on safe use of medication and side effects not documented', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PRE', standard_code: 'PRE 4.c', nc_description: 'Education on food-drug interactions and diet/nutrition not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PRE', standard_code: 'PRE 4.e', nc_description: 'Education about preventing healthcare associated infections not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // HIC
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 2.d', nc_description: 'Safe injection and infusion practices not evidenced in ICU (labelling missing)', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 2.f', nc_description: 'Monitoring of rational usage of antibiotics was not evidenced', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 3.d', nc_description: 'Annual BMW Report submission to State Pollution Control Board not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 5.b', nc_description: 'Hand hygiene monitoring not done using standard WHO tool', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 5.c', nc_description: 'Multi drug resistant organisms was not captured', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 6.a', nc_description: 'ETO machine not kept in separate enclosure', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HIC', standard_code: 'HIC 6.d', nc_description: 'Chemical indicator not used in CSSD; Biological Indicators used fortnightly not weekly', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // PSQ
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 1.h', nc_description: 'Internal Audits not covering all objective elements of 3rd edition NABH SHCO Standards', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 1.i', nc_description: 'Nursing audit of nursing procedures was not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 2.a', nc_description: 'Initial assessment time, medication error capture, standardized mortality ratio not monitored', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 2.b', nc_description: 'SSI data not monitored for 30/90 days; Hand Hygiene compliance by staff category missing', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 2.c', nc_description: 'Waiting time for diagnostics data not captured correctly', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'PSQ', standard_code: 'PSQ 2.e', nc_description: 'Verification of data submitted to quality team was not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // ROM
  { hospital_id: 'hope', chapter_code: 'ROM', standard_code: 'ROM 3.c', nc_description: 'Review of effectiveness of various Committees not evidenced per defined checklist', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'ROM', standard_code: 'ROM 4.e', nc_description: 'Monitoring of outsourced services not evidenced to be done by appropriate teams', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // FMS
  { hospital_id: 'hope', chapter_code: 'FMS', standard_code: 'FMS 2.a', nc_description: 'Grab bars not available in patient toilets', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'FMS', standard_code: 'FMS 2.b', nc_description: 'Appropriate toilet facilities for differently-abled not available in SHCO', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'FMS', standard_code: 'FMS 2.d', nc_description: 'Rubber mats in lift room not evidenced', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'FMS', standard_code: 'FMS 4.b', nc_description: 'All cylinders in gas manifold not secured with chains or brackets', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'FMS', standard_code: 'FMS 4.c', nc_description: 'Oxygen cylinders connected to one bank only (two-bank manifold not used)', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // HRM
  { hospital_id: 'hope', chapter_code: 'HRM', standard_code: 'HRM 1.i', nc_description: 'Internal Complaints Committee needs reconstitution; women members less than 50%', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HRM', standard_code: 'HRM 3.b', nc_description: 'ER nurses are not aware of disaster management plan', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HRM', standard_code: 'HRM 3.c', nc_description: 'Nurses in ICU are not aware of incident management', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'HRM', standard_code: 'HRM 3.e', nc_description: 'Training report evidenced but nurses in ER not aware about disaster management', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  // IMS
  { hospital_id: 'hope', chapter_code: 'IMS', standard_code: 'IMS 2.b', nc_description: 'Contents of medical records are not identified and documented uniformly', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'IMS', standard_code: 'IMS 2.d', nc_description: 'Sign and time not evidenced uniformly in patient records', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'IMS', standard_code: 'IMS 2.e', nc_description: 'Medical records contain unauthorised abbreviations', score: 3, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
  { hospital_id: 'hope', chapter_code: 'IMS', standard_code: 'IMS 5.b', nc_description: 'Document control numbers not evidenced uniformly in all formats', score: 2, status: 'Open', corrective_action: null, evidence_html: null, audit_date: '2026-02-01' },
];

const CHAPTER_NAMES: Record<string, string> = {
  AAC: 'Access, Assessment & Continuity',
  COP: 'Care of Patients',
  MOM: 'Management of Medication',
  PRE: 'Patient Rights & Education',
  HIC: 'Hospital Infection Control',
  PSQ: 'Patient Safety & Quality Improvement',
  ROM: 'Responsibilities of Management',
  FMS: 'Facility Management & Safety',
  HRM: 'Human Resource Management',
  IMS: 'Information Management System',
};

const CHAPTER_ORDER = ['AAC', 'COP', 'MOM', 'PRE', 'HIC', 'PSQ', 'ROM', 'FMS', 'HRM', 'IMS'];

function statusColor(status: string) {
  if (status === 'Closed') return 'success';
  if (status === 'In Progress') return 'warning';
  return 'error';
}

function nextStatus(current: string): 'Open' | 'In Progress' | 'Closed' {
  if (current === 'Open') return 'In Progress';
  if (current === 'In Progress') return 'Closed';
  return 'Open';
}

export default function NCTrackerPage() {
  const { selectedHospital } = useNABHStore();
  const hospitalId = selectedHospital || 'hope';

  const [ncs, setNcs] = useState<NcRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | false>('AAC');
  const [evidenceNc, setEvidenceNc] = useState<NcRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadNcs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await (supabase as any)
        .from('nabh_ncs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('chapter_code')
        .order('standard_code');
      if (err) throw err;

      if (!data || data.length === 0) {
        // seed
        setSeeding(true);
        const seedRows = SEED_NCS.map((r) => ({ ...r, hospital_id: hospitalId }));
        const { data: inserted, error: seedErr } = await (supabase as any)
          .from('nabh_ncs')
          .insert(seedRows)
          .select();
        setSeeding(false);
        if (seedErr) throw seedErr;
        setNcs(inserted || []);
      } else {
        setNcs(data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load NCs');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadNcs();
  }, [loadNcs]);

  const handleStatusClick = async (nc: NcRecord) => {
    const newStatus = nextStatus(nc.status);
    setUpdatingId(nc.id);
    try {
      const { error: err } = await (supabase as any)
        .from('nabh_ncs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', nc.id);
      if (err) throw err;
      setNcs((prev) => prev.map((r) => (r.id === nc.id ? { ...r, status: newStatus } : r)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEvidenceSaved = (ncId: string, html: string) => {
    setNcs((prev) => prev.map((r) => (r.id === ncId ? { ...r, evidence_html: html } : r)));
  };

  // group by chapter
  const byChapter: Record<string, NcRecord[]> = {};
  for (const nc of ncs) {
    if (!byChapter[nc.chapter_code]) byChapter[nc.chapter_code] = [];
    byChapter[nc.chapter_code].push(nc);
  }

  const total = ncs.length;
  const openCount = ncs.filter((n) => n.status === 'Open').length;
  const inProgressCount = ncs.filter((n) => n.status === 'In Progress').length;
  const closedCount = ncs.filter((n) => n.status === 'Closed').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
        {seeding && (
          <Typography sx={{ ml: 2 }} color="text.secondary">
            Seeding 52 NCs for the first time…
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          NC Tracker — February 2026 NABH Audit
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={`${total} Total NCs`} color="default" icon={<Icon>list</Icon>} />
          <Chip label={`Open: ${openCount}`} color="error" />
          <Chip label={`In Progress: ${inProgressCount}`} color="warning" />
          <Chip label={`Closed: ${closedCount}`} color="success" />
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Reload from database">
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon>refresh</Icon>}
              onClick={loadNcs}
            >
              Refresh
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Chapter Accordions */}
      {CHAPTER_ORDER.map((code) => {
        const chapterNcs = byChapter[code] || [];
        if (chapterNcs.length === 0) return null;
        const chapterClosed = chapterNcs.filter((n) => n.status === 'Closed').length;
        const allDone = chapterClosed === chapterNcs.length;

        return (
          <Accordion
            key={code}
            expanded={expandedChapter === code}
            onChange={(_, exp) => setExpandedChapter(exp ? code : false)}
            sx={{ mb: 1, borderRadius: '12px !important', overflow: 'hidden' }}
          >
            <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography fontWeight={700} sx={{ flex: 1 }}>
                  {code} — {CHAPTER_NAMES[code]} ({chapterNcs.length} NCs)
                </Typography>
                {allDone ? (
                  <Chip label="All Closed" color="success" size="small" icon={<Icon>check_circle</Icon>} />
                ) : (
                  <Chip
                    label={`${chapterClosed}/${chapterNcs.length} Closed`}
                    size="small"
                    color={chapterClosed > 0 ? 'warning' : 'default'}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {chapterNcs.map((nc) => (
                <NCCard
                  key={nc.id}
                  nc={nc}
                  updating={updatingId === nc.id}
                  onStatusClick={() => handleStatusClick(nc)}
                  onGenerate={() => setEvidenceNc(nc)}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Evidence Modal */}
      {evidenceNc && (
        <NCEvidenceModal
          nc={evidenceNc}
          open={!!evidenceNc}
          onClose={() => setEvidenceNc(null)}
          onSaved={(html) => handleEvidenceSaved(evidenceNc.id, html)}
        />
      )}
    </Box>
  );
}

// ---------- NC Card sub-component ----------
interface NCCardProps {
  nc: NcRecord;
  updating: boolean;
  onStatusClick: () => void;
  onGenerate: () => void;
}

function NCCard({ nc, updating, onStatusClick, onGenerate }: NCCardProps) {
  const isMajor = nc.score === 2;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        borderLeft: `4px solid ${isMajor ? '#D32F2F' : '#ED6C02'}`,
        '&:last-child': { mb: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
        {/* Standard code */}
        <Chip
          label={nc.standard_code}
          size="small"
          sx={{ fontWeight: 700, bgcolor: '#1565C0', color: 'white', borderRadius: 1 }}
        />

        {/* Score chip */}
        <Chip
          label={isMajor ? 'Major NC' : 'Minor NC'}
          size="small"
          color={isMajor ? 'error' : 'warning'}
        />

        {/* Status chip — clickable */}
        <Tooltip title={`Click to advance: → ${nextStatus(nc.status)}`}>
          <Chip
            label={nc.status}
            size="small"
            color={statusColor(nc.status) as any}
            onClick={onStatusClick}
            disabled={updating}
            icon={updating ? <CircularProgress size={14} /> : undefined}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          />
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        {/* Evidence stored badge */}
        {nc.evidence_html && (
          <Chip
            label="PDF Ready"
            size="small"
            color="success"
            variant="outlined"
            icon={<Icon sx={{ fontSize: '14px !important' }}>picture_as_pdf</Icon>}
            sx={{ fontWeight: 600 }}
          />
        )}

        {/* Eye icon to view stored evidence */}
        {nc.evidence_html && (
          <Tooltip title="View / Edit stored evidence">
            <Chip
              label="View"
              size="small"
              color="success"
              icon={<Icon sx={{ fontSize: '14px !important' }}>visibility</Icon>}
              onClick={onGenerate}
              sx={{ cursor: 'pointer', fontWeight: 600 }}
            />
          </Tooltip>
        )}

        {/* Generate / Regenerate button */}
        <Button
          size="small"
          variant={nc.evidence_html ? 'text' : 'contained'}
          startIcon={<Icon>{nc.evidence_html ? 'refresh' : 'auto_awesome'}</Icon>}
          onClick={onGenerate}
          color={nc.evidence_html ? 'inherit' : 'primary'}
          sx={{ minWidth: 0 }}
        >
          {nc.evidence_html ? 'Regen' : 'Generate'}
        </Button>

        {/* Closed checkmark */}
        {nc.status === 'Closed' && (
          <Icon sx={{ color: 'success.main', ml: 0.5 }}>check_circle</Icon>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {nc.nc_description}
      </Typography>
    </Paper>
  );
}
