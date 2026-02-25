import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { parsePlanFromText } from '../utils/parsePlan';
import type { Materia, EstadoUsuario, BasePlanMateria, UserPlanData } from '../types';

/** Clave del doc en Firestore: users/{uid} */
const userDoc = (uid: string) => doc(db, 'users', uid);

export function useUserPlan(uid: string) {
  const [materias, setMateriasState] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCustomPlan, setHasCustomPlan] = useState(false);
  const [careerName, setCareerName] = useState<string>('');

  const loadAndMerge = useCallback(async (baseMaterias: Materia[], savedEstados: Record<string, EstadoUsuario>) => {
    return baseMaterias.map((m) =>
      savedEstados[m.id] ? { ...m, estadoUsuario: savedEstados[m.id] } : m
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const snap = await getDoc(userDoc(uid));
        const data = snap.exists() ? snap.data() : {};
        const savedEstados: Record<string, EstadoUsuario> = (data.estados as Record<string, EstadoUsuario>) ?? {};

        let baseMaterias: Materia[];
        if (data.basePlan) {
          // Usuario ya cargó su plan
          const planData = data.basePlan as UserPlanData;
          baseMaterias = (planData.materias as BasePlanMateria[]).map((m) => ({ ...m, estadoUsuario: 'pendiente' as EstadoUsuario }));
          if (!cancelled) {
            setHasCustomPlan(true);
            setCareerName(planData.careerName);
          }
        } else {
          // Sin plan → usuario nuevo, empieza vacío y debe cargar su CSV
          baseMaterias = [];
          if (!cancelled) {
            setHasCustomPlan(false);
            setCareerName('');
          }
        }

        const merged = await loadAndMerge(baseMaterias, savedEstados);
        if (!cancelled) setMateriasState(merged);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [uid, loadAndMerge]);

  /** Actualiza el estado de una materia y persiste en Firestore */
  const setMaterias = useCallback(
    (updater: (prev: Materia[]) => Materia[]) => {
      setMateriasState((prev) => {
        const next = updater(prev);
        const estados: Record<string, EstadoUsuario> = {};
        next.forEach((m) => { estados[m.id] = m.estadoUsuario; });
        setDoc(userDoc(uid), { estados }, { merge: true }).catch(console.error);
        return next;
      });
    },
    [uid]
  );

  /** Carga un plan personalizado desde texto CSV y lo guarda en Firestore */
  const uploadPlan = useCallback(
    async (csvText: string, name: string) => {
      const parsed = parsePlanFromText(csvText);
      if (parsed.length === 0) throw new Error('El CSV no tiene materias válidas');

      // Guardamos solo los datos base (sin estadoUsuario)
      const baseMaterias: BasePlanMateria[] = parsed.map(({ estadoUsuario: _e, ...rest }) => rest);
      const planData: UserPlanData = { careerName: name, materias: baseMaterias };

      await setDoc(userDoc(uid), { basePlan: planData, estados: {} });

      setCareerName(name);
      setHasCustomPlan(true);
      // Reiniciamos estados en local
      setMateriasState(parsed);
    },
    [uid]
  );

  /** Elimina el plan personalizado — el usuario deberá subir uno nuevo */
  const removePlan = useCallback(async () => {
    await setDoc(userDoc(uid), { basePlan: null, estados: {} });
    setMateriasState([]);
    setHasCustomPlan(false);
    setCareerName('');
  }, [uid]);

  return { materias, setMaterias, loading, hasCustomPlan, careerName, uploadPlan, removePlan };
}
