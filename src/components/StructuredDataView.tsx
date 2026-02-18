import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface StructuredData {
  title?: string;
  documentType?: string;
  description?: string;
  keyValuePairs?: { key: string; value: string }[] | Record<string, string>;
  sections?: { heading: string; content: string }[];
  tables?: { caption?: string; data: string }[];
}

interface StructuredDataViewProps {
  data: StructuredData;
  fileName?: string;
}

const TYPE_COLORS: Record<string, string> = {
  register: '#1565C0',
  form: '#2E7D32',
  certificate: '#ED6C02',
  report: '#9C27B0',
  manual: '#00838F',
  letter: '#C62828',
  policy: '#4527A0',
  sop: '#1B5E20',
};

function parseKeyValuePairs(kvp: StructuredData['keyValuePairs']): { key: string; value: string }[] {
  if (!kvp) return [];
  if (Array.isArray(kvp)) return kvp;
  return Object.entries(kvp).map(([key, value]) => ({ key, value: String(value) }));
}

function parseTable(tableData: string): { headers: string[]; rows: string[][] } {
  const lines = tableData.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split('|').map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split('|').map(c => c.trim()));
  return { headers, rows };
}

export default function StructuredDataView({ data, fileName }: StructuredDataViewProps) {
  const [expanded, setExpanded] = useState(true);

  const kvPairs = parseKeyValuePairs(data.keyValuePairs);
  const docType = data.documentType || 'document';
  const typeColor = TYPE_COLORS[docType.toLowerCase()] || '#546E7A';

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.text(data.title || fileName || 'Document', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Type badge
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Type: ${docType}`, pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Key-value pairs
    if (kvPairs.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(21, 101, 192);
      doc.text('Document Fields', 14, y);
      y += 8;

      kvPairs.forEach((kv, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255);
        doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(kv.key, 16, y);
        doc.setTextColor(30);
        doc.text(String(kv.value).substring(0, 80), 80, y);
        y += 8;
      });
      y += 6;
    }

    // Sections
    if (data.sections && data.sections.length > 0) {
      data.sections.forEach(section => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(21, 101, 192);
        doc.text(section.heading, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(50);
        const lines = doc.splitTextToSize(section.content, pageWidth - 28);
        lines.forEach((line: string) => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, 14, y);
          y += 5;
        });
        y += 6;
      });
    }

    // Tables
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach(table => {
        const { headers, rows } = parseTable(table.data);
        if (headers.length === 0) return;

        if (y > 240) { doc.addPage(); y = 20; }

        if (table.caption) {
          doc.setFontSize(11);
          doc.setTextColor(21, 101, 192);
          doc.text(table.caption, 14, y);
          y += 7;
        }

        const colWidth = (pageWidth - 28) / headers.length;

        // Header row
        doc.setFillColor(21, 101, 192);
        doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255);
        headers.forEach((h, i) => {
          doc.text(h.substring(0, 20), 16 + i * colWidth, y);
        });
        y += 8;

        // Data rows
        rows.forEach((row, ri) => {
          if (y > 275) { doc.addPage(); y = 20; }
          if (ri % 2 === 0) {
            doc.setFillColor(240, 248, 255);
            doc.rect(14, y - 5, pageWidth - 28, 7, 'F');
          }
          doc.setTextColor(50);
          row.forEach((cell, ci) => {
            doc.text(String(cell).substring(0, 20), 16 + ci * colWidth, y);
          });
          y += 7;
        });
        y += 8;
      });
    }

    doc.save(`${(data.title || fileName || 'document').replace(/\s+/g, '_')}_extracted.pdf`);
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Key-value pairs sheet
    if (kvPairs.length > 0) {
      const wsData = [['Field', 'Value'], ...kvPairs.map(kv => [kv.key, kv.value])];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 25 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Fields');
    }

    // Sections sheet
    if (data.sections && data.sections.length > 0) {
      const wsData = [['Heading', 'Content'], ...data.sections.map(s => [s.heading, s.content])];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 25 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Sections');
    }

    // Tables
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach((table, idx) => {
        const { headers, rows } = parseTable(table.data);
        if (headers.length === 0) return;
        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = headers.map(() => ({ wch: 25 }));
        const sheetName = (table.caption || `Table_${idx + 1}`).substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    }

    XLSX.writeFile(wb, `${(data.title || fileName || 'document').replace(/\s+/g, '_')}_extracted.xlsx`);
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          bgcolor: '#f5f5f5',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ color: typeColor }}>description</Icon>
          <Typography variant="subtitle2" fontWeight={600}>
            {data.title || fileName || 'Extracted Data'}
          </Typography>
          <Chip
            label={docType}
            size="small"
            sx={{ bgcolor: typeColor, color: 'white', fontSize: '0.7rem', height: 22 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button size="small" startIcon={<Icon>picture_as_pdf</Icon>} onClick={(e) => { e.stopPropagation(); handleDownloadPDF(); }}>
            PDF
          </Button>
          <Button size="small" startIcon={<Icon>table_chart</Icon>} onClick={(e) => { e.stopPropagation(); handleDownloadExcel(); }}>
            Excel
          </Button>
          <IconButton size="small">
            <Icon>{expanded ? 'expand_less' : 'expand_more'}</Icon>
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Description */}
          {data.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.description}
            </Typography>
          )}

          {/* Key-value pairs table */}
          {kvPairs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Document Fields
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e3f2fd', width: '35%' }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e3f2fd' }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kvPairs.map((kv, i) => (
                      <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <TableCell sx={{ fontWeight: 500 }}>{kv.key}</TableCell>
                        <TableCell>{kv.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Sections */}
          {data.sections && data.sections.length > 0 && data.sections.map((section, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  bgcolor: '#e3f2fd',
                  p: 1,
                  pl: 1.5,
                  borderLeft: '4px solid #1565C0',
                  fontWeight: 600,
                  color: '#1565C0',
                  mb: 0.5,
                }}
              >
                {section.heading}
              </Typography>
              <Typography variant="body2" sx={{ p: 1, pl: 1.5, whiteSpace: 'pre-wrap' }}>
                {section.content}
              </Typography>
            </Box>
          ))}

          {/* Tables */}
          {data.tables && data.tables.length > 0 && data.tables.map((table, idx) => {
            const { headers, rows } = parseTable(table.data);
            if (headers.length === 0) return null;
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                {table.caption && (
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
                    {table.caption}
                  </Typography>
                )}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {headers.map((h, hi) => (
                          <TableCell key={hi} sx={{ fontWeight: 600, bgcolor: '#1565C0', color: 'white', fontSize: '0.8rem' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, ri) => (
                        <TableRow key={ri} sx={{ bgcolor: ri % 2 === 0 ? '#f5f9ff' : 'white' }}>
                          {row.map((cell, ci) => (
                            <TableCell key={ci} sx={{ fontSize: '0.8rem' }}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
