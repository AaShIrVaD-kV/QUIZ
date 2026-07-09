import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Team, Question } from '../store/useStore';

// Decodes a cell reference like "A1" into { row: 1, col: 1 }
function decodeCellRef(ref: string) {
  const match = ref.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return { row: 1, col: 1 };
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { row, col };
}

// Encodes a row and column index into a cell reference like "A1"
function encodeCellRef(row: number, col: number) {
  let colStr = '';
  let temp = col;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    colStr = String.fromCharCode(65 + mod) + colStr;
    temp = Math.floor((temp - mod) / 26);
  }
  return `${colStr}${row}`;
}

// Populate the workbook with title, team names, question labels, and scores, then return the populated workbook
async function populateWorkbook(
  title: string,
  teams: Team[],
  roundNames: string[],
  roundQuestions: { [roundIndex: number]: Question[] },
  excelTemplateBase64: string | null
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  // Load the template
  if (excelTemplateBase64) {
    const base64Data = excelTemplateBase64.split(',')[1] || excelTemplateBase64;
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await workbook.xlsx.load(bytes as any);
  } else {
    // Fetch default template from public folder
    const res = await fetch('/template.xlsx');
    const arrayBuffer = await res.arrayBuffer();
    await workbook.xlsx.load(new Uint8Array(arrayBuffer) as any);
  }

  // Define the default sheet names in the provided Excel template
  const defaultRoundSheets = ['CHODIKAM PARAYAM', 'SAMVADAM', 'KANISHAM', 'NERVAZHI', 'Visual Round'];

  // Update title in all worksheets (scan for cells containing old title elements)
  const defaultTitles = [
    'REV. ANUP MATHEW MEMORIAL QUIZ COMPETETION',
    'REV. ANUP MATHEW MEMORIAL QUIZ COMPETITION',
    'SCORE BOARD'
  ];

  workbook.worksheets.forEach((ws) => {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === 'string') {
          const val = cell.value.toUpperCase();
          if (defaultTitles.some((t) => val.includes(t))) {
            if (val.includes('REV. ANUP') || val.includes('MEMORIAL')) {
              cell.value = title.toUpperCase();
            } else if (val.includes('SCORE BOARD') || val.includes('SCOREBOARD')) {
              cell.value = 'QUIZ SCOREBOARD';
            }
          }
        }
      });
    });
  });

  // 1. Update the Round sheets
  const roundTotals: { [teamId: string]: number[] } = {};
  teams.forEach((t) => {
    roundTotals[t.id] = [0, 0, 0, 0, 0];
  });

  for (let ri = 0; ri < 5; ri++) {
    const roundName = roundNames[ri];
    const questions = roundQuestions[ri] || [];
    
    // Find worksheet
    let ws = workbook.getWorksheet(roundName);
    if (!ws) {
      ws = workbook.worksheets.find((w) => w.name.toLowerCase() === roundName.toLowerCase());
    }
    if (!ws) {
      ws = workbook.getWorksheet(defaultRoundSheets[ri]);
    }
    if (!ws) {
      ws = workbook.worksheets[ri + 1]; // Sheet 0 is usually master sheet
    }
    if (!ws) continue;

    // Scan column A to find the TEAM row and TOTAL row
    let teamRowIdx = 1;
    let totalRowIdx = 12;

    for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) {
      const cellVal = String(ws.getCell(r, 1).value || '').toUpperCase();
      if (cellVal.includes('TEAM')) {
        teamRowIdx = r;
      }
      if (cellVal.includes('TOTAL') || cellVal.includes('SUM')) {
        totalRowIdx = r;
      }
    }

    // Populate team names and scores
    // Template column mapping: Column B = Team 1, C = Team 2... up to Col Z (Team 25)
    for (let col = 2; col <= 26; col++) {
      const teamIdx = col - 2;
      const team = teams[teamIdx];

      if (team) {
        // Write team name
        ws.getCell(teamRowIdx, col).value = team.name;

        // Calculate team's total in this round
        let roundTotal = 0;

        // Write scores row by row
        questions.forEach((q, qIdx) => {
          const row = teamRowIdx + 1 + qIdx;
          if (row < totalRowIdx) {
            // Write question label in Col A if it's within range
            ws.getCell(row, 1).value = q.name;
            const score = team.scores[ri]?.[q.id] ?? 0;
            ws.getCell(row, col).value = score;
            roundTotal += score;
          }
        });

        // Clear remaining question cells in this column (if any before the TOTAL row)
        for (let row = teamRowIdx + 1 + questions.length; row < totalRowIdx; row++) {
          ws.getCell(row, col).value = 0;
        }

        // Write the calculated total value
        ws.getCell(totalRowIdx, col).value = roundTotal;
        roundTotals[team.id][ri] = roundTotal;
      } else {
        // Clear cells for unused columns
        ws.getCell(teamRowIdx, col).value = '';
        for (let row = teamRowIdx + 1; row <= totalRowIdx; row++) {
          ws.getCell(row, col).value = null;
        }
      }
    }
  }

  // 2. Update the MASTER SHEET
  const masterWS = workbook.getWorksheet('MASTER SHEET') || workbook.worksheets[0];
  if (masterWS) {
    let teamRowIdx = 3; // Default is row 3
    for (let r = 1; r <= Math.min(masterWS.rowCount, 10); r++) {
      const cellVal = String(masterWS.getCell(r, 1).value || '').toUpperCase();
      if (cellVal.includes('TEAM')) {
        teamRowIdx = r;
        break;
      }
    }

    // Populate team names and round total summaries on the master sheet
    for (let col = 2; col <= 26; col++) {
      const teamIdx = col - 2;
      const team = teams[teamIdx];

      if (team) {
        masterWS.getCell(teamRowIdx, col).value = team.name;

        // Row 5: CHODIKAM PARAYAM
        masterWS.getCell(5, col).value = roundTotals[team.id][0];
        // Row 6: SAMVADAM
        masterWS.getCell(6, col).value = roundTotals[team.id][1];
        // Row 7: KANISHAM
        masterWS.getCell(7, col).value = roundTotals[team.id][2];
        // Row 8: NERVAZHI
        masterWS.getCell(8, col).value = roundTotals[team.id][3];
        // Row 11: Visual Round
        masterWS.getCell(11, col).value = roundTotals[team.id][4];

        // Row 12: GRAND TOTAL
        const grandTotal = roundTotals[team.id].reduce((a, b) => a + b, 0);
        masterWS.getCell(12, col).value = grandTotal;
      } else {
        masterWS.getCell(teamRowIdx, col).value = '';
        for (let row = 4; row <= 12; row++) {
          masterWS.getCell(row, col).value = null;
        }
      }
    }
  }

  return workbook;
}

