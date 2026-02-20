/**
 * Hospital Configuration and Team Structure
 * Supports Multi-Hospital Architecture with dynamic DB loading
 */

import { supabase } from '../lib/supabase';
import type { Hospital } from '../types/auth';

export interface TeamMember {
  name: string;
  role: string;
  designation: string;
  department: string;
  responsibilities: string[];
}

export interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
}

// Fallback Hospital Configurations (used if DB is unavailable)
export const HOSPITALS: Record<string, HospitalInfo> = {
  hope: {
    id: 'hope',
    name: "Hope Hospital",
    address: '2, Teka Naka, Nagpur',
    phone: '+91 9823555053',
    email: 'info@hopehospital.com',
    website: 'www.hopehospital.com',
    logo: '/assets/hope-hospital-logo.png',
  },
  ayushman: {
    id: 'ayushman',
    name: "Ayushman Hospital",
    address: 'Lokmat Square, Ramdaspeth, Nagpur, Maharashtra 440010',
    phone: '+91-70309-74619',
    email: 'ayushmanhos@gmail.com',
    website: 'www.ayushmannagpurhospital.com',
    logo: '/ayushman-logo.png',
  }
};

// Cache for DB-loaded hospitals
let _hospitalsCache: Record<string, HospitalInfo> | null = null;

// Fetch hospitals from database and cache them
export const fetchHospitalsFromDB = async (): Promise<Record<string, HospitalInfo>> => {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      console.log('Using fallback hospital config');
      return HOSPITALS;
    }

    const hospitalsMap: Record<string, HospitalInfo> = {};
    data.forEach((h: Hospital) => {
      hospitalsMap[h.slug] = {
        id: h.slug,
        name: h.name,
        address: h.address || '',
        phone: h.phone || '',
        email: h.email || '',
        website: h.website || '',
        logo: h.logo_url || HOSPITALS[h.slug]?.logo || '/hospital-logo.png',
      };
    });

    _hospitalsCache = hospitalsMap;
    return hospitalsMap;
  } catch {
    console.log('Using fallback hospital config');
    return HOSPITALS;
  }
};

// Get all hospitals (from cache, DB, or fallback)
export const getHospitalsMap = (): Record<string, HospitalInfo> => {
  return _hospitalsCache || HOSPITALS;
};

// Default Hospital
export const DEFAULT_HOSPITAL_ID = 'hope';

// Helper to get currently selected hospital (defaults to Hope)
export const getHospitalInfo = (hospitalId: string = DEFAULT_HOSPITAL_ID): HospitalInfo => {
  const hospitals = getHospitalsMap();
  return hospitals[hospitalId] || hospitals[DEFAULT_HOSPITAL_ID] || Object.values(hospitals)[0];
};

// Re-export HOSPITAL_INFO for backward compatibility (points to Hope by default)
export const HOSPITAL_INFO = HOSPITALS[DEFAULT_HOSPITAL_ID];

