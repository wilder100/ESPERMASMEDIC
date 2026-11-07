// Dibujo caricaturesco y pequeño que salta una vez y desaparece.
export default function SpermJump({ onDone }: { onDone: () => void }) {
  return (
    <div className="pointer-events-none fixed bottom-[22%] left-1/2 z-50" aria-hidden>
      <svg className="sperm-jump" width="64" height="32" viewBox="0 0 64 32" onAnimationEnd={onDone}>
        <g className="sperm-tail">
          <path d="M40 16 C33 6,26 26,19 16 S8 8,2 16" fill="none" stroke="#13315c" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <ellipse cx="50" cy="16" rx="12" ry="9" fill="#fff" stroke="#13315c" strokeWidth="2" />
        <circle cx="54" cy="13" r="1.8" fill="#13315c" />
        <path d="M52 19 q3 2 6 0" fill="none" stroke="#13315c" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
