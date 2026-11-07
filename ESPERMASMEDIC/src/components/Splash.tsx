import { useEffect, useState } from 'react'

// Bienvenida breve, una vez por sesión. Se puede saltar con un clic.
export default function Splash() {
  const [show, setShow] = useState(() => sessionStorage.getItem('splash') !== '1')
  const [out, setOut] = useState(false)
  const close = () => { sessionStorage.setItem('splash', '1'); setShow(false) }
  useEffect(() => {
    if (!show) return
    const a = setTimeout(() => setOut(true), 1900)
    const b = setTimeout(close, 2500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [show])
  if (!show) return null
  return (
    <div onClick={() => { setOut(true); setTimeout(close, 300) }} role="dialog" aria-label="Bienvenida"
      className={`fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-6 bg-navy-950 px-6 text-center text-white transition-opacity duration-500 ${out ? 'opacity-0' : 'opacity-100'}`}>
      <img src="/logo.jpg" alt="Logo de Espermas Medic Academy" className="fade-up h-40 w-40 rounded-full bg-white p-1" />
      <h1 className="fade-up font-serif text-4xl font-medium sm:text-5xl" style={{ animationDelay: '.25s' }}>Espermas Medic Academy</h1>
    </div>
  )
}
