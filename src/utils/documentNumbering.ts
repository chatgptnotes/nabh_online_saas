/**
 * NABH-Compliant Document Numbering Utility
 * Format: [DEPT]-[TYPE]-[NN]
 * Examples: HIC-SOP-01, PHARM-REG-03, HR-FORM-05
 */

/** Map internal document types to NABH short codes */
export const DOC_TYPE_CODES: Record<string, string> = {
  circular: 'CIR',
  attendance: 'ATT',
  content: 'TRG',
  assessment: 'ASM',
  report: 'RPT',
  register: 'REG',
  form: 'FORM',
  policy: 'POL',
  sop: 'SOP',
  checklist: 'CHK',
  audit: 'AUD',
  log: 'LOG',
};

/** Map NABH chapter codes to department short codes */
export const CHAPTER_TO_DEPT: Record<string, string> = {
  AAC: 'AAC',
  COP: 'COP',
  MOM: 'PHARM',
  PRE: 'PRE',
  HIC: 'HIC',
  PSQ: 'QA',
  CQI: 'QA',
  ROM: 'ADMIN',
  FMS: 'FMS',
  HRM: 'HR',
  IMS: 'IT',
};

/** Infer document type from evidence text keywords */
export function inferDocumentType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('sop') || lower.includes('standard operating procedure')) return 'sop';
  if (lower.includes('policy')) return 'policy';
  if (lower.includes('checklist')) return 'checklist';
  if (lower.includes('register')) return 'register';
  if (lower.includes('audit')) return 'audit';
  if (lower.includes('log') || lower.includes('logbook')) return 'log';
  if (lower.includes('circular') || lower.includes('notice') || lower.includes('announcement')) return 'circular';
  if (lower.includes('attendance')) return 'attendance';
  if (lower.includes('assessment') || lower.includes('mcq')) return 'assessment';
  if (lower.includes('training')) return 'content';
  if (lower.includes('report') || lower.includes('summary')) return 'report';
  if (lower.includes('form')) return 'form';
  return 'form'; // default
}

export interface DocNumberParams {
  objectiveCode: string;
  documentType?: string;
  sequenceNumber?: number;
  evidenceText?: string;
}

/**
 * Generates NABH-compliant document control number.
 * Accepts either the new DocNumberParams object or a plain string (backward-compatible).
 *
 * New format: [DEPT]-[TYPE]-[NN]   e.g. HIC-SOP-01
 * Old string fallback: extracts chapter → DEPT, defaults type to DOC
 */
export function generateDocumentNumber(params: DocNumberParams | string): string {
  if (typeof params === 'string') {
    const chapterCode = params.split('.')[0].toUpperCase();
    const deptCode = CHAPTER_TO_DEPT[chapterCode] || chapterCode;
    return `${deptCode}-DOC-01`;
  }

  const { objectiveCode, documentType, sequenceNumber = 1, evidenceText } = params;

  // Determine department code from NABH chapter
  const chapterCode = objectiveCode.split('.')[0].toUpperCase();
  const deptCode = CHAPTER_TO_DEPT[chapterCode] || chapterCode;

  // Determine document type code
  let typeCode = 'DOC';
  if (documentType && DOC_TYPE_CODES[documentType]) {
    typeCode = DOC_TYPE_CODES[documentType];
  } else if (evidenceText) {
    const inferred = inferDocumentType(evidenceText);
    typeCode = DOC_TYPE_CODES[inferred] || 'DOC';
  }

  const seqStr = String(sequenceNumber).padStart(2, '0');
  return `${deptCode}-${typeCode}-${seqStr}`;
}

/** NC closure evidence type codes */
const NC_DOC_TYPES: Record<string, string> = {
  corrective: 'CAR',
  supporting: 'SUP',
  training: 'TRG',
  auditor: 'LTR',
};

/**
 * Generates document number for NC closure evidence sections.
 * Format: HOH/NC/{STANDARD_CODE}/{TYPE}-{NN}/2026
 * Example: HOH/NC/HIC-2.d/CAR-01/2026
 */
export function generateNCDocNumber(
  standardCode: string,
  docType: string,
  sequenceNumber: number = 1,
): string {
  const typeCode = NC_DOC_TYPES[docType] || 'DOC';
  const seqStr = String(sequenceNumber).padStart(2, '0');
  return `HOH/NC/${standardCode.replace(/\s+/g, '-').toUpperCase()}/${typeCode}-${seqStr}/2026`;
}

// ── Unchanged utilities below ──────────────────────────────────────────────

/**
 * Generates a patient ID in the hospital format
 * Format: HOP-{YEAR}-{SEQUENTIAL}
 */
export function generatePatientIdExample(): string {
  const year = new Date().getFullYear();
  const sequential = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `HOP-${year}-${sequential}`;
}

/**
 * Formats an actual visit_id from the database for display
 * If the visit_id doesn't have a prefix, adds the HOP- prefix
 */
export function formatVisitId(visitId: string): string {
  if (visitId.includes('-')) {
    return visitId;
  }
  return `HOP-${visitId}`;
}

/**
 * Gets the current date in DD/MM/YYYY format
 */
export function getFormattedDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB');
}

/**
 * Gets a future date for review (1 year from now)
 */
export function getReviewDate(date: Date = new Date()): string {
  const reviewDate = new Date(date);
  reviewDate.setFullYear(reviewDate.getFullYear() + 1);
  return reviewDate.toLocaleDateString('en-GB');
}
