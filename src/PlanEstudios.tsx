import { useMemo, useState } from 'react';
import { CORRELATIVAS } from './data/correlativas';
import { getNombreOptativa } from './data/optativas';
import type { Materia } from './types';
import { useUserPlan } from './hooks/useUserPlan';
import { useAuth } from './AuthContext';
import PlanUpload from './PlanUpload';
import './PlanEstudios.css';

const AÑOS_LABELS = ['Primer', 'Segundo', 'Tercer', 'Cuarto'] as const;

const DIAGRAM_ROW_HEIGHT = 80;
const DIAGRAM_NODE_WIDTH = 200;
const DIAGRAM_NODE_HEIGHT = 52;
const DIAGRAM_GAP = 14;
const DIAGRAM_LABEL_WIDTH = 100;

/** Para cada "año de pantalla" (1-4), devuelve [materias 1er cuat, materias 2do cuat].
 * Origen: CSV año 1 = 1er cuat Primer Año, año 2 = 2do cuat Primer Año; año 3/4 se parten en dos. */
function getMateriasPorAñoYCuat(
  byYear: Record<number, Materia[]>
): { 1: Materia[]; 2: Materia[] }[] {
  const y1 = byYear[1] ?? [];
  const y2 = byYear[2] ?? [];
  const y3 = byYear[3] ?? [];
  const y4 = byYear[4] ?? [];
  return [
    { 1: y1, 2: y2 },
    { 1: y3.slice(0, 5), 2: y4.slice(0, 5) },
    { 1: y3.slice(5, 10), 2: y3.slice(10, 15) },
    { 1: y4.slice(5, 10), 2: y4.slice(10, 15) },
  ];
}

function getPrereqsMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [from, to] of CORRELATIVAS) {
    const f = from.trim();
    const t = to.trim();
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(f);
  }
  return map;
}

function isCursable(materia: Materia, aprobadasSet: Set<string>, prereqs: Map<string, string[]>): boolean {
  const prereqList = prereqs.get(materia.materia.trim());
  if (!prereqList || prereqList.length === 0) return true;
  return prereqList.every((p) => aprobadasSet.has(p));
}

function MateriaRow({
  m,
  aprobadasSet,
  prereqs,
  cycleEstado,
}: {
  m: Materia;
  aprobadasSet: Set<string>;
  prereqs: Map<string, string[]>;
  cycleEstado: (id: string) => void;
}) {
  const cursable = isCursable(m, aprobadasSet, prereqs);
  const hasPrereqs = (prereqs.get(m.materia.trim())?.length ?? 0) > 0;
  const showCursable = cursable && (m.estadoUsuario === 'pendiente' || m.estadoUsuario === 'recursar') && hasPrereqs;
  const displayName = getNombreOptativa(m.materia);

  const statusLabel: Record<string, string> = {
    aprobada: 'APROBADA',
    regular: 'REGULAR',
    final_previo: 'FINAL PREVIO',
    recursar: 'RECURSAR',
  };

  const showStatus = m.estadoUsuario !== 'pendiente' || showCursable;

  return (
    <button
      type="button"
      className={`plan-materia-row ${m.estadoUsuario} ${showCursable ? 'cursable' : ''}`}
      onClick={() => cycleEstado(m.id)}
      title="Clic: Regular → Final Previo → Aprobada → Recursar → Reiniciar"
    >
      <span className="plan-materia-name">{displayName}</span>
      {showStatus && (
        <span className="plan-materia-status">
          {showCursable && m.estadoUsuario === 'pendiente' ? 'PUEDO CURSAR' :
           showCursable && m.estadoUsuario === 'recursar' ? 'PUEDO CURSAR' :
           statusLabel[m.estadoUsuario] ?? ''}
        </span>
      )}
    </button>
  );
}

