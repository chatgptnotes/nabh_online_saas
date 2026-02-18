import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Toolbar from '@mui/material/Toolbar';
import LinearProgress from '@mui/material/LinearProgress';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import StructuredDataView from './StructuredDataView';
import { departmentDocumentStorage } from '../services/departmentDocumentStorage';
import type { DepartmentDocument } from '../services/departmentDocumentStorage';
import { extractFromDocument } from '../services/documentExtractor';
import { supabase } from '../lib/supabase';
import { fetchRealPatients, fetchRealStaff, fetchVisitingConsultants } from '../services/hopeHospitalDatabase';

const drawerWidth = 280;

interface DepartmentInfo {
  name: string;
  code: string;
  category: string;
  description: string;
  head_of_department: string;
}

export default function DepartmentDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [department, setDepartment] = useState<DepartmentInfo | null>(null);
  const [documents, setDocuments] = useState<DepartmentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual entry state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload state per title
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Global upload (Select Title dropdown)
  const [selectedParent, setSelectedParent] = useState('');
  const [globalUploadFile, setGlobalUploadFile] = useState<File | null>(null);
  const [globalUploading, setGlobalUploading] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState<DepartmentDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDepartment = useCallback(async () => {
    if (!code) return;
    console.log('[DepartmentDetail] Fetching department for code:', code);
    const { data, error } = await supabase
      .from('departments')
      .select('name, code, category, description, head_of_department')
      .eq('code', code)
      .single();
    console.log('[DepartmentDetail] Department result:', data, error);
    if (data) setDepartment(data);
  }, [code]);

  const fetchDocuments = useCallback(async () => {
    if (!code) return;
    try {
      console.log('[DepartmentDetail] Fetching documents for code:', code);
      const docs = await departmentDocumentStorage.getDocuments(code);
      console.log('[DepartmentDetail] Fetched documents:', docs.length, docs);
      setDocuments(docs);
    } catch (err) {
      console.error('[DepartmentDetail] Error fetching documents:', err);
    }
  }, [code]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDepartment(), fetchDocuments()]);
      setLoading(false);
    };
    load();
  }, [fetchDepartment, fetchDocuments]);

  const titleEntries = documents.filter(d => d.file_url === 'manual-entry');
  const getChildren = (parentId: string) =>
    documents.filter(d => d.file_name.startsWith(`[parent:${parentId}]`));
  const orphanDocs = documents.filter(
    d => d.file_url !== 'manual-entry' && !d.file_name.startsWith('[parent:')
  );
  const totalEntries = titleEntries.length + orphanDocs.length;

  const getCleanFileName = (fileName: string) => {
    const match = fileName.match(/\[parent:[^\]]+\](.*)/);
    return match ? match[1] : fileName;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Save manual title entry
  const handleSaveTitle = async () => {
    if (!code || !newTitle.trim()) return;
    setSaving(true);
    try {
      await departmentDocumentStorage.saveManualEntry(code, newTitle.trim(), newDescription.trim());
      setNewTitle('');
      setNewDescription('');
      await fetchDocuments();
      showSnackbar('Title saved successfully', 'success');
    } catch (err) {
      console.error('Error saving title:', err);
      showSnackbar('Failed to save title', 'error');
    }
    setSaving(false);
  };

  // Upload file for a specific title
  const handleUploadForTitle = async (parentId: string, file: File) => {
    if (!code) return;
    setUploadingFor(parentId);
    try {
      const doc = await departmentDocumentStorage.uploadFile(code, file, parentId);
      showSnackbar('File uploaded, extracting text...', 'info');
      await fetchDocuments();

      // AI extraction
      setExtracting(doc.id);
      await runExtraction(doc, file);
      setExtracting(null);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      showSnackbar('Failed to upload file', 'error');
    }
    setUploadingFor(null);
  };

  // Global upload via Select Title dropdown
  const handleGlobalUpload = async () => {
    if (!code || !globalUploadFile || !selectedParent) return;
    setGlobalUploading(true);
    try {
      const doc = await departmentDocumentStorage.uploadFile(code, globalUploadFile, selectedParent);
      showSnackbar('File uploaded, extracting text...', 'info');
      const fileForExtraction = globalUploadFile;
      setGlobalUploadFile(null);
      setSelectedParent('');
      await fetchDocuments();

      setExtracting(doc.id);
      await runExtraction(doc, fileForExtraction);
      setExtracting(null);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      showSnackbar('Failed to upload file', 'error');
    }
    setGlobalUploading(false);
  };

  const runExtraction = async (doc: DepartmentDocument, file: File) => {
    try {
      const extractionPrompt = await buildExtractionPrompt(code || '');
      const result = await extractFromDocument(file, 'department', extractionPrompt);
      if (result.success && result.text) {
        let extracted: string;
        try {
          const jsonMatch = result.text.match(/```json\n?([\s\S]*?)\n?```/) || result.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            JSON.parse(jsonMatch[1] || jsonMatch[0]);
            extracted = jsonMatch[1] || jsonMatch[0];
          } else {
            extracted = JSON.stringify({
              title: doc.file_name, documentType: 'document',
              sections: [{ heading: 'Extracted Content', content: result.text }],
            });
          }
        } catch {
          extracted = JSON.stringify({
            title: doc.file_name, documentType: 'document',
            sections: [{ heading: 'Extracted Content', content: result.text }],
          });
        }
        await departmentDocumentStorage.updateExtractedText(doc.id, extracted);
        showSnackbar('Text extracted successfully!', 'success');
      } else {
        showSnackbar('Extraction completed with no text', 'info');
      }
    } catch (extractErr) {
      console.error('Extraction error:', extractErr);
      showSnackbar('File uploaded but extraction failed', 'error');
    }
  };

  const buildExtractionPrompt = async (deptCode: string): Promise<string> => {
    const [patients, staff, doctors] = await Promise.all([
      fetchRealPatients('hope', 30),
      fetchRealStaff('hope'),
      fetchVisitingConsultants('hope'),
    ]);
    const patientNames = patients.slice(0, 15).map(p => p.patient_name).join(', ');
    const staffNames = staff.slice(0, 15).map(s => `${s.name} (${s.designation})`).join(', ');
    const doctorNames = doctors.slice(0, 10).map(d => `Dr. ${d.name}`).join(', ');

    return `You are extracting data from a hospital department document (${deptCode}).

CRITICAL SAFETY RULES:
- NEVER fabricate hospital data
- Use ONLY real names visible in the document
- Use "-" for blank cells, "[illegible]" for unreadable text
- Extract ALL pages of multi-page documents

Known hospital staff: ${staffNames}
Known doctors: ${doctorNames}
Known patients: ${patientNames}

Extract and return ONLY a valid JSON object with this structure:
{
  "title": "Document title",
  "documentType": "register|form|certificate|report|letter|manual|policy|sop",
  "keyValuePairs": [{"key": "Field Name", "value": "Field Value"}],
  "sections": [{"heading": "Section Name", "content": "Section content..."}],
  "tables": [{"caption": "Table Title", "data": "Col1|Col2|Col3\\nRow1Val1|Row1Val2|Row1Val3"}]
}

Return ONLY the JSON, no markdown code blocks, no explanations.`;
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await departmentDocumentStorage.deleteDocument(deleteDialog);
      setDeleteDialog(null);
      await fetchDocuments();
      showSnackbar('Deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar('Failed to delete', 'error');
    }
    setDeleting(false);
  };

  const parseExtractedData = (text: string | null) => {
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />

        {/* Header: Back arrow + Department name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/departments')}>
            <Icon>arrow_back</Icon>
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            {department?.name || code}
          </Typography>
        </Box>

        {/* Title input - full width */}
        <TextField
          placeholder="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />

        {/* Description input - full width multiline */}
        <TextField
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          sx={{ mb: 1 }}
        />

        {/* Save button - right aligned */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={saving ? <CircularProgress size={18} /> : <Icon>save</Icon>}
            onClick={handleSaveTitle}
            disabled={!newTitle.trim() || saving}
          >
            Save
          </Button>
        </Box>

        {/* Select Title dropdown + Upload */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            select
            label="Select Title"
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="">Select Title</MenuItem>
            {titleEntries.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.file_name}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            component="label"
            disabled={!selectedParent || globalUploading}
            startIcon={globalUploading ? <CircularProgress size={18} /> : <Icon>upload</Icon>}
            sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
          >
            Upload
            <input
              type="file"
              hidden
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && selectedParent) {
                  setGlobalUploadFile(file);
                  // Auto-upload
                  setTimeout(() => {
                    setGlobalUploading(true);
                    handleGlobalUploadDirect(file);
                  }, 0);
                }
                e.target.value = '';
              }}
            />
          </Button>
        </Box>
        {globalUploading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Entries heading */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Entries ({totalEntries})
        </Typography>

        {totalEntries === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Icon sx={{ fontSize: 48, color: '#bbb' }}>description</Icon>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              No documents yet. Add a title or upload a file to get started.
            </Typography>
          </Paper>
        )}

        {/* Title entries with children */}
        {titleEntries.map(title => {
          const children = getChildren(title.id);
          const isUploading = uploadingFor === title.id;
          return (
            <Paper key={title.id} sx={{ mb: 3, overflow: 'hidden' }} variant="outlined">
              {/* Title header */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ color: '#1565C0' }}>folder</Icon>
                  <Typography variant="subtitle1" fontWeight={700}>{title.file_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(title.uploaded_at)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={isUploading ? <CircularProgress size={16} /> : <Icon>upload</Icon>}
                    disabled={isUploading}
                    component="label"
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.png,.jpg,.jpeg"
                      ref={(el) => { fileInputRefs.current[title.id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadForTitle(title.id, file);
                        e.target.value = '';
                      }}
                    />
                  </Button>
                </Box>
              </Box>

              {isUploading && <LinearProgress />}

              {/* Child documents */}
              <Box sx={{ p: 2 }}>
                {children.map(child => {
                  const childData = parseExtractedData(child.extracted_text);
                  const isChildExtracting = extracting === child.id;
                  return (
                    <Box key={child.id} sx={{ mb: 2 }}>
                      {/* File row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon sx={{ color: '#C62828', fontSize: 20 }}>picture_as_pdf</Icon>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {getCleanFileName(child.file_name)}
                        </Typography>
                        {child.file_url && child.file_url !== 'manual-entry' && (
                          <IconButton size="small" component="a" href={child.file_url} target="_blank">
                            <Icon sx={{ fontSize: 20 }}>download</Icon>
                          </IconButton>
                        )}
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog(child)}>
                          <Icon sx={{ fontSize: 20 }}>delete</Icon>
                        </IconButton>
                      </Box>

                      {isChildExtracting && <LinearProgress sx={{ mb: 1 }} />}

                      {/* Extracted data */}
                      {childData && (
                        <StructuredDataView data={childData} fileName={getCleanFileName(child.file_name)} />
                      )}
                    </Box>
                  );
                })}

                {/* Date at bottom */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatDate(title.uploaded_at)}
                </Typography>
              </Box>
            </Paper>
          );
        })}

        {/* Orphan documents */}
        {orphanDocs.map(doc => {
          const docData = parseExtractedData(doc.extracted_text);
          const isExtr = extracting === doc.id;
          return (
            <Paper key={doc.id} sx={{ mb: 3, overflow: 'hidden' }} variant="outlined">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ color: '#C62828', fontSize: 20 }}>picture_as_pdf</Icon>
                <Typography variant="body2" sx={{ flex: 1 }}>{doc.file_name}</Typography>
                {doc.file_url && (
                  <IconButton size="small" component="a" href={doc.file_url} target="_blank">
                    <Icon sx={{ fontSize: 20 }}>download</Icon>
                  </IconButton>
                )}
                <IconButton size="small" color="error" onClick={() => setDeleteDialog(doc)}>
                  <Icon sx={{ fontSize: 20 }}>delete</Icon>
                </IconButton>
              </Box>
              {isExtr && <LinearProgress />}
              {docData && (
                <Box sx={{ p: 2, pt: 0 }}>
                  <StructuredDataView data={docData} fileName={doc.file_name} />
                </Box>
              )}
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary">{formatDate(doc.uploaded_at)}</Typography>
              </Box>
            </Paper>
          );
        })}

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Delete Entry</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteDialog?.file_name}"?
            </Typography>
            {deleteDialog?.file_url === 'manual-entry' && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                This will also delete all files uploaded under this title.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <Icon>delete</Icon>}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Footer />
      </Box>
    </Box>
  );

  // Direct upload handler for global Select Title
  async function handleGlobalUploadDirect(file: File) {
    if (!code || !selectedParent) { setGlobalUploading(false); return; }
    try {
      const doc = await departmentDocumentStorage.uploadFile(code, file, selectedParent);
      showSnackbar('File uploaded, extracting text...', 'info');
      setSelectedParent('');
      await fetchDocuments();

      setExtracting(doc.id);
      await runExtraction(doc, file);
      setExtracting(null);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      showSnackbar('Failed to upload file', 'error');
    }
    setGlobalUploading(false);
  }
}
