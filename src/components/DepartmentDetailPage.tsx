import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
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

  // Upload state
  const [selectedParent, setSelectedParent] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState<DepartmentDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDepartment = useCallback(async () => {
    if (!code) return;
    const { data } = await supabase
      .from('departments')
      .select('name, code, category, description, head_of_department')
      .eq('code', code)
      .single();
    if (data) setDepartment(data);
  }, [code]);

  const fetchDocuments = useCallback(async () => {
    if (!code) return;
    try {
      const docs = await departmentDocumentStorage.getDocuments(code);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
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

  // Get title entries (manual entries = parent nodes)
  const titleEntries = documents.filter(d => d.file_url === 'manual-entry');

  // Get child documents for a parent
  const getChildren = (parentId: string) =>
    documents.filter(d => d.file_name.startsWith(`[parent:${parentId}]`));

  // Get orphan documents (uploaded without parent)
  const orphanDocs = documents.filter(
    d => d.file_url !== 'manual-entry' && !d.file_name.startsWith('[parent:')
  );

  const getCleanFileName = (fileName: string) => {
    const match = fileName.match(/\[parent:[^\]]+\](.*)/);
    return match ? match[1] : fileName;
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

  // Upload file
  const handleUpload = async () => {
    if (!code || !uploadFile) return;
    setUploading(true);
    try {
      const doc = await departmentDocumentStorage.uploadFile(
        code,
        uploadFile,
        selectedParent || undefined
      );

      showSnackbar('File uploaded, extracting text...', 'info');
      setUploadFile(null);
      setSelectedParent('');
      await fetchDocuments();

      // AI extraction
      setExtracting(doc.id);
      try {
        const extractionPrompt = await buildExtractionPrompt(code);
        const result = await extractFromDocument(uploadFile, 'department', extractionPrompt);
        if (result.success && result.text) {
          // Try to parse as structured JSON
          let extracted: string;
          try {
            const jsonMatch = result.text.match(/```json\n?([\s\S]*?)\n?```/) || result.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              JSON.parse(jsonMatch[1] || jsonMatch[0]);
              extracted = jsonMatch[1] || jsonMatch[0];
            } else {
              extracted = JSON.stringify({
                title: doc.file_name,
                documentType: 'document',
                sections: [{ heading: 'Extracted Content', content: result.text }],
              });
            }
          } catch {
            extracted = JSON.stringify({
              title: doc.file_name,
              documentType: 'document',
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
      setExtracting(null);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      showSnackbar('Failed to upload file', 'error');
    }
    setUploading(false);
  };

  // Build extraction prompt with real hospital data
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

  // Delete document
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
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const categoryColors: Record<string, string> = {
    'Clinical Speciality': '#1565C0',
    'Super Speciality': '#9C27B0',
    'Support Services': '#ED6C02',
    'Administration': '#2E7D32',
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

        {/* Back button + Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/departments')} sx={{ bgcolor: '#f5f5f5' }}>
            <Icon>arrow_back</Icon>
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {department?.name || code}
              </Typography>
              {department?.category && (
                <Chip
                  label={department.category}
                  size="small"
                  sx={{
                    bgcolor: categoryColors[department.category] || '#546E7A',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Code: {department?.code} {department?.head_of_department && `| HOD: ${department.head_of_department}`}
            </Typography>
          </Box>
        </Box>

        {/* Add Title Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            <Icon sx={{ verticalAlign: 'middle', mr: 0.5, color: '#1565C0' }}>add_circle</Icon>
            Add Title / Entry
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            />
            <TextField
              label="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              size="small"
              sx={{ minWidth: 300, flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Icon>save</Icon>}
              onClick={handleSaveTitle}
              disabled={!newTitle.trim() || saving}
            >
              Save
            </Button>
          </Box>
        </Paper>

        {/* Upload Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            <Icon sx={{ verticalAlign: 'middle', mr: 0.5, color: '#2E7D32' }}>cloud_upload</Icon>
            Upload Document
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label="Select Parent Title"
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">No Parent (standalone)</MenuItem>
              {titleEntries.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.file_name}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Icon>attach_file</Icon>}
            >
              {uploadFile ? uploadFile.name : 'Choose File'}
              <input
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <Icon>upload</Icon>}
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
            >
              Upload
            </Button>
          </Box>
          {uploading && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary">Uploading and extracting text...</Typography>
            </Box>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Documents List */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          <Icon sx={{ verticalAlign: 'middle', mr: 0.5, color: '#1565C0' }}>folder_open</Icon>
          Documents ({documents.length})
        </Typography>

        {documents.length === 0 && (
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
          const titleData = parseExtractedData(title.extracted_text);
          return (
            <Paper key={title.id} sx={{ mb: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ color: '#1565C0' }}>folder</Icon>
                  <Typography variant="subtitle1" fontWeight={600}>{title.file_name}</Typography>
                  <Chip label="Title" size="small" variant="outlined" color="primary" />
                  <Chip label={`${children.length} files`} size="small" />
                </Box>
                <IconButton size="small" color="error" onClick={() => setDeleteDialog(title)}>
                  <Icon>delete</Icon>
                </IconButton>
              </Box>

              {/* Title description */}
              {titleData?.description && (
                <Box sx={{ px: 2, py: 1, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" color="text.secondary">{titleData.description}</Typography>
                </Box>
              )}

              {/* Child documents */}
              <Box sx={{ p: 2 }}>
                {children.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No files uploaded under this title yet.
                  </Typography>
                )}
                {children.map(child => {
                  const childData = parseExtractedData(child.extracted_text);
                  const isExtracting = extracting === child.id;
                  return (
                    <Box key={child.id} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                        <Icon sx={{ color: child.file_type?.includes('pdf') ? '#C62828' : '#2E7D32', fontSize: 20 }}>
                          {child.file_type?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                        </Icon>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {getCleanFileName(child.file_name)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(child.file_size / 1024).toFixed(1)} KB
                        </Typography>
                        {child.file_url && child.file_url !== 'manual-entry' && (
                          <IconButton size="small" href={child.file_url} target="_blank">
                            <Icon sx={{ fontSize: 18 }}>open_in_new</Icon>
                          </IconButton>
                        )}
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog(child)}>
                          <Icon sx={{ fontSize: 18 }}>delete</Icon>
                        </IconButton>
                      </Box>
                      {isExtracting && <LinearProgress sx={{ mt: 0.5 }} />}
                      {childData && <StructuredDataView data={childData} fileName={getCleanFileName(child.file_name)} />}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}

        {/* Orphan documents */}
        {orphanDocs.length > 0 && (
          <Paper sx={{ mb: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#fff3e0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon sx={{ color: '#ED6C02' }}>insert_drive_file</Icon>
              <Typography variant="subtitle1" fontWeight={600}>Standalone Documents</Typography>
              <Chip label={`${orphanDocs.length} files`} size="small" />
            </Box>
            <Box sx={{ p: 2 }}>
              {orphanDocs.map(doc => {
                const docData = parseExtractedData(doc.extracted_text);
                const isExtracting = extracting === doc.id;
                return (
                  <Box key={doc.id} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Icon sx={{ color: doc.file_type?.includes('pdf') ? '#C62828' : '#2E7D32', fontSize: 20 }}>
                        {doc.file_type?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                      </Icon>
                      <Typography variant="body2" sx={{ flex: 1 }}>{doc.file_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </Typography>
                      {doc.file_url && (
                        <IconButton size="small" href={doc.file_url} target="_blank">
                          <Icon sx={{ fontSize: 18 }}>open_in_new</Icon>
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(doc)}>
                        <Icon sx={{ fontSize: 18 }}>delete</Icon>
                      </IconButton>
                    </Box>
                    {isExtracting && <LinearProgress sx={{ mt: 0.5 }} />}
                    {docData && <StructuredDataView data={docData} fileName={doc.file_name} />}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Delete Entry</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteDialog?.file_name}"?
              {deleteDialog?.file_url === 'manual-entry' && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  This will also delete all files uploaded under this title.
                </Typography>
              )}
            </Typography>
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
}
