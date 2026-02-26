/**
 * Stamp uploaded documents with NABH document control number footer.
 * Uses pdf-lib for PDF manipulation and image embedding.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getFormattedDate, getReviewDate } from './documentNumbering';

/**
 * Stamps a PDF or image file with a control number footer on every page.
 *
 * Footer format:
 *   Controlled Document | HOSP-FORM-01 | Ver 1.0 | Effective: DD/MM/YYYY | Review: DD/MM/YYYY | Hospital Name
 *
 * @returns { blob: Blob, dataUrl: string } — the stamped PDF as a Blob and a preview data URL
 */
export async function stampPdfWithControlNumber(
  file: File,
  controlNumber: string,
  hospitalName: string,
): Promise<{ blob: Blob; dataUrl: string }> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: PDFDocument;

  if (file.type === 'application/pdf') {
    // Load existing PDF
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } else {
    // Image file — create a new single-page PDF with the image embedded
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    let image;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // JPEG and other formats
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    // Scale image to fit page with margins
    const margin = 40;
    const maxW = page.getWidth() - margin * 2;
    const maxH = page.getHeight() - margin * 2 - 30; // leave room for footer
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const imgW = image.width * scale;
    const imgH = image.height * scale;

    page.drawImage(image, {
      x: (page.getWidth() - imgW) / 2,
      y: page.getHeight() - margin - imgH,
      width: imgW,
      height: imgH,
    });
  }

  // Build footer text
  const effectiveDate = getFormattedDate();
  const reviewDate = getReviewDate();
  const footerText = `Controlled Document  |  ${controlNumber}  |  Ver 1.0  |  Effective: ${effectiveDate}  |  Review: ${reviewDate}  |  ${hospitalName}`;

  // Embed font and stamp every page
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 7;
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(footerText, fontSize);
    const x = (width - textWidth) / 2;

    page.drawText(footerText, {
      x,
      y: 12,
      size: fontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}
