import * as XLSX from 'xlsx';
import type { Materia } from '../types';

const CSV_URL = '/plan.csv';

// ─── Helpers ────────────────────────────────────────────────────
/** Normalize a header string: uppercase, strip accents, trim */
function norm(s: string): string {
  return String(s ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Score how likely a column index is to represent a given role, based on all cell values */
type Role = 'year' | 'materia' | 'nota' | 'estado' | 'codigo';

function scoreColumn(role: Role, values: string[]): number {
  let score = 0;
  for (const v of values) {
    const s = norm(v);
    if (!s) continue;
    if (role === 'year') {
      // Values like "1", "2", "1° AÑO", "PRIMER AÑO", numbers 1-6
      if (/^\d$/.test(s) && parseInt(s) <= 6) score += 3;
      else if (/\d.*AN[OÃ]/.test(s)) score += 3;
      else if (/^(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO)/.test(s)) score += 2;
      else if (/^\d/.test(s) && s.length < 8) score += 1;
      else score -= 1;
    }
    if (role === 'materia') {
      // Long text with spaces, typical subject names
      if (v.length > 10 && /\s/.test(v)) score += 2;
      if (v.length > 20) score += 1;
      if (/^\d+([.,]\d+)*$/.test(v)) score -= 3; // discard numeric columns
    }
    if (role === 'nota') {
      // Numbers from 1 to 10, or empty
      if (/^([1-9]|10)$/.test(s) || /^\d([.,]\d+)?$/.test(s)) score += 3;
      else if (s === '') score += 1;
      else score -= 2;
    }
    if (role === 'estado') {
      if (/APROBAD|REGULAR|RECURSAR|PENDIENTE|LIBRE/.test(s)) score += 5;
      else if (/^[A-Z]{4,}$/.test(s)) score += 1;
      else score -= 1;
    }
    if (role === 'codigo') {
      // Short alphanumeric code like "1.2.2001" or "MAT01"
      if (/^[\d.]{4,12}$/.test(s) || /^[A-Z]{2,5}\d+$/.test(s)) score += 3;
      else if (v.length <= 10 && !/\s/.test(v)) score += 1;
      else score -= 1;
    }
  }
  return score;
}

/** Detect which column index best represents a role, using header names first, then content scoring */
function detectColumn(
  role: Role,
  headers: string[],
  colValues: string[][],
  headerKeywords: string[],
): number {
  // 1. Try header match
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (headerKeywords.some((kw) => h.includes(norm(kw)))) return i;
  }
  // 2. Fall back to content scoring
  const scores = colValues.map((vals) => scoreColumn(role, vals));
  const best = scores.indexOf(Math.max(...scores));
  return scores[best] > 0 ? best : -1;
}

// ─── Core parser ─────────────────────────────────────────────────
/** Build column value arrays from rows (one array per column, skipping header row) */
function getColValues(rows: string[][]): string[][] {
  if (rows.length < 2) return [];
  const colCount = Math.max(...rows.map((r) => r.length));
  return Array.from({ length: colCount }, (_, ci) =>
    rows.slice(1).map((r) => String(r[ci] ?? '').trim())
  );
}

/** Converts a raw row array into Materia[], shared between CSV and Excel paths */
function rowsToMaterias(rows: string[][]): Materia[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h ?? ''));
  const colValues = getColValues(rows);

  const añoIdx     = detectColumn('year',    headers, colValues, ['AÑO', 'ANO', 'YEAR', 'AÑO']);
  const materiaIdx = detectColumn('materia', headers, colValues, ['MATERIA', 'MATERIAS', 'ASIGNATURA', 'NOMBRE', 'SUBJECT']);
  const notaIdx    = detectColumn('nota',    headers, colValues, ['NOTA', 'CALIFICACION', 'CALIFICACIÓN', 'GRADE', 'PUNTAJE']);
  const estadoIdx  = detectColumn('estado',  headers, colValues, ['ESTADO', 'STATUS']);
  const codigoIdx  = detectColumn('codigo',  headers, colValues, ['CODIGO', 'CÓDIGO', 'CODE', 'COD']);
  const tituloColIdx = headers.findIndex((h) => { const n = norm(h); return n.includes('TITULO') || n.includes('TITULO'); });

  if (materiaIdx < 0) return [];

  let currentYear = 1;
  let currentTitulo = '';      // tracks the degree title from "Titulo:..." rows
  const materias: Materia[] = [];
  let id = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cell = (idx: number) => String(idx >= 0 ? row[idx] ?? '' : '').trim();

    // ── Detect embedded "Titulo: ..." rows ─────────────────────────
    // Any cell in the row that starts with "Titulo:" or "Título:"
    const tituloCell = row.find((c) => /^t[ií]tulo\s*:/i.test(String(c ?? '').trim()));
    if (tituloCell) {
      currentTitulo = String(tituloCell).replace(/^t[ií]tulo\s*:\s*/i, '').trim();
      continue; // skip this row — don't add it as a materia
    }

    // ── Skip completely blank rows ──────────────────────────────────
    if (row.every((c) => !String(c ?? '').trim())) continue;

    // ── Year ────────────────────────────────────────────────────────
    const yearRaw = cell(añoIdx);
    const yearMatch = yearRaw !== '' ? yearRaw.match(/(\d+)/) : null;
    const y = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;
    if (yearRaw !== '') currentYear = y;

    // ── Materia ────────────────────────────────────────────────────
    const materia = cell(materiaIdx);
    if (!materia) continue;

    const nota   = cell(notaIdx);
    const estado = cell(estadoIdx);
    const titulo = tituloColIdx >= 0 ? cell(tituloColIdx) : currentTitulo;

    // ── Estado auto-detection ──────────────────────────────────────
    let estadoUsuario: Materia['estadoUsuario'] = 'pendiente';
    const notaNum = parseFloat(nota.replace(',', '.'));
    if (!isNaN(notaNum) && notaNum >= 4) {
      estadoUsuario = 'aprobada';
    } else if (/^APROBAD/i.test(estado)) {
      estadoUsuario = 'aprobada';
    } else if (/^REGULAR/i.test(estado)) {
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
      titulo,
    });
  }
  return materias;
}

// ─── Public API ─────────────────────────────────────────────────
export function parsePlanFromText(text: string): Materia[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
  const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));
  return rowsToMaterias(rows);
}

export function parsePlanFromExcel(buffer: ArrayBuffer): Materia[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
  return rowsToMaterias(rows);
}

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
