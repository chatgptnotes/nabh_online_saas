import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';

const features = [
  { icon: '📋', title: 'NC Tracker', desc: 'Track non-conformities from identification to closure. Never miss a deadline with automated alerts and escalation workflows.' },
  { icon: '📄', title: 'Evidence Generator', desc: 'AI-powered evidence document generation aligned to NABH standards. Create audit-ready documents in minutes, not days.' },
  { icon: '🎓', title: 'Staff Training', desc: 'Manage training records, schedule sessions, track completion. Ensure every staff member meets NABH competency requirements.' },
  { icon: '✅', title: 'Audit Preparation', desc: 'Mock audit checklists, readiness scores, and gap analysis. Walk into your NABH assessment with complete confidence.' },
  { icon: '📚', title: 'Chapter Management', desc: 'All 10 NABH chapters, 71 standards, 408 objective elements organized and trackable. See your progress at a glance.' },
  { icon: '📊', title: 'Dashboard Analytics', desc: 'Real-time compliance dashboards, chapter-wise progress, trend analysis. Make data-driven decisions for accreditation.' },
  { icon: '🏥', title: 'Multi-Hospital', desc: 'Manage accreditation across multiple facilities from one dashboard. Perfect for hospital chains and healthcare groups.' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Assign elements to departments, track ownership, enable cross-functional collaboration. Everyone knows their responsibility.' },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: '2,999',
    period: '/month',
    desc: 'Perfect for small hospitals starting their NABH journey',
    features: ['1 Hospital', '5 Users', 'NC Tracker', 'Evidence Templates', 'Basic Dashboard', 'Email Support', 'Chapter-wise Tracking'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: '7,999',
    period: '/month',
    desc: 'For hospitals serious about NABH accreditation',
    features: ['3 Hospitals', '20 Users', 'AI Evidence Generation', 'Priority Support', 'Advanced Analytics', 'Staff Training Module', 'Audit Preparation Kit', 'Custom Reports'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '14,999',
    period: '/month',
    desc: 'For hospital chains and healthcare groups',
    features: ['Unlimited Hospitals', 'Unlimited Users', 'Dedicated NABH Consultant', 'Custom Reports & Branding', 'API Access', 'On-call Support', 'On-site Training', 'SLA Guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const testimonials = [
  {
    name: 'Dr. Rajesh Sharma',
    role: 'Medical Superintendent',
    hospital: 'Shanti General Hospital, Jaipur',
    quote: 'We were struggling with manual tracking across 408 elements. nabh.online brought everything into one place. We cleared our NABH assessment on the first attempt.',
  },
  {
    name: 'Mrs. Priya Nair',
    role: 'Quality Manager',
    hospital: 'Grace Multispeciality Hospital, Kochi',
    quote: 'The AI evidence generator alone saved us 200+ hours of documentation work. Our quality team can now focus on actual improvement instead of paperwork.',
  },
  {
    name: 'Dr. Amit Patel',
    role: 'Hospital Director',
    hospital: 'Lifeline Hospital Network, Ahmedabad',
    quote: 'Managing NABH compliance across 4 hospitals was a nightmare. With the multi-hospital dashboard, I can see every facility\'s progress in real-time.',
  },
];

const faqs = [
  { q: 'What is NABH accreditation?', a: 'NABH (National Accreditation Board for Hospitals & Healthcare Providers) is a quality certification body under QCI. NABH accreditation is a mark of quality that demonstrates a hospital meets national standards for patient safety and care quality.' },
  { q: 'How does nabh.online help with NABH accreditation?', a: 'nabh.online provides a complete digital platform to track all 408 NABH objective elements, generate evidence documents, manage non-conformities, track staff training, and prepare for audits — all from one dashboard.' },
  { q: 'Is there a free trial available?', a: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can explore the platform and see how it fits your hospital\'s needs before committing.' },
  { q: 'Can I manage multiple hospitals?', a: 'Yes. Our Pro plan supports up to 3 hospitals, and the Enterprise plan supports unlimited hospitals. Perfect for hospital chains and healthcare groups.' },
  { q: 'How is the AI evidence generator different from templates?', a: 'Our AI evidence generator creates customized, hospital-specific evidence documents based on your hospital\'s data, policies, and procedures. Unlike generic templates, each document is tailored to your facility.' },
  { q: 'What NABH standards does the platform cover?', a: 'We cover the complete NABH SHCO (Small Healthcare Organizations) 3rd Edition standards — all 10 chapters, 71 standards, and 408 objective elements. We also support Entry Level and Full Accreditation tracks.' },
  { q: 'Is my hospital data secure?', a: 'Absolutely. We use enterprise-grade encryption, secure cloud infrastructure, and follow healthcare data protection best practices. Your data is stored in India-based servers compliant with data localization requirements.' },
  { q: 'What kind of support do you provide?', a: 'Basic plan includes email support. Pro plan includes priority support with faster response times. Enterprise plan includes a dedicated NABH consultant, on-call support, and on-site training options.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCTA = () => navigate('/signup');

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Navbar */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #eee' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1565C0, #0D47A1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            nabh.online
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none', fontWeight: 600 }}>Login</Button>
            <Button variant="contained" onClick={handleCTA} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}>
              Start Free Trial
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{
        pt: { xs: 14, md: 18 }, pb: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #E8F5E9 70%, #C8E6C9 100%)',
        position: 'relative',
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 50%, rgba(21,101,192,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(46,125,50,0.08) 0%, transparent 50%)' }
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Chip label="🏥 Trusted by Hospitals Across India" sx={{ mb: 3, fontWeight: 600, bgcolor: 'rgba(21,101,192,0.1)', color: '#1565C0', fontSize: '0.85rem' }} />
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2rem', md: '3.2rem' }, lineHeight: 1.2, color: '#0D47A1' }}>
            NABH Accreditation<br />Made Simple
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#555', fontWeight: 400, maxWidth: 600, mx: 'auto', fontSize: { xs: '1rem', md: '1.2rem' } }}>
            Manual tracking? Missing evidence? Failed audits?<br />
            Stop struggling with spreadsheets. Start your accreditation journey with confidence.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button variant="contained" size="large" onClick={handleCTA} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '1.1rem', px: 5, py: 1.5, borderRadius: 3, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1', transform: 'translateY(-2px)' }, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(21,101,192,0.4)' }}>
              Start Free 14-Day Trial →
            </Button>
            <Button variant="outlined" size="large" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '1rem', px: 4, py: 1.5, borderRadius: 3, borderColor: '#1565C0', color: '#1565C0' }}>
              See Features
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ py: 6, bgcolor: '#0D47A1' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              { num: '4,000+', label: 'Hospitals Need NABH' },
              { num: '408', label: 'Elements Tracked' },
              { num: '90%', label: 'Pass Rate With Us' },
              { num: '10,000+', label: 'Documents Generated' },
            ].map((s) => (
              <Grid size={{ xs: 6, md: 3 }} key={s.label} sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', fontSize: { xs: '1.8rem', md: '2.5rem' } }}>{s.num}</Typography>
                <Typography sx={{ color: alpha('#fff', 0.8), fontWeight: 500, mt: 0.5 }}>{s.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pain Points */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
            Sound Familiar?
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', mb: 6, fontSize: '1.1rem' }}>
            Most hospitals face these challenges during NABH accreditation
          </Typography>
          <Grid container spacing={3}>
            {[
              { emoji: '😰', title: 'Drowning in Paperwork', desc: 'Hundreds of evidence documents across 408 elements. Excel sheets everywhere. No single source of truth.' },
              { emoji: '❌', title: 'Failed Audits', desc: 'Missing evidence, incomplete NCs, untrained staff. Failed assessments mean wasted time and money.' },
              { emoji: '🔄', title: 'No Tracking System', desc: 'Who is responsible for what? Which elements are complete? Without a system, things fall through the cracks.' },
            ].map((p) => (
              <Grid size={{ xs: 12, md: 4 }} key={p.title}>
                <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #eee', boxShadow: 'none', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }, transition: 'all 0.3s' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>{p.emoji}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{p.title}</Typography>
                    <Typography sx={{ color: '#666' }}>{p.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
            Everything You Need for NABH Accreditation
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', mb: 6, fontSize: '1.1rem' }}>
            One platform to manage your entire accreditation lifecycle
          </Typography>
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.title}>
                <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #eee', boxShadow: 'none', '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transform: 'translateY(-4px)' }, transition: 'all 0.3s', cursor: 'default' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '2rem', mb: 1.5 }}>{f.icon}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it Works */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F5F9FF' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
            Get Started in 3 Simple Steps
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', mb: 6, fontSize: '1.1rem' }}>
            From signup to accreditation tracking in under 10 minutes
          </Typography>
          <Stack spacing={4}>
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your account in 30 seconds. No credit card required. Start your 14-day free trial instantly.' },
              { step: '2', title: 'Configure Your Hospital', desc: 'Add your hospital details, departments, and team members. Import existing data or start fresh.' },
              { step: '3', title: 'Start Tracking', desc: 'Begin tracking all 408 NABH elements, generate evidence, manage NCs, and prepare for your assessment.' },
            ].map((s) => (
              <Stack key={s.step} direction="row" spacing={3} alignItems="flex-start">
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#1565C0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0 }}>
                  {s.step}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{s.title}</Typography>
                  <Typography sx={{ color: '#666' }}>{s.desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Pricing */}
      <Box id="pricing" sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', mb: 6, fontSize: '1.1rem' }}>
            Start free. Upgrade when you're ready. No hidden fees.
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {pricingPlans.map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan.name}>
                <Card sx={{
                  height: '100%', borderRadius: 3, position: 'relative', overflow: 'visible',
                  border: plan.popular ? '2px solid #1565C0' : '1px solid #eee',
                  boxShadow: plan.popular ? '0 8px 40px rgba(21,101,192,0.15)' : 'none',
                  transform: plan.popular ? 'scale(1.05)' : 'none',
                }}>
                  {plan.popular && (
                    <Chip label="Most Popular" sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', bgcolor: '#1565C0', color: '#fff', fontWeight: 700 }} />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{plan.name}</Typography>
                    <Typography sx={{ color: '#666', fontSize: '0.85rem', mb: 2, minHeight: 40 }}>{plan.desc}</Typography>
                    <Stack direction="row" alignItems="baseline" sx={{ mb: 3 }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#1565C0' }}>₹{plan.price}</Typography>
                      <Typography sx={{ color: '#999', ml: 0.5 }}>{plan.period}</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      {plan.features.map((f) => (
                        <Stack key={f} direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ color: '#4CAF50', fontSize: '1rem' }}>✓</Typography>
                          <Typography variant="body2" sx={{ color: '#444' }}>{f}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={handleCTA}
                      sx={{
                        textTransform: 'none', fontWeight: 700, py: 1.5, borderRadius: 2,
                        bgcolor: plan.popular ? '#1565C0' : undefined,
                        borderColor: '#1565C0', color: plan.popular ? '#fff' : '#1565C0',
                        '&:hover': { bgcolor: plan.popular ? '#0D47A1' : alpha('#1565C0', 0.08) },
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography sx={{ textAlign: 'center', color: '#999', mt: 4, fontSize: '0.85rem' }}>
            All plans include 14-day free trial · No credit card required · Cancel anytime
          </Typography>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 6, color: '#1a1a1a' }}>
            Trusted by Hospital Leaders
          </Typography>
          <Grid container spacing={3}>
            {testimonials.map((t) => (
              <Grid size={{ xs: 12, md: 4 }} key={t.name}>
                <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #eee', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography sx={{ color: '#1565C0', fontSize: '2rem', mb: 2 }}>★★★★★</Typography>
                    <Typography sx={{ color: '#444', lineHeight: 1.7, mb: 3, fontStyle: 'italic' }}>"{t.quote}"</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#1a1a1a' }}>{t.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>{t.role}</Typography>
                    <Typography variant="body2" sx={{ color: '#999' }}>{t.hospital}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 800, mb: 6, color: '#1a1a1a' }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq) => (
            <Accordion key={faq.q} sx={{ borderRadius: '12px !important', border: '1px solid #eee', boxShadow: 'none', mb: 1.5, '&:before': { display: 'none' }, '&.Mui-expanded': { mb: 1.5 } }}>
              <AccordionSummary expandIcon={<Typography sx={{ fontSize: '1.2rem' }}>▼</Typography>} sx={{ fontWeight: 600 }}>
                <Typography sx={{ fontWeight: 600 }}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#666', lineHeight: 1.7 }}>{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* Final CTA */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(135deg, #0D47A1, #1565C0, #1976D2)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Ready to Simplify Your NABH Journey?
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.85), mb: 4, fontSize: '1.1rem' }}>
            Join hundreds of hospitals using nabh.online to achieve NABH accreditation faster and with less effort.
          </Typography>
          <Button variant="contained" size="large" onClick={handleCTA} sx={{
            textTransform: 'none', fontWeight: 700, fontSize: '1.1rem', px: 6, py: 2, borderRadius: 3,
            bgcolor: '#fff', color: '#1565C0',
            '&:hover': { bgcolor: '#F5F5F5', transform: 'translateY(-2px)' },
            transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            Start Free 14-Day Trial →
          </Button>
          <Typography sx={{ color: alpha('#fff', 0.6), mt: 2, fontSize: '0.85rem' }}>
            No credit card required · Setup in 5 minutes
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 6, bgcolor: '#0a0a0a', color: '#999' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>nabh.online</Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                India's leading NABH accreditation management software. Helping hospitals achieve quality certification with confidence.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Product</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }} onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }} onClick={() => navigate('/login')}>Login</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }} onClick={handleCTA}>Sign Up</Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Contact</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">📧 support@nabh.online</Typography>
                <Typography variant="body2">📞 +91 98765 43210</Typography>
                <Typography variant="body2">📍 India</Typography>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: '#222' }} />
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            © {new Date().getFullYear()} nabh.online. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
