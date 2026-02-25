export type EstadoUsuario = 'pendiente' | 'regular' | 'final_previo' | 'aprobada' | 'recursar';

export interface Materia {
  id: string;
  year: number;
  codigo: string;
  materia: string;
  nota: string;
  estado: string;
  /** Estado que marcás con clics: pendiente → regular → final_previo → aprobada → recursar → pendiente */
  estadoUsuario: EstadoUsuario;
  /** Título al que pertenece la materia, eg "Tecnico" o "Licenciado" */
  titulo?: string;
}

/** Correlativa: [nombre materia prerequisito, nombre materia que la requiere] */
export type Correlativa = [string, string];

/** Datos base de un plan (sin estadoUsuario) para guardar en Firestore */
export type BasePlanMateria = Omit<Materia, 'estadoUsuario'>;

export interface UserPlanData {
  careerName: string;
  materias: BasePlanMateria[];
}
