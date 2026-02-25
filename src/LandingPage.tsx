import { useState } from 'react';
import { useAuth } from './AuthContext';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📋',
    title: 'Seguí tu progreso',
    desc: 'Marcá cada materia como Regular, Final Previo, Aprobada o Recursar con un toque. Ves al instante cuántas te quedan para recibirte.',
  },
  {
    icon: '🔗',
    title: 'Correlativas visuales',
    desc: 'Diagrama interactivo que muestra qué materias desbloqueás al aprobar. Tocá cualquier nodo para ver sus conexiones.',
  },
  {
    icon: '☁️',
    title: 'Tu progreso en la nube',
    desc: 'Iniciá sesión con Google y accedé desde cualquier dispositivo. Tu plan se sincroniza automáticamente.',
  },
  {
    icon: '📄',
    title: 'Cualquier carrera',
    desc: 'Subí el CSV de tu plan de estudios y la app detecta las materias, el título intermedio y el título final.',
  },
];

const STEPS = [
  { n: '1', label: 'Iniciá sesión con Google' },
  { n: '2', label: 'Subí el CSV de tu plan de carrera' },
  { n: '3', label: 'Marcá materias a medida que avanzás' },
];

export default function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try { await signInWithGoogle(); } finally { setLoading(false); }
  };

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo-row">
            <span className="landing-logo-badge">UADE</span>
            <span className="landing-logo-label">Plan de Estudios</span>
          </div>
          <button className="landing-nav-cta" onClick={handleLogin} disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">Gratis · Sin publicidad</div>
          <h1 className="landing-hero-title">
            Tu plan de estudios,<br />
            <span className="landing-hero-accent">siempre a mano</span>
          </h1>
          <p className="landing-hero-sub">
            Seguí el avance de tu carrera, visualizá correlativas y saber en todo momento
            a qué materias te podés anotar. Funciona con cualquier carrera de la UADE.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary" onClick={handleLogin} disabled={loading}>
              <GoogleIcon />
              {loading ? 'Iniciando...' : 'Empezar con Google'}
            </button>
            <a href="#como-funciona" className="landing-btn-ghost">Cómo funciona ↓</a>
          </div>

          {/* Mini preview card */}
          <div className="landing-preview">
            <div className="landing-preview-header">
              <span className="landing-preview-dot red" />
              <span className="landing-preview-dot yellow" />
              <span className="landing-preview-dot green" />
              <span className="landing-preview-title">Negocios Digitales</span>
            </div>
            <div className="landing-preview-stats">
              <div className="landing-preview-stat">
                <span className="landing-preview-num total">32</span>
                <span className="landing-preview-label">materias</span>
              </div>
              <div className="landing-preview-stat">
                <span className="landing-preview-num aprobadas">18</span>
                <span className="landing-preview-label">aprobadas</span>
              </div>
              <div className="landing-preview-stat">
                <span className="landing-preview-num restantes">14</span>
                <span className="landing-preview-label">restantes</span>
              </div>
              <div className="landing-preview-stat cursables">
                <span className="landing-preview-num cursable">5</span>
                <span className="landing-preview-label">podés cursar</span>
              </div>
            </div>
            <div className="landing-preview-materias">
              {[
                ['MATEMÁTICA EMPRESARIAL I', 'aprobada'],
                ['ADMINISTRACIÓN EMPRESARIAL I', 'aprobada'],
                ['ESTADÍSTICA EMPRESARIAL I', 'regular'],
                ['TALLER DE PROGRAMACIÓN I', 'final_previo'],
                ['CONTABILIDAD I', 'pendiente'],
                ['MARKETING', 'cursable'],
              ].map(([name, estado]) => (
                <div key={name} className={`landing-preview-row ${estado}`}>
                  <span className="landing-preview-row-name">{name}</span>
                  <span className="landing-preview-row-badge">
                    {estado === 'aprobada' && 'APROBADA'}
                    {estado === 'regular' && 'REGULAR'}
                    {estado === 'final_previo' && 'FINAL PREVIO'}
                    {estado === 'cursable' && 'PUEDO CURSAR'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Todo lo que necesitás</h2>
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <span className="landing-feature-icon">{f.icon}</span>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESTADOS ── */}
      <section className="landing-estados">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">5 estados para cada materia</h2>
          <p className="landing-section-sub">Un toque cambia el estado. Todo se guarda automáticamente.</p>
          <div className="landing-estados-list">
            {[
              { key: 'pendiente',    label: 'Pendiente',    desc: 'Todavía no la cursaste' },
              { key: 'regular',     label: 'Regular',      desc: 'Cursada, final pendiente' },
              { key: 'final_previo',label: 'Final Previo', desc: 'Habilita correlativas' },
              { key: 'aprobada',    label: 'Aprobada',     desc: 'Materia completa ✓' },
              { key: 'recursar',    label: 'Recursar',     desc: 'Empezás de cero' },
            ].map((e) => (
              <div key={e.key} className={`landing-estado-chip ${e.key}`}>
                <span className="landing-estado-label">{e.label}</span>
                <span className="landing-estado-desc">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="landing-como" id="como-funciona">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Tres pasos para empezar</h2>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className="landing-step">
                <div className="landing-step-num">{s.n}</div>
                {i < STEPS.length - 1 && <div className="landing-step-line" />}
                <p className="landing-step-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="landing-cta-final">
        <div className="landing-section-inner">
          <h2 className="landing-cta-title">¿Listo para organizarte?</h2>
          <p className="landing-cta-sub">Gratis, sin publicidad, sin instalación.</p>
          <button className="landing-btn-primary large" onClick={handleLogin} disabled={loading}>
            <GoogleIcon />
            {loading ? 'Iniciando...' : 'Entrar con Google'}
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <p>Diseñado para estudiantes de la UADE · <a href="https://github.com/SebaDeina/uade" target="_blank" rel="noreferrer">GitHub</a></p>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="landing-google-icon" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
