import './WhatsAppButton.css';

// ⚙️ Cambiá este número por el tuyo (formato internacional, sin + ni espacios)
const WSP_NUMBER = '5491100000000';
const WSP_MESSAGE = encodeURIComponent(
  '¡Hola! Tengo una idea/consulta sobre la app de Plan de Estudios UADE 🎓'
);

export default function WhatsAppButton() {
  return (
    <a
      className="wsp-fab"
      href={`https://wa.me/${WSP_NUMBER}?text=${WSP_MESSAGE}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      title="¿Tenés una idea o consulta? Escribinos"
    >
      {/* WhatsApp SVG official icon */}
      <svg viewBox="0 0 32 32" className="wsp-icon" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#25D366" />
        <path
          fill="#fff"
          d="M23.5 8.5A10.45 10.45 0 0 0 16 5.5 10.5 10.5 0 0 0 5.5 16a10.45 10.45 0 0 0 1.4 5.25L5.5 26.5l5.4-1.41A10.5 10.5 0 1 0 23.5 8.5zm-7.5 16.1a8.6 8.6 0 0 1-4.38-1.19l-.31-.19-3.2.84.85-3.12-.2-.32A8.62 8.62 0 1 1 16 24.6zm4.72-6.47c-.26-.13-1.53-.75-1.76-.84-.24-.09-.41-.13-.58.13s-.66.84-.81 1-.3.19-.55.06a7 7 0 0 1-2.06-1.27 7.73 7.73 0 0 1-1.43-1.78c-.15-.26 0-.4.11-.53s.26-.3.39-.46a1.72 1.72 0 0 0 .26-.43.48.48 0 0 0 0-.46c-.06-.13-.58-1.4-.8-1.91s-.42-.44-.58-.44h-.49a.94.94 0 0 0-.68.32 2.87 2.87 0 0 0-.9 2.13 5 5 0 0 0 1.05 2.64 11.43 11.43 0 0 0 4.38 3.86 14.93 14.93 0 0 0 1.46.54 3.51 3.51 0 0 0 1.61.1 2.63 2.63 0 0 0 1.73-1.22 2.14 2.14 0 0 0 .15-1.22c-.07-.1-.23-.16-.49-.28z"
        />
      </svg>
      <span className="wsp-label">Ideas / Consultas</span>
    </a>
  );
}