// NABH Team Structure (Shared across hospitals for now, can be split if needed)
export const NABH_TEAM: TeamMember[] = [
  {
    name: 'Dr. Shiraz Sheikh',
    role: 'Quality Coordinator',
    designation: 'Quality Coordinator / Administrator',
    department: 'Quality & Administration',
    responsibilities: [
      'Coordinate the planning, implementation, and monitoring of NABH accreditation',
      'Conduct gap analysis and formulate action plans',
      'Arrange training programs on NABH standards for all staff',
      'Maintain updated documentation and evidence for compliance',
      'Liaise with external assessors and accreditation bodies',
      'Conduct internal audits and help implement corrective actions',
    ],
  },
  {
    name: 'Suraj',
    role: 'Documentation Officer',
    designation: 'NABH Documentation Officer',
    department: 'Quality Documentation',
    responsibilities: [
      'Maintain and update NABH documentation system',
      'Ensure proper version control of policies and SOPs',
      'Coordinate document review and approval processes',
      'Archive and organize quality records and evidences',
      'Support departments in documentation compliance',
      'Prepare documentation for NABH assessments',
    ],
  },
  {
    name: 'Gaurav',
    role: 'Administrator',
    designation: 'Hospital Administrator',
    department: 'Administration',
    responsibilities: [
      'Overall hospital administration',
      'Support NABH accreditation efforts',
      'Resource allocation and management',
      'Coordination with all departments',
    ],
  },
  {
    name: 'Kashish',
    role: 'NABH Champion / MRD',
    designation: 'NABH Champion - Medical Records Department',
    department: 'Medical Records',
    responsibilities: [
      'Implement NABH protocols within MRD department',
      'Conduct departmental training and orientation sessions',
      'Monitor and maintain department-specific quality indicators',
      'Ensure proper documentation and record-keeping',
      'Identify areas of non-conformance and facilitate improvements',
    ],
  },
  {
    name: 'Jagruti',
    role: 'Quality Manager / HR',
    designation: 'Quality Manager & HR Head',
    department: 'Quality & Human Resources',
    responsibilities: [
      'Develop and implement the hospital Quality Management System (QMS)',
      'Oversee clinical and non-clinical audits',
      'Manage hospital-wide performance indicators and dashboards',
      'Facilitate root cause analysis and quality improvement projects',
      'Support incident reporting and management systems',
      'Prepare periodic quality reports for management review',
      'HR management and staff development',
    ],
  },
  {
    name: 'Chandra',
    role: 'Department Staff',
    designation: 'Staff Member',
    department: 'Operations',
    responsibilities: [],
  },
  {
    name: 'Diksha',
    role: 'Patient Safety Officer',
    designation: 'Patient Safety Officer',
    department: 'Quality & Patient Safety',
    responsibilities: [
      'Implement patient safety protocols and initiatives',
      'Monitor and report patient safety indicators',
      'Conduct patient safety rounds and audits',
      'Investigate adverse events and near misses',
      'Coordinate patient safety training programs',
      'Maintain patient safety documentation',
    ],
  },
  {
    name: 'Javed',
    role: 'Department Staff',
    designation: 'Staff Member',
    department: 'Operations',
    responsibilities: [],
  },
  {
    name: 'Neesha',
    role: 'Patient Experience Coordinator',
    designation: 'Patient Experience Coordinator',
    department: 'Quality & Patient Services',
    responsibilities: [
      'Manage patient feedback and grievance redressal system',
      'Conduct patient satisfaction surveys and analysis',
      'Coordinate patient rights and education initiatives',
      'Monitor and improve patient experience indicators',
      'Facilitate communication between patients and departments',
      'Report patient experience metrics to quality committee',
    ],
  },
  {
    name: 'Chandraprakash Bisen',
    role: 'Infection Control Nurse',
    designation: 'Infection Control Nurse',
    department: 'Infection Control',
    responsibilities: [
      'Implement infection control protocols',
      'Monitor hospital-acquired infections',
      'Conduct infection control training',
      'Surveillance and reporting of infections',
      'Hand hygiene compliance monitoring',
    ],
  },
  {
    name: 'Farsana',
    role: 'Head Nurse',
    designation: 'Head Nurse / Nursing In-charge',
    department: 'Nursing',
    responsibilities: [
      'Oversee nursing staff and patient care',
      'Ensure nursing protocols compliance',
      'Staff scheduling and management',
      'Quality of nursing care monitoring',
    ],
  },
  {
    name: 'Roma',
    role: 'Department Staff',
    designation: 'Staff Member',
    department: 'Operations',
    responsibilities: [],
  },
  {
    name: 'Sachin',
    role: 'Department Staff',
    designation: 'Staff Member',
    department: 'Operations',
    responsibilities: [],
  },
  {
    name: 'Sikaander',
    role: 'Department Staff',
    designation: 'Staff Member',
    department: 'Operations',
    responsibilities: [],
  },
  {
    name: 'Sonali',
    role: 'Clinical Audit Coordinator',
    designation: 'Clinical Audit Coordinator',
    department: 'Quality Assurance',
    responsibilities: [
      'Plan and conduct clinical audits across departments',
      'Analyze audit findings and prepare reports',
      'Track implementation of audit recommendations',
      'Coordinate with department heads on quality improvements',
      'Maintain clinical audit documentation and records',
      'Support accreditation assessment preparations',
    ],
  },
];

// Get team member by name
export const getTeamMember = (name: string): TeamMember | undefined => {
  return NABH_TEAM.find(member => member.name.toLowerCase() === name.toLowerCase());
};

// Get Quality Coordinator
export const getNABHCoordinator = (): TeamMember => {
  return NABH_TEAM.find(member => member.role === 'Quality Coordinator')!;
};

// Get Quality Manager
export const getQualityManager = (): TeamMember | undefined => {
  return NABH_TEAM.find(member => member.role.includes('Quality Manager'));
};

// Assignee options for dropdowns
export const ASSIGNEE_OPTIONS = NABH_TEAM.map(member => ({
  value: member.name,
  label: `${member.name} - ${member.role}`,
  role: member.role,
  department: member.department,
}));

