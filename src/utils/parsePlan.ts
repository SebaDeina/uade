import type { Materia } from '../types';

const CSV_URL = '/plan.csv';

function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.trim());
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

export function parsePlanFromText(text: string): Materia[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toUpperCase().trim());
  const añoIdx     = header.findIndex((h) => h.includes('AÑO')     || h === 'AÑO');
  const codigoIdx  = header.findIndex((h) => h.includes('CODIGO')  || h === 'CODIGO');
  const materiaIdx = header.findIndex((h) => h.includes('MATERIA') || h === 'MATERIA');
  const notaIdx    = header.findIndex((h) => h.includes('NOTA')    || h === 'NOTA');
  const estadoIdx  = header.findIndex((h) => h.includes('ESTADO')  || h === 'ESTADO');
  const tituloIdx  = header.findIndex((h) => h.includes('TITULO')  || h.includes('TÍTULO'));

  if (materiaIdx < 0) return [];

  let currentYear = 1;
  const materias: Materia[] = [];
  let id = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const yearVal = añoIdx >= 0 ? row[añoIdx]?.trim() : '';
    const y = yearVal !== '' && /^\d+$/.test(yearVal) ? parseInt(yearVal, 10) : currentYear;
    currentYear = y;
    const codigo  = codigoIdx  >= 0 ? row[codigoIdx]  ?? '' : '';
    const materia = materiaIdx >= 0 ? row[materiaIdx]?.trim() ?? '' : '';
    const nota    = notaIdx    >= 0 ? row[notaIdx]    ?? '' : '';
    const estado  = estadoIdx  >= 0 ? row[estadoIdx]?.trim() ?? '' : '';
    const titulo  = tituloIdx  >= 0 ? row[tituloIdx]?.trim() ?? '' : '';
    if (!materia) continue;

    const estadoUsuario = estado.toUpperCase() === 'APROBADO' ? 'aprobada' : 'pendiente';
    materias.push({
      id: `m-${id++}`,
      year: y,
      codigo,
      materia,
      nota,
      estado,
      estadoUsuario,
      titulo,
    });
  }
  return materias;
}

export async function loadPlan(): Promise<Materia[]> {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  return parsePlanFromText(text);
}