export default function PlanEstudios({ uid }: { uid: string }) {
  const { materias, setMaterias, loading, hasCustomPlan, careerName, uploadPlan } = useUserPlan(uid);
  const { signOut, user } = useAuth();
  const [error] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const cycleEstado = (id: string) => {
    const next: Record<string, 'pendiente' | 'regular' | 'final_previo' | 'aprobada' | 'recursar'> = {
      pendiente: 'regular',
      regular: 'final_previo',
      final_previo: 'aprobada',
      aprobada: 'recursar',
      recursar: 'pendiente',
    };
    setMaterias((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, estadoUsuario: next[m.estadoUsuario] ?? 'pendiente' } : m
      )
    );
  };

  const aprobadasSet = useMemo(() => {
    const s = new Set<string>();
    materias
      // recursar = no cursada, por lo que NO cuenta para habilitar correlativas
      .filter((m) => m.estadoUsuario === 'regular' || m.estadoUsuario === 'final_previo' || m.estadoUsuario === 'aprobada')
      .forEach((m) => s.add(m.materia.trim()));
    return s;
  }, [materias]);

  const prereqs = useMemo(() => getPrereqsMap(), []);

  const materiasByYear = useMemo(() => {
    const byYear: Record<number, Materia[]> = { 1: [], 2: [], 3: [], 4: [] };
    materias.forEach((m) => {
      if (byYear[m.year]) byYear[m.year].push(m);
    });
    return byYear;
  }, [materias]);

  const secciones = useMemo(
    () => getMateriasPorAñoYCuat(materiasByYear),
    [materiasByYear]
  );

  const totalMaterias = materias.length;
  const aprobadasCount = materias.filter((m) => m.estadoUsuario === 'aprobada').length;
  const faltantes = totalMaterias - aprobadasCount;
  const puedoCursar = useMemo(() => {
    return materias.filter(
      (m) =>
        (m.estadoUsuario === 'pendiente' || m.estadoUsuario === 'recursar') &&
        isCursable(m, aprobadasSet, prereqs)
    );
  }, [materias, aprobadasSet, prereqs]);

  const diagramPosMap = useMemo(() => {
    const pos = new Map<string, { rowIndex: number; colIndex: number }>();
    secciones.forEach((cuats, rowIdx) => {
      const list = [...cuats[1], ...cuats[2]];
      list.forEach((m, colIdx) => pos.set(m.materia.trim(), { rowIndex: rowIdx, colIndex: colIdx }));
    });
    return pos;
  }, [secciones]);

  const diagramMaxCols = useMemo(() => {
    return Math.max(
      ...secciones.map((c) => c[1].length + c[2].length),
      1
    );
  }, [secciones]);

  const diagramWidth =
    DIAGRAM_LABEL_WIDTH +
    DIAGRAM_GAP +
    diagramMaxCols * (DIAGRAM_NODE_WIDTH + DIAGRAM_GAP) +
    DIAGRAM_GAP;
  const diagramHeight = 4 * DIAGRAM_ROW_HEIGHT;

  const nodeCenterOffsetY =
    (DIAGRAM_ROW_HEIGHT - DIAGRAM_NODE_HEIGHT) / 2 + DIAGRAM_NODE_HEIGHT;
  const nodeTopOffsetY = (DIAGRAM_ROW_HEIGHT - DIAGRAM_NODE_HEIGHT) / 2;

  const diagramArrows = useMemo(() => {
    const out: { from: { x: number; y: number }; to: { x: number; y: number }; fromName: string; toName: string }[] = [];
    const nodeStartX = DIAGRAM_LABEL_WIDTH + DIAGRAM_GAP;
    for (const [fromName, toName] of CORRELATIVAS) {
      const fromPos = diagramPosMap.get(fromName);
      const toPos = diagramPosMap.get(toName);
      if (!fromPos || !toPos) continue;
      const fromX =
        nodeStartX +
        fromPos.colIndex * (DIAGRAM_NODE_WIDTH + DIAGRAM_GAP) +
        DIAGRAM_NODE_WIDTH / 2;
      const fromY =
        fromPos.rowIndex * DIAGRAM_ROW_HEIGHT + nodeCenterOffsetY;
      const toX =
        nodeStartX +
        toPos.colIndex * (DIAGRAM_NODE_WIDTH + DIAGRAM_GAP) +
        DIAGRAM_NODE_WIDTH / 2;
      const toY = toPos.rowIndex * DIAGRAM_ROW_HEIGHT + nodeTopOffsetY;
      out.push({ from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, fromName, toName });
    }
    return out;
  }, [diagramPosMap, nodeCenterOffsetY, nodeTopOffsetY]);

  // Hover highlight: set of materia names related to hovered node
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set());

  const handleNodeHover = (materiaName: string) => {
    const related = new Set<string>();
    related.add(materiaName);
    // prereqs of this node
    const prereqList = prereqs.get(materiaName) ?? [];
    prereqList.forEach((p) => related.add(p));
    // nodes that require this node
    for (const [from, to] of CORRELATIVAS) {
      if (from === materiaName) related.add(to);
      if (to === materiaName) related.add(from);
    }
    setHighlightSet(related);
  };

  const handleNodeLeave = () => setHighlightSet(new Set());

  if (loading) return <div className="plan-loading">Cargando plan de estudios...</div>;
  if (error)   return <div className="plan-error">Error: {error}</div>;

  // Si el usuario nunca cargó su plan, mostramos la pantalla de carga completa
  if (!hasCustomPlan && materias.length === 0) {
    return (
      <PlanUpload
        fullScreen
        userName={user?.displayName}
        onUpload={uploadPlan}
      />
    );
  }

  return (
    <div className="plan-estudios">
      {showUpload && (
        <PlanUpload
          onUpload={async (text, name) => { await uploadPlan(text, name); setShowUpload(false); }}
          onClose={() => setShowUpload(false)}
        />
      )}
      <header className="plan-header">
        <div className="plan-header-top">
          <div className="plan-header-title">
            <h1>{careerName || 'Plan de Estudios'}</h1>
          </div>
          <div className="plan-user-info">
            {user?.photoURL && (
              <img src={user.photoURL} alt={user.displayName ?? ''} className="plan-user-avatar" />
            )}
            <span className="plan-user-name">{user?.displayName ?? user?.email}</span>
            <button
              className="plan-change-plan-btn"
              onClick={() => setShowUpload(true)}
              title="Cambiar plan de carrera"
            >📄</button>
            <button className="plan-logout-btn" onClick={signOut}>Salir</button>
          </div>
        </div>
        <h2 className="plan-subtitle">Malla curricular — Correlativas</h2>
        <div className="plan-legend">
          <span className="plan-legend-clicks">Click para cambiar estado</span>
          <div className="plan-legend-boxes">
            <span className="plan-legend-item pendiente"><i /></span> Pendiente
            <span className="plan-legend-item regular"><i /></span> Regular
            <span className="plan-legend-item final_previo"><i /></span> Final Previo
            <span className="plan-legend-item aprobada"><i /></span> Aprobada
            <span className="plan-legend-item recursar"><i /></span> Recursar
            <span className="plan-legend-item cursable"><i /></span> Puedo cursar
          </div>
        </div>
      </header>

      <section className="plan-resumen" aria-label="Resumen del plan">
        <div className="plan-resumen-grid">
          <div className="plan-resumen-caja">
            <span className="plan-resumen-num">{aprobadasCount}</span>
            <span className="plan-resumen-label">de {totalMaterias} materias aprobadas</span>
          </div>
          <div className="plan-resumen-caja">
            <span className="plan-resumen-num">{faltantes}</span>
            <span className="plan-resumen-label">te faltan para recibirte</span>
          </div>
          <div className="plan-resumen-caja destacada">
            <span className="plan-resumen-num">{puedoCursar.length}</span>
            <span className="plan-resumen-label">materias a las que te podés anotar ahora</span>
            {puedoCursar.length > 0 && (
              <ul className="plan-resumen-lista">
                {puedoCursar.slice(0, 8).map((m) => (
                  <li key={m.id}>{getNombreOptativa(m.materia)}</li>
                ))}
                {puedoCursar.length > 8 && <li className="plan-resumen-mas">+{puedoCursar.length - 8} más</li>}
              </ul>
            )}
          </div>
        </div>
      </section>

      <main className="plan-malla">
        {secciones.map((cuats, idx) => (
          <section key={idx} className="plan-año">
            <h3 className="plan-año-titulo">{AÑOS_LABELS[idx]} Año</h3>
            <div className="plan-año-linea" />
            <div className="plan-año-columnas">
              <div className="plan-cuatrimestre">
                <h4 className="plan-cuatrimestre-titulo">Primer Cuatrimestre</h4>
                <ul className="plan-materia-list">
                  {cuats[1].map((m) => (
                    <li key={m.id}>
                      <MateriaRow
                        m={m}
                        aprobadasSet={aprobadasSet}
                        prereqs={prereqs}
                        cycleEstado={cycleEstado}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="plan-cuatrimestre">
                <h4 className="plan-cuatrimestre-titulo">Segundo Cuatrimestre</h4>
                <ul className="plan-materia-list">
                  {cuats[2].map((m) => (
                    <li key={m.id}>
                      <MateriaRow
                        m={m}
                        aprobadasSet={aprobadasSet}
                        prereqs={prereqs}
                        cycleEstado={cycleEstado}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {idx === 2 && (
              <>
                <div className="plan-año-linea" />
                <div className="plan-titulo-caja">Técnico/a Universitario/a en Negocios Digitales</div>
              </>
            )}
            {idx === 3 && (
              <>
                <div className="plan-año-linea" />
                <div className="plan-titulo-caja">Licenciado/a en Negocios Digitales</div>
              </>
            )}
          </section>
        ))}
      </main>

      <section className="plan-correlativas" aria-label="Diagrama de correlativas">
        <h3 className="plan-correlativas-titulo">Correlativas</h3>
        <p className="plan-correlativas-texto">
          Las flechas van de la materia requisito hacia la que podés cursar.
          <strong> Pasá el dedo/cursor</strong> sobre una materia para ver sus conexiones.
        </p>
        <div className="plan-diagram-scroll">
          <div
            className="plan-diagram"
            style={{ width: diagramWidth, height: diagramHeight }}
          >
            <svg className="plan-diagram-arrows" width={diagramWidth} height={diagramHeight}>
              <defs>
                <marker
                  id="arrowhead-down"
                  markerWidth="8"
                  markerHeight="6"
                  refX="4"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="var(--arrow-color)" />
                </marker>
                <marker
                  id="arrowhead-down-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="4"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
                </marker>
              </defs>
              {diagramArrows.map((arr, i) => {
                const startY = arr.from.y + 2;
                const endY = arr.to.y - 2;
                const midY = (startY + endY) / 2;
                const path = `M ${arr.from.x} ${startY} C ${arr.from.x} ${midY}, ${arr.to.x} ${midY}, ${arr.to.x} ${endY}`;
                const isActive = highlightSet.size > 0 &&
                  highlightSet.has(arr.fromName) && highlightSet.has(arr.toName);
                return (
                  <path
                    key={i}
                    d={path}
                    fill="none"
                    stroke={isActive ? 'var(--accent)' : 'var(--arrow-color)'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeOpacity={highlightSet.size > 0 && !isActive ? 0.15 : 1}
                    markerEnd={isActive ? 'url(#arrowhead-down-active)' : 'url(#arrowhead-down)'}
                  />
                );
              })}
            </svg>
            {secciones.map((cuats, rowIdx) => (
              <div
                key={rowIdx}
                className="plan-diagram-row"
                style={{ top: rowIdx * DIAGRAM_ROW_HEIGHT, height: DIAGRAM_ROW_HEIGHT }}
              >
                <span className="plan-diagram-year">{AÑOS_LABELS[rowIdx]}<br />Año</span>
                <div className="plan-diagram-nodes">
                  {[...cuats[1], ...cuats[2]].map((m) => {
                    const cursable = isCursable(m, aprobadasSet, prereqs);
                    const showCursable =
                      cursable &&
                      (m.estadoUsuario === 'pendiente' || m.estadoUsuario === 'recursar') &&
                      (prereqs.get(m.materia.trim())?.length ?? 0) > 0;
                    const name = m.materia.trim();
                    const isActive = highlightSet.has(name);
                    const isDimmed = highlightSet.size > 0 && !isActive;
                    const isPrereq = highlightSet.size > 0 && isActive &&
                      [...highlightSet].some((h) => h !== name &&
                        CORRELATIVAS.some(([f, t]) => f === name && t === [...highlightSet].find(x => x !== name)));
                    void isPrereq;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={[
                          'plan-diagram-node',
                          m.estadoUsuario,
                          showCursable ? 'cursable' : '',
                          isActive ? 'node-active' : '',
                          isDimmed ? 'node-dimmed' : '',
                        ].join(' ')}
                        onClick={() => cycleEstado(m.id)}
                        onMouseEnter={() => handleNodeHover(name)}
                        onMouseLeave={handleNodeLeave}
                        onFocus={() => handleNodeHover(name)}
                        onBlur={handleNodeLeave}
                        style={{
                          width: DIAGRAM_NODE_WIDTH,
                          minWidth: DIAGRAM_NODE_WIDTH,
                          height: DIAGRAM_NODE_HEIGHT,
                        }}
                      >
                        <span className="plan-diagram-node-text">{getNombreOptativa(m.materia)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