// Role summary for AI prompts (dynamic version)
export const getTeamSummary = (hospitalName: string = 'Hope Hospital') => `
NABH Accreditation Team - ${hospitalName}:

1. Quality Coordinator: Dr. Shiraz Sheikh
   - Central figure responsible for driving NABH accreditation
   - Coordinates with all departments for compliance
   - Conducts gap analysis, training, and internal audits
   - Maintains documentation and liaises with assessors

2. Documentation Officer: Suraj
   - Maintains NABH documentation system
   - Ensures proper version control of policies and SOPs
   - Prepares documentation for assessments

3. Administrator: Gaurav
   - Overall hospital administration
   - Supports NABH accreditation efforts

4. NABH Champion / MRD: Kashish
   - Departmental lead for Medical Records
   - Implements NABH protocols within department
   - Monitors quality indicators and documentation

5. Quality Manager / HR: Jagruti
   - Oversees Quality Management System (QMS)
   - Manages performance indicators and audits
   - Facilitates quality improvement projects
   - HR management and staff development

6. Infection Control Nurse: Chandraprakash Bisen
   - Implements infection control protocols
   - Monitors hospital-acquired infections
   - Conducts infection control training
   - Hand hygiene compliance monitoring

7. Head Nurse: Farsana
   - Oversees nursing staff and patient care
   - Ensures nursing protocols compliance
   - Quality of nursing care monitoring

8. Patient Safety Officer: Diksha
   - Implements patient safety protocols
   - Monitors patient safety indicators
   - Investigates adverse events and near misses
   - Coordinates patient safety training

9. Patient Experience Coordinator: Neesha
   - Manages patient feedback and grievance redressal
   - Conducts patient satisfaction surveys
   - Coordinates patient rights and education initiatives

10. Clinical Audit Coordinator: Sonali
    - Plans and conducts clinical audits
    - Analyzes audit findings and prepares reports
    - Tracks implementation of recommendations
`;

// Backward compatible constant
export const TEAM_SUMMARY = getTeamSummary();

// Detailed NABH Assessor Prompt for Evidence Generation (dynamic version)
export const getAssessorPrompt = (hospitalName: string = 'Hope Hospital') => `You are acting as a NABH assessor and quality consultant for SHCO 3rd Edition.

Using the objective element description provided, generate COMPREHENSIVE, PRACTICAL, and AUDIT-READY evidences for ${hospitalName}.

KEY STAFF MEMBERS:
- Quality Coordinator: Dr. Shiraz Sheikh
- Documentation Officer: Suraj (Senior Member)
- Administrator: Gaurav
- NABH Champion / MRD: Kashish
- Quality Manager / HR: Jagruti
- Infection Control Nurse: Chandraprakash Bisen
- Head Nurse: Farsana
- Patient Safety Officer: Diksha
- Patient Experience Coordinator: Neesha
- Clinical Audit Coordinator: Sonali

Follow these STRICT rules:

1. Generate evidences exactly as expected during NABH onsite assessment.
2. Align evidences to SHCO 3rd Edition only.
3. Avoid generic statements. Each evidence must be tangible, verifiable, and hospital-usable.
4. Write evidences in clear bullet points.
5. Assume a functional NABH-compliant hospital.
6. Do NOT mention NABH clauses in the output unless specifically asked.
7. Do NOT repeat the interpretation text.
8. Separate evidences into logical sub-headings.

Mandatory Evidence Categories to cover (as applicable):
- Policy / SOP evidence
- Registers / Logs / Formats
- Records / Filled samples
- Committee involvement
- Training & competency
- Monitoring & audit
- Corrective & preventive actions
- Display / communication evidence
- Statutory or safety linkage if relevant

Formatting Rules:
- Each evidence on a new line starting with a number or bullet.
- Clear headings.
- Professional hospital documentation language.
- No assumptions outside NABH scope.

Output structure:

Objective Element:
[Write the objective element]

Evidence:

1. Policy / SOP Evidence
- ...

2. Records & Registers
- ...

3. Implementation Evidence
- ...

4. Monitoring & Review
- ...

5. Training & Awareness
- ...

6. Committee / Governance Oversight
- ...

7. Sample Measurable Outputs (if applicable)
- ...

End with:
"These evidences demonstrate effective implementation, monitoring, and continual improvement as per NABH SHCO 3rd Edition requirements."`;

// Backward compatible constant
export const NABH_ASSESSOR_PROMPT = getAssessorPrompt();
