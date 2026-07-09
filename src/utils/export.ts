import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Team } from '../store/useStore';

export function exportToExcel(title: string, teams: Team[], roundNames: string[]) {
  const wb = XLSX.utils.book_new();

  // Final Score sheet
  const finalData = [...teams]
    .map((t) => ({
      Team: t.name,
      ...Object.fromEntries(roundNames.map((name, i) => [name, t.scores[i]])),
      Total: t.scores.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.Total - a.Total);

  const finalWS = XLSX.utils.json_to_sheet(finalData);
  XLSX.utils.book_append_sheet(wb, finalWS, 'Final Score');

  // Individual round sheets
  roundNames.forEach((name, ri) => {
    const data = [...teams]
      .map((t) => ({ Team: t.name, Score: t.scores[ri] }))
      .sort((a, b) => b.Score - a.Score);
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });

  XLSX.writeFile(wb, `${title.replace(/[^a-z0-9]/gi, '_')}_Scoreboard.xlsx`);
}

export function exportToPDF(title: string, teams: Team[], roundNames: string[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const ranked = [...teams]
    .map((t) => ({ ...t, total: t.scores.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 80);
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 120);
  doc.text('Final Scoreboard', doc.internal.pageSize.width / 2, 22, { align: 'center' });

  const head = [['Rank', 'Team', ...roundNames, 'Total']];
  const body = ranked.map((t, i) => [
    i + 1,
    t.name,
    ...t.scores.map(String),
    t.total,
  ]);

  autoTable(doc, {
    startY: 28,
    head,
    body,
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 238, 255] },
    rowPageBreak: 'auto',
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index < 3) {
        const colors: [number, number, number][] = [
          [255, 223, 100],
          [200, 210, 220],
          [205, 127, 50],
        ];
        data.cell.styles.fillColor = colors[data.row.index];
      }
    },
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_Scoreboard.pdf`);
}

export function printScoreboard(title: string, teams: Team[], roundNames: string[]) {
  const ranked = [...teams]
    .map((t) => ({ ...t, total: t.scores.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);

  const MEDALS = ['🥇', '🥈', '🥉'];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — Scoreboard</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1e1b4b; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
        p.sub { text-align: center; color: #6b7280; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #4f46e5; color: white; padding: 8px 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f5f3ff; }
        tr:nth-child(1) td { background: #fef9c3; font-weight: bold; }
        tr:nth-child(2) td { background: #f1f5f9; }
        tr:nth-child(3) td { background: #fdf6ec; }
        .total { font-weight: bold; color: #4f46e5; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="sub">Final Scoreboard — Printed ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            ${roundNames.map((n) => `<th>${n}</th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${ranked
            .map(
              (t, i) => `
            <tr>
              <td>${MEDALS[i] ?? '#' + (i + 1)}</td>
              <td>${t.name}</td>
              ${t.scores.map((s) => `<td>${s}</td>`).join('')}
              <td class="total">${t.total}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
}
