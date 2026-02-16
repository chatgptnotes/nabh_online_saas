import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import { useNABHStore } from '../store/nabhStore';
import { getHospitalInfo, fetchHospitalsFromDB, type HospitalInfo } from '../config/hospitalConfig';
import { useAuth } from '../providers/AuthProvider';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedChapter, selectedHospital, setSelectedHospital } = useNABHStore();
  const { user, logout } = useAuth();
  const isGeneratorPage = location.pathname === '/ai-generator';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [hospitalsList, setHospitalsList] = useState<HospitalInfo[]>([]);

  useEffect(() => {
    fetchHospitalsFromDB().then((hospitalsMap) => {
      setHospitalsList(Object.values(hospitalsMap));
    });
  }, []);

  const handleHomeClick = () => {
    setSelectedChapter(null);
    navigate('/');
  };

  const handleGeneratorClick = () => {
    navigate('/ai-generator');
  };

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleHospitalMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleHospitalMenuClose = () => {
    setAnchorEl(null);
  };

  const handleHospitalSelect = (hospitalId: string) => {
    setSelectedHospital(hospitalId);
    handleHospitalMenuClose();
  };

  const currentHospital = getHospitalInfo(selectedHospital);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { sm: 'none' } }}
        >
          <Icon>menu</Icon>
        </IconButton>
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
          onClick={handleHomeClick}
        >
          <Icon sx={{ mr: 1 }}>local_hospital</Icon>
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            NABH Evidences
          </Typography>
        </Box>
        
        {/* Hospital Name (locked) or Switcher (superadmin only) */}
        <Box sx={{ ml: { xs: 1, sm: 4 }, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {user?.role === 'superadmin' ? (
            <>
              <Button
                color="inherit"
                onClick={handleHospitalMenuOpen}
                endIcon={<Icon>arrow_drop_down</Icon>}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  fontWeight: 500,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  px: { xs: 1, sm: 2 },
                  whiteSpace: 'nowrap',
                }}
              >
                {currentHospital.name}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleHospitalMenuClose}
                PaperProps={{
                  elevation: 4,
                  sx: { mt: 1.5, minWidth: 200 }
                }}
              >
                {hospitalsList.map((hospital) => (
                  <MenuItem
                    key={hospital.id}
                    selected={selectedHospital === hospital.id}
                    onClick={() => handleHospitalSelect(hospital.id)}
                  >
                    <Icon sx={{ mr: 1, fontSize: 20, color: selectedHospital === hospital.id ? 'primary.main' : 'text.secondary' }}>
                      {selectedHospital === hospital.id ? 'check_circle' : 'radio_button_unchecked'}
                    </Icon>
                    {hospital.name}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                bgcolor: 'rgba(255,255,255,0.1)',
                px: { xs: 1, sm: 2 },
                py: 0.5,
                borderRadius: 1,
                fontSize: { xs: '0.8rem', sm: '1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              {currentHospital.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Mobile Search Icon */}
        <Tooltip title="Global Search">
          <IconButton
            color="inherit"
            onClick={handleSearchClick}
            sx={{
              display: { xs: 'flex', md: 'none' },
              bgcolor: location.pathname === '/search' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
            }}
          >
            <Icon>search</Icon>
          </IconButton>
        </Tooltip>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {/* Prominent Search Button */}
          <Tooltip title="Global Search - Find anything across the NABH system">
            <Button
              color="inherit"
              startIcon={<Icon sx={{ fontSize: 24 }}>search</Icon>}
              onClick={handleSearchClick}
              variant="outlined"
              sx={{
                bgcolor: location.pathname === '/search' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
                boxShadow: location.pathname === '/search' ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
              }}
            >
              SEARCH
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 1 }} />
          <Tooltip title="Dashboard">
            <Button
              color="inherit"
              startIcon={<Icon>dashboard</Icon>}
              onClick={handleHomeClick}
              sx={{
                bgcolor: !isGeneratorPage && location.pathname !== '/search' ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              Dashboard
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 1 }} />
          <Tooltip title="Quality Documentation Assistant">
            <Button
              color="inherit"
              startIcon={<Icon>auto_awesome</Icon>}
              onClick={handleGeneratorClick}
              sx={{
                bgcolor: isGeneratorPage ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              Documents
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 1 }} />
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            SHCO 3rd Edition
          </Typography>
        </Box>

        {/* Super Admin Button */}
        {user?.role === 'superadmin' && (
          <>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 1, display: { xs: 'none', md: 'block' } }} />
            <Tooltip title="Super Admin Panel">
              <Button
                color="inherit"
                startIcon={<Icon>admin_panel_settings</Icon>}
                onClick={() => navigate('/super-admin')}
                sx={{
                  bgcolor: location.pathname === '/super-admin' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                Admin
              </Button>
            </Tooltip>
          </>
        )}

        {/* User Menu */}
        {user && (
          <>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 1, display: { xs: 'none', md: 'block' } }} />
            <Tooltip title={`${user.name} (${user.role})`}>
              <IconButton color="inherit" onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{ elevation: 4, sx: { mt: 1.5, minWidth: 200 } }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2">{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  logout();
                  navigate('/login');
                }}
              >
                <Icon sx={{ mr: 1, fontSize: 20 }}>logout</Icon>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