export async function exportToExcel(
  title: string,
  teams: Team[],
  roundNames: string[],
  roundQuestions: { [roundIndex: number]: Question[] },
  excelTemplateBase64: string | null
) {
  try {
    const workbook = await populateWorkbook(title, teams, roundNames, roundQuestions, excelTemplateBase64);
    const outBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_Scoreboard.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export Excel:', err);
    alert('Failed to export Excel file. Make sure a valid template is uploaded.');
  }
}

export function exportToCSV(title: string, teams: Team[], roundNames: string[]) {
  const ranked = [...teams]
    .map((t) => ({ ...t, total: Object.values(t.scores).reduce((sum, r) => sum + Object.values(r).reduce((s, q) => s + q, 0), 0) }))
    .sort((a, b) => b.total - a.total);

  const lines = [];
  lines.push(`"${title.replace(/"/g, '""')}"`);
  lines.push(`"Generated: ${new Date().toLocaleString()}"`);
  lines.push('');

  const headers = ['Rank', 'Team'];
  roundNames.forEach(rn => headers.push(rn));
  headers.push('Grand Total');
  lines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  ranked.forEach((t, i) => {
    const row = [String(i + 1), t.name];
    for (let ri = 0; ri < 5; ri++) {
      const rScores = t.scores[ri] || {};
      const rTotal = Object.values(rScores).reduce((sum, s) => sum + s, 0);
      row.push(String(rTotal));
    }
    row.push(String(t.total));
    lines.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_Scoreboard.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, teams: Team[], roundNames: string[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const ranked = [...teams]
    .map((t) => {
      const rTotals = Array(5).fill(0);
      for (let ri = 0; ri < 5; ri++) {
        rTotals[ri] = Object.values(t.scores[ri] || {}).reduce((sum, s) => sum + s, 0);
      }
      return {
        ...t,
        rTotals,
        total: rTotals.reduce((a, b) => a + b, 0)
      };
    })
    .sort((a, b) => b.total - a.total);

  // Title page
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Official Quiz Scoreboard — Exported ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

  const head = [['Rank', 'Team', ...roundNames, 'Grand Total']];
  const body = ranked.map((t, i) => [
    i + 1,
    t.name,
    ...t.rTotals.map(String),
    t.total,
  ]);

  autoTable(doc, {
    startY: 35,
    head,
    body,
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' }, // slate-800
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    rowPageBreak: 'auto',
    styles: { fontSize: 10, cellPadding: 3.5, halign: 'center' },
    columnStyles: {
      1: { halign: 'left', fontStyle: 'bold' } // Team column left-aligned
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index < 3) {
        // Gold, Silver, Bronze rows highlighted slightly
        const colors: [number, number, number][] = [
          [254, 240, 138], // Yellow-100 (Gold)
          [241, 245, 249], // Slate-100 (Silver)
          [255, 237, 213], // Orange-100 (Bronze)
        ];
        data.cell.styles.fillColor = colors[data.row.index];
      }
    },
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_Scoreboard.pdf`);
}

// Helper to convert sheet to HTML string preserving formatting
function convertSheetToHTML(ws: ExcelJS.Worksheet): string {
  let maxRow = 1;
  let maxCol = 1;

  ws.eachRow((row, rowNumber) => {
    maxRow = Math.max(maxRow, rowNumber);
    row.eachCell((_, colNumber) => {
      maxCol = Math.max(maxCol, colNumber);
    });
  });

  // Parse merges
  const mergedCellsMap = new Map<string, { master: string; rowspan: number; colspan: number }>();
  const isMergedNonMaster = new Set<string>();

  const merges = ws.model.merges || [];
  merges.forEach((rangeStr) => {
    const parts = rangeStr.split(':');
    if (parts.length === 2) {
      const start = decodeCellRef(parts[0]);
      const end = decodeCellRef(parts[1]);
      const masterRef = parts[0];

      const rowspan = end.row - start.row + 1;
      const colspan = end.col - start.col + 1;

      mergedCellsMap.set(masterRef, { master: masterRef, rowspan, colspan });

      for (let r = start.row; r <= end.row; r++) {
        for (let c = start.col; c <= end.col; c++) {
          const ref = encodeCellRef(r, c);
          if (ref !== masterRef) {
            isMergedNonMaster.add(ref);
          }
        }
      }
    }
  });

  // Column widths
  const colWidthsStyles = [];
  for (let c = 1; c <= maxCol; c++) {
    const colWidth = ws.getColumn(c).width || 10;
    // Estimate width in pixels (width * 8px)
    colWidthsStyles.push(`width: ${colWidth * 9}px;`);
  }

  let html = `<table style="border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; table-layout: fixed;">`;
  
  // Colgroup for widths
  html += '<colgroup>';
  for (let c = 1; c <= maxCol; c++) {
    html += `<col style="${colWidthsStyles[c - 1]}" />`;
  }
  html += '</colgroup>';

  for (let r = 1; r <= maxRow; r++) {
    const row = ws.getRow(r);
    const rowHeight = row.height || 20;
    html += `<tr style="height: ${rowHeight * 1.3}px;">`;

    for (let c = 1; c <= maxCol; c++) {
      const cellRef = encodeCellRef(r, c);
      if (isMergedNonMaster.has(cellRef)) continue;

      const cell = ws.getCell(r, c);
      const mergeInfo = mergedCellsMap.get(cellRef);
      const spanAttributes = mergeInfo 
        ? ` rowspan="${mergeInfo.rowspan}" colspan="${mergeInfo.colspan}"`
        : '';

      const cellStyles: string[] = [];

      // Borders
      if (cell.border) {
        if (cell.border.top) cellStyles.push('border-top: 1px solid #94a3b8');
        if (cell.border.bottom) cellStyles.push('border-bottom: 1px solid #94a3b8');
        if (cell.border.left) cellStyles.push('border-left: 1px solid #94a3b8');
        if (cell.border.right) cellStyles.push('border-right: 1px solid #94a3b8');
      } else {
        // default border
        cellStyles.push('border: 1px solid #e2e8f0');
      }

      // Background Fill
      if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
        const argb = cell.fill.fgColor.argb;
        if (argb && typeof argb === 'string') {
          const hex = argb.length === 8 ? `#${argb.substring(2)}` : `#${argb}`;
          cellStyles.push(`background-color: ${hex}`);
        }
      }

      // Font style
      if (cell.font) {
        if (cell.font.name) cellStyles.push(`font-family: '${cell.font.name}', sans-serif`);
        if (cell.font.size) cellStyles.push(`font-size: ${cell.font.size}pt`);
        if (cell.font.bold) cellStyles.push('font-weight: bold');
        if (cell.font.italic) cellStyles.push('font-style: italic');
        if (cell.font.color && cell.font.color.argb) {
          const argb = cell.font.color.argb;
          const hex = argb.length === 8 ? `#${argb.substring(2)}` : `#${argb}`;
          cellStyles.push(`color: ${hex}`);
        }
      }

      // Alignment
      if (cell.alignment) {
        if (cell.alignment.horizontal) {
          cellStyles.push(`text-align: ${cell.alignment.horizontal === 'center' ? 'center' : cell.alignment.horizontal === 'right' ? 'right' : 'left'}`);
        }
        if (cell.alignment.vertical) {
          cellStyles.push(`vertical-align: ${cell.alignment.vertical === 'middle' ? 'middle' : cell.alignment.vertical === 'bottom' ? 'bottom' : 'top'}`);
        }
      } else {
        // Default text aligns
        if (typeof cell.value === 'number') {
          cellStyles.push('text-align: center');
        } else {
          cellStyles.push('text-align: left');
        }
        cellStyles.push('vertical-align: middle');
      }

      // Content rendering
      let cellText = '';
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object') {
          // If it's a formula, display the result or empty
          const formulaVal = cell.value as any;
          if (formulaVal.result !== undefined && formulaVal.result !== null) {
            cellText = String(formulaVal.result);
          } else {
            cellText = '';
          }
        } else {
          cellText = String(cell.value);
        }
      }

      html += `<td style="${cellStyles.join('; ')}"${spanAttributes}>${cellText}</td>`;
    }
    html += `</tr>`;
  }
  html += `</table>`;
  return html;
}

