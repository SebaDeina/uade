import { useState, useRef, useCallback, type DragEvent } from 'react';
import { parsePlanFromFile } from './utils/parsePlan';
import './PlanUpload.css';

interface PlanUploadProps {
  onUpload: (csvText: string, careerName: string, parsed?: import('./types').Materia[]) => Promise<void>;
  onClose?: () => void;
  /** Si true, muestra el modal como pantalla inicial completa */
  fullScreen?: boolean;
  userName?: string | null;
}

export default function PlanUpload({ onUpload, onClose, fullScreen, userName }: PlanUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [careerName, setCareerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notasDetected, setNotasDetected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!/\.(csv|xlsx|xls|ods)$/i.test(f.name)) {
      setError('Solo se aceptan archivos .csv, .xlsx o .xls');
      return;
    }
    setFile(f);
    setError(null);
    setNotasDetected(false);
    // Auto-fill carrera desde el nombre del archivo
    if (!careerName) {
      const name = f.name.replace(/\.(csv|xlsx|xls|ods)$/i, '').replace(/[_-]/g, ' ');
      setCareerName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [careerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async () => {
    if (!file) return setError('Seleccioná un archivo primero');
    if (!careerName.trim()) return setError('Completá el nombre de la carrera');
    setSaving(true);
    setError(null);
    try {
      const parsed = await parsePlanFromFile(file);
      if (parsed.length === 0) throw new Error('No se encontraron materias en el archivo');
      const hasNotas = parsed.some((m) => m.nota && m.nota.trim() !== '');
      setNotasDetected(hasNotas);
      // Convert back to text for the onUpload callback (which expects CSV text)
      // Instead, we bypass text conversion and call onUpload directly with the parsed data
      await onUpload(parsed.map((m) =>
        `${m.year},${m.codigo},${m.materia},${m.nota},${m.estado}`
      ).join('\n'), careerName.trim(), parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`upload-overlay ${fullScreen ? 'full-screen' : ''}`}>
      <div className="upload-card">
        {/* Header */}
        <div className="upload-header">
          <div className="upload-logo">UADE</div>
          <div>
            <h2 className="upload-title">
              {fullScreen ? 'Cargá tu plan de carrera' : 'Actualizar plan de carrera'}
            </h2>
            {fullScreen && userName && (
              <p className="upload-welcome">Hola {userName.split(' ')[0]} 👋</p>
            )}
          </div>
          {onClose && (
            <button className="upload-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
          )}
        </div>

        {fullScreen && (
          <p className="upload-desc">
            Subí el CSV de tu plan de estudios para empezar a registrar tu progreso.
            Podés exportarlo desde el SIU o pedirlo en secretaría.
          </p>
        )}

        {/* Step 1 – Carrera */}
        <div className="upload-section">
          <label className="upload-label" htmlFor="career-name">
            1. Nombre de la carrera
          </label>
          <input
            id="career-name"
            className="upload-input"
            type="text"
            placeholder="Ej: Negocios Digitales"
            value={careerName}
            onChange={(e) => setCareerName(e.target.value)}
          />
        </div>

        {/* Step 2 – Archivo */}
        <div className="upload-section">
          <span className="upload-label">2. Archivo CSV del plan</span>
          <div
            className={`upload-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label="Seleccionar archivo CSV"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.ods"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <>
                <span className="upload-file-icon">{/\.(xlsx|xls|ods)$/i.test(file.name) ? '📊' : '📄'}</span>
                <span className="upload-file-name">{file.name}</span>
                <span className="upload-file-sub">Clic para cambiar</span>
              </>
            ) : (
              <>
                <span className="upload-file-icon">☁️</span>
                <span className="upload-file-name">Arrastrá o hacé clic para seleccionar</span>
                <span className="upload-file-sub">.csv, .xlsx, .xls — SIU, Excel o secretaría</span>
              </>
            )}
          </div>
        </div>

        {/* CSV format hint */}
        <details className="upload-hint">
          <summary>¿Cómo debe ser el archivo?</summary>
          <div className="upload-hint-body">
            <p><strong>CSV:</strong> fila de encabezado con columnas:</p>
            <code>AÑO, CODIGO, MATERIA, NOTA, ESTADO</code>
            <p><strong>Excel (.xlsx/.xls):</strong> mismas columnas en la primera hoja.</p>
            <p>Si la columna <strong>NOTA</strong> tiene un número ≥ 4, la materia se marca como aprobada automáticamente.</p>
          </div>
        </details>

        {notasDetected && (
          <p className="upload-notas-ok">✓ Notas detectadas — se mostrarán en tu plan</p>
        )}
        {error && <p className="upload-error">{error}</p>}

        <div className="upload-actions">
          {onClose && (
            <button className="upload-btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
          )}
          <button
            className="upload-btn-primary"
            onClick={handleSubmit}
            disabled={saving || !file}
          >
            {saving ? 'Guardando...' : '✓ Cargar plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
