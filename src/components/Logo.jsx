export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tines del tenedor */}
      <line x1="13" y1="2" x2="13" y2="8"  stroke="white" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="10" stroke="white" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="19" y1="2" x2="19" y2="8"  stroke="white" strokeWidth="2"   strokeLinecap="round"/>
      {/* Arco del tenedor */}
      <path d="M13 8 C13 11.5 19 11.5 19 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      {/* Mango del tenedor */}
      <line x1="16" y1="11" x2="16" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Cuerpo de la caja */}
      <rect x="4" y="16" width="24" height="14" rx="2.5" stroke="white" strokeWidth="2"/>
      {/* Línea de tapa */}
      <line x1="4" y1="21" x2="28" y2="21" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}
