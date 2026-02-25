/** Nombres de las optativas (reemplazan "Optativa I", "Optativa II", etc. en pantalla) */
export const OPTATIVAS_NAMES: Record<string, string> = {
  'Optativa I': 'Optativa 1 (Diseño web)',
  'Optativa II': 'Optativa 2 (Testing de aplicaciones)',
  'Optativa III': 'Optativa 3 (Administración de Ventas)',
  'Optativa IV': 'Optativa 4 (Valuación de empresas)',
  'Optativa V': 'Optativa 5 (Econometría)',
  'Optativa VI': 'Optativa 6 (Teoría Financiera de la Valuación)',
  'Optativa VII': 'Optativa 7 (Mercados Financieros, instituciones e instrumentos 1)',
  'Optativa 1': 'Optativa 1 (Diseño web)',
  'Optativa 2': 'Optativa 2 (Testing de aplicaciones)',
  'Optativa 3': 'Optativa 3 (Administración de Ventas)',
  'Optativa 4': 'Optativa 4 (Valuación de empresas)',
  'Optativa 5': 'Optativa 5 (Econometría)',
  'Optativa 6': 'Optativa 6 (Teoría Financiera de la Valuación)',
  'Optativa 7': 'Optativa 7 (Mercados Financieros, instituciones e instrumentos 1)',
};

export function getNombreOptativa(materia: string): string {
  return OPTATIVAS_NAMES[materia.trim()] ?? materia;
}
