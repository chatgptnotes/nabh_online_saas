import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { Hospital } from '../../types/auth';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  hospital_id: string;
  is_active: boolean;
}

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { id: string; role?: string; hospital_id?: string; is_active?: boolean }) => Promise<void>;
  user: UserData | null;
  hospitals: Hospital[];
  currentUserId: string;
}

const ROLES = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Hospital Admin' },
  { value: 'quality_coordinator', label: 'Quality Coordinator' },
  { value: 'staff', label: 'Staff' },
];

export default function UserEditDialog({ open, onClose, onSave, user, hospitals, currentUserId }: UserEditDialogProps) {
  const [role, setRole] = useState('staff');
  const [hospitalId, setHospitalId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isSelf = user?.id === currentUserId;

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setHospitalId(user.hospital_id);
      setIsActive(user.is_active);
    }
    setError('');
  }, [user, open]);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave({
        id: user!.id,
        role,
        hospital_id: hospitalId,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User: {user.name}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {isSelf && <Alert severity="info" sx={{ mb: 2 }}>You cannot change your own role</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" fullWidth value={user.name} disabled />
          <TextField label="Email" fullWidth value={user.email} disabled />
          <TextField
            label="Role"
            select
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isSelf}
          >
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Hospital"
            select
            fullWidth
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            {hospitals.map((h) => (
              <MenuItem key={h.slug} value={h.slug}>{h.name}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isSelf} />}
            label={isActive ? 'Active' : 'Deactivated'}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
