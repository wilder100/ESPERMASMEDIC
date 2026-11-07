// Sonido de acierto. Si existe public/sounds/killpop.mp3 se usa ese archivo;
// si no, se genera un "pop" sintético con Web Audio (sin descargar nada).
let muted = localStorage.getItem('muted') === '1'
export const isMuted = () => muted
export function setMuted(v: boolean) { muted = v; localStorage.setItem('muted', v ? '1' : '0') }

function synthPop() {
  const ctx = new AudioContext()
  const t = ctx.currentTime
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1100, t)
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.09)
  gain.gain.setValueAtTime(0.6, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.15)
  osc.onended = () => ctx.close()
}

export function playCorrect() {
  if (muted) return
  const audio = new Audio('/sounds/killpop.mp3')
  audio.volume = 0.7
  audio.play().catch(() => { try { synthPop() } catch { /* sin audio */ } })
}
