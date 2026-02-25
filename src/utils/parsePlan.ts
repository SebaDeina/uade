import * as XLSX from 'xlsx';
import type { Materia } from '../types';

const CSV_URL = '/plan.csv';

/** Converts a raw row array (string[][]) into Materia[], shared between CSV and Excel paths */
function rowsToMaterias(rows: string[][]): Materia[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => String(h ?? '').toUpperCase().trim());
  const añoIdx     = header.findIndex((h) => h.includes('AÑO')     || h === 'ANO');
  const codigoIdx  = header.findIndex((h) => h.includes('CODIGO')  || h === 'CODIGO');
  const materiaIdx = header.findIndex((h) => h.includes('MATERIA') || h === 'MATERIA');
  const notaIdx    = header.findIndex((h) => h.includes('NOTA')    || h === 'NOTA' || h.includes('CALIFICACION') || h.includes('CALIFICACIÓN'));
  const estadoIdx  = header.findIndex((h) => h.includes('ESTADO')  || h === 'ESTADO');
  const tituloIdx  = header.findIndex((h) => h.includes('TITULO')  || h.includes('TÍTULO'));

  if (materiaIdx < 0) return [];

  let currentYear = 1;
  const materias: Materia[] = [];
  let id = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cell = (idx: number) => String(idx >= 0 ? row[idx] ?? '' : '').trim();

    const yearVal = cell(añoIdx);
    const y = yearVal !== '' && /^\d+$/.test(yearVal) ? parseInt(yearVal, 10) : currentYear;
    currentYear = y;

    const materia = cell(materiaIdx);
    if (!materia) continue;

    const nota   = cell(notaIdx);
    const estado = cell(estadoIdx);

    // Auto-detect estado from nota (number ≥ 4 = aprobada) or explicit ESTADO column
    let estadoUsuario: Materia['estadoUsuario'] = 'pendiente';
    const notaNum = parseFloat(nota.replace(',', '.'));
    if (!isNaN(notaNum) && notaNum >= 4) {
      estadoUsuario = 'aprobada';
    } else if (estado.toUpperCase() === 'APROBADO' || estado.toUpperCase() === 'APROBADA') {
      estadoUsuario = 'aprobada';
    } else if (estado.toUpperCase() === 'REGULAR') {
      estadoUsuario = 'regular';
    }

    materias.push({
      id: `m-${id++}`,
      year: y,
      codigo: cell(codigoIdx),
      materia,
      nota,
      estado,
      estadoUsuario,
      titulo: cell(tituloIdx),
    });
  }
  return materias;
}

/** Parse from CSV text */
export function parsePlanFromText(text: string): Materia[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
  const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));
  return rowsToMaterias(rows);
}

/** Parse from an Excel file (ArrayBuffer) */
export function parsePlanFromExcel(buffer: ArrayBuffer): Materia[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  // Use the first sheet
  const ws = wb.Sheets[wb.SheetNames[0]];
  // Convert to array of arrays (header row included)
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
  return rowsToMaterias(rows);
}

/** Parse from a File object (auto-detects CSV vs Excel) */
export async function parsePlanFromFile(file: File): Promise<Materia[]> {
  const isExcel = /\.(xlsx|xls|ods)$/i.test(file.name);
  if (isExcel) {
    const buffer = await file.arrayBuffer();
    return parsePlanFromExcel(buffer);
  }
  const text = await file.text();
  return parsePlanFromText(text);
}

export async function loadPlan(): Promise<Materia[]> {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  return parsePlanFromText(text);
}
