import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../providers/AuthProvider';
import type { Hospital } from '../../types/auth';
import HospitalFormDialog from './HospitalFormDialog';
import UserEditDialog from './UserEditDialog';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  hospital_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export default function SuperAdminPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState(0);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hospital dialog
  const [hospitalDialogOpen, setHospitalDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  // User dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Check superadmin access
  if (user?.role !== 'superadmin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
          Access Denied. Super Admin role required.
        </Alert>
      </Box>
    );
  }

  const loadHospitals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hospitals', { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setHospitals(data.hospitals || []);
      else setError(data.error);
    } catch { setError('Failed to load hospitals'); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else setError(data.error);
    } catch { setError('Failed to load users'); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    Promise.all([loadHospitals(), loadUsers()]).finally(() => setLoading(false));
  }, [loadHospitals, loadUsers]);

  const handleSaveHospital = async (data: any) => {
    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/hospitals', {
      method,
      headers: authHeaders,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    await loadHospitals();
  };

  const handleDeleteHospital = async (id: string) => {
    if (!confirm('Deactivate this hospital?')) return;
    const res = await fetch('/api/admin/hospitals', {
      method: 'DELETE',
      headers: authHeaders,
      body: JSON.stringify({ id }),
    });
    if (res.ok) await loadHospitals();
  };

  const handleSaveUser = async (data: { id: string; role?: string; hospital_id?: string; is_active?: boolean }) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    await loadUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'admin': return 'primary';
      case 'quality_coordinator': return 'success';
      default: return 'default';
    }
  };

  const getHospitalName = (slug: string) => {
    const h = hospitals.find((h) => h.slug === slug);
    return h?.name || slug;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Icon sx={{ fontSize: 32, color: 'error.main', mr: 1.5 }}>admin_panel_settings</Icon>
        <Typography variant="h4" fontWeight={700}>Super Admin</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700} color="primary.main">{hospitals.filter(h => h.is_active).length}</Typography>
          <Typography variant="body2" color="text.secondary">Active Hospitals</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700} color="success.main">{users.filter(u => u.is_active).length}</Typography>
          <Typography variant="body2" color="text.secondary">Active Users</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700} color="secondary.main">{users.length}</Typography>
          <Typography variant="body2" color="text.secondary">Total Users</Typography>
        </Paper>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Hospitals (${hospitals.length})`} icon={<Icon>local_hospital</Icon>} iconPosition="start" />
          <Tab label={`Users (${users.length})`} icon={<Icon>people</Icon>} iconPosition="start" />
        </Tabs>

        {/* Hospitals Tab */}
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Icon>add</Icon>}
                onClick={() => { setEditingHospital(null); setHospitalDialogOpen(true); }}
              >
                Add Hospital
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Beds</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hospitals.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell><Typography fontWeight={600}>{h.name}</Typography></TableCell>
                      <TableCell><Chip label={h.slug} size="small" variant="outlined" /></TableCell>
                      <TableCell>{h.city || '-'}</TableCell>
                      <TableCell>{h.phone || '-'}</TableCell>
                      <TableCell>{h.bed_count || '-'}</TableCell>
                      <TableCell>
                        <Chip label={h.is_active ? 'Active' : 'Inactive'} color={h.is_active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{users.filter(u => u.hospital_id === h.slug).length}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setEditingHospital(h); setHospitalDialogOpen(true); }}>
                          <Icon fontSize="small">edit</Icon>
                        </IconButton>
                        {h.is_active && (
                          <IconButton size="small" color="error" onClick={() => handleDeleteHospital(h.id)}>
                            <Icon fontSize="small">block</Icon>
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {hospitals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No hospitals found. Add your first hospital.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Users Tab */}
        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} sx={{ opacity: u.is_active ? 1 : 0.5 }}>
                      <TableCell><Typography fontWeight={600}>{u.name}</Typography></TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip label={u.role} color={getRoleColor(u.role) as any} size="small" />
                      </TableCell>
                      <TableCell>{getHospitalName(u.hospital_id)}</TableCell>
                      <TableCell>
                        <Chip label={u.is_active ? 'Active' : 'Inactive'} color={u.is_active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-IN') : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setEditingUser(u); setUserDialogOpen(true); }}>
                          <Icon fontSize="small">edit</Icon>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No users found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <HospitalFormDialog
        open={hospitalDialogOpen}
        onClose={() => setHospitalDialogOpen(false)}
        onSave={handleSaveHospital}
        hospital={editingHospital}
      />
      <UserEditDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        hospitals={hospitals}
        currentUserId={user?.id || ''}
      />
    </Box>
  );
}
