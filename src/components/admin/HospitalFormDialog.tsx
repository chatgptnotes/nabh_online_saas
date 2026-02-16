import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import type { Hospital } from '../../types/auth';

interface HospitalFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  hospital?: Hospital | null;
}

export default function HospitalFormDialog({ open, onClose, onSave, hospital }: HospitalFormDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Nagpur');
  const [state, setState] = useState('Maharashtra');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bedCount, setBedCount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hospital) {
      setName(hospital.name);
      setSlug(hospital.slug);
      setAddress(hospital.address || '');
      setCity(hospital.city || 'Nagpur');
      setState(hospital.state || 'Maharashtra');
      setPhone(hospital.phone || '');
      setEmail(hospital.email || '');
      setWebsite(hospital.website || '');
      setBedCount(hospital.bed_count?.toString() || '');
    } else {
      setName('');
      setSlug('');
      setAddress('');
      setCity('Nagpur');
      setState('Maharashtra');
      setPhone('');
      setEmail('');
      setWebsite('');
      setBedCount('');
    }
    setError('');
  }, [hospital, open]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      setError('Name and slug are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...(hospital ? { id: hospital.id } : {}),
        name,
        slug,
        address: address || null,
        city: city || null,
        state: state || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        bed_count: bedCount ? parseInt(bedCount) : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{hospital ? 'Edit Hospital' : 'Add New Hospital'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Hospital Name"
            fullWidth
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!hospital) setSlug(generateSlug(e.target.value));
            }}
          />
          <TextField
            label="Slug (URL-friendly ID)"
            fullWidth
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            helperText="Used in URLs and as hospital_id for users"
            disabled={!!hospital}
          />
          <TextField label="Address" fullWidth value={address} onChange={(e) => setAddress(e.target.value)} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="City" fullWidth value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField label="State" fullWidth value={state} onChange={(e) => setState(e.target.value)} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
            <TextField label="Bed Count" fullWidth type="number" value={bedCount} onChange={(e) => setBedCount(e.target.value)} />
          </Box>
          <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Website" fullWidth value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : hospital ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
