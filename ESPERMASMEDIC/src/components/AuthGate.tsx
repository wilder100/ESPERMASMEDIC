import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register' | 'forgot'

export default function AuthGate() {
  const [mode, setMode] = useState<Mode>(window.location.hash === '#registro' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true); setMsg('')
    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      setMsg(error ? error.message : 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.')
    } else {
      const { data, error } = mode === 'register'
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else if (mode === 'register' && !data.session) setMsg('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
    }
    setBusy(false)
  }

  const input = 'w-full rounded-lg border border-celeste-300 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-700'
  const titles = { login: 'Iniciar sesión', register: 'Crear cuenta', forgot: 'Recuperar contraseña' }
  const link = 'w-full text-sm text-navy-700 underline'
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded-2xl border border-celeste-300 bg-white p-6">
      <h2 className="font-serif text-2xl">{titles[mode]}</h2>
      <p className="text-sm text-navy-700/80">Necesitas una cuenta para resolver preguntas y guardar tu avance.</p>
      {mode === 'register' && <input className={input} placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />}
      <input className={input} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== 'forgot' && <input className={input} type="password" placeholder="Contraseña (mínimo 6 caracteres)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />}
      {msg && <p className="text-sm text-navy-800" role="alert">{msg}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
        {mode === 'forgot' ? 'Enviar enlace' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
      </button>
      {mode === 'login' && <button type="button" className={link} onClick={() => { setMode('forgot'); setMsg('') }}>¿Olvidaste tu contraseña?</button>}
      <button type="button" className={link} onClick={() => { setMode(mode === 'register' ? 'login' : mode === 'login' ? 'register' : 'login'); setMsg('') }}>
        {mode === 'login' ? 'Crear una cuenta nueva' : 'Volver a iniciar sesión'}
      </button>
    </form>
  )
}