export async function printScoreboard(
  title: string,
  teams: Team[],
  roundNames: string[],
  roundQuestions: { [roundIndex: number]: Question[] },
  activeTab: number,
  excelTemplateBase64: string | null
) {
  try {
    const workbook = await populateWorkbook(title, teams, roundNames, roundQuestions, excelTemplateBase64);
    
    // Find active sheet name
    let activeSheet: ExcelJS.Worksheet;
    if (activeTab === 5) {
      // Master Board
      activeSheet = workbook.getWorksheet('MASTER SHEET') || workbook.worksheets[0];
    } else {
      const roundName = roundNames[activeTab];
      let ws = workbook.getWorksheet(roundName);
      if (!ws) {
        ws = workbook.worksheets.find((w) => w.name.toLowerCase() === roundName.toLowerCase());
      }
      if (!ws) {
        ws = workbook.worksheets[activeTab + 1];
      }
      activeSheet = ws || workbook.worksheets[0];
    }

    const htmlTable = convertSheetToHTML(activeSheet);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up blocker is preventing print view. Please allow popups.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Scoreboard — ${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container {
            width: 100%;
            margin: 0 auto;
          }
          table {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${htmlTable}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  } catch (err) {
    console.error('Failed to print scoreboard:', err);
    alert('Failed to print scoreboard. Make sure a template is uploaded.');
  }
}
