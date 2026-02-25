import { useState, useRef, useCallback, type DragEvent } from 'react';
import './PlanUpload.css';

interface PlanUploadProps {
  onUpload: (csvText: string, careerName: string) => Promise<void>;
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv');
      return;
    }
    setFile(f);
    setError(null);
    // Auto-fill carrera desde el nombre del archivo
    if (!careerName) {
      const name = f.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' ');
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
    if (!file) return setError('Seleccioná un archivo CSV primero');
    if (!careerName.trim()) return setError('Completá el nombre de la carrera');
    setSaving(true);
    setError(null);
    try {
      const text = await file.text();
      await onUpload(text, careerName.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir el plan');
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
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <>
                <span className="upload-file-icon">📄</span>
                <span className="upload-file-name">{file.name}</span>
                <span className="upload-file-sub">Clic para cambiar</span>
              </>
            ) : (
              <>
                <span className="upload-file-icon">☁️</span>
                <span className="upload-file-name">Arrastrá o hacé clic para seleccionar</span>
                <span className="upload-file-sub">.csv — Exportado del SIU o secretaría</span>
              </>
            )}
          </div>
        </div>

        {/* CSV format hint */}
        <details className="upload-hint">
          <summary>¿Cómo debe ser el CSV?</summary>
          <div className="upload-hint-body">
            <p>El archivo debe tener una fila de encabezado con las columnas:</p>
            <code>AÑO, CODIGO, MATERIA, NOTA, ESTADO</code>
            <p>La columna <strong>ESTADO</strong> puede tener <em>APROBADO</em> para marcar las ya rendidas.
            Las filas con <strong>AÑO</strong> en blanco se agrupan con el valor anterior.</p>
          </div>
        </details>

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
