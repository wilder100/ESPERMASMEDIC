import { useEffect, useState, type FormEvent } from 'react'
import { supabase, recoveryFromUrl } from '../lib/supabase'

// Aparece cuando el usuario llega desde el enlace de "Olvidé mi contraseña".
export default function RecoveryGate() {
  const [active, setActive] = useState(recoveryFromUrl)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === 'PASSWORD_RECOVERY') setActive(true) })
    return () => data.subscription.unsubscribe()
  }, [])
  if (!active) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase!.auth.updateUser({ password: pw })
    if (error) { setMsg(error.message); return }
    setMsg('Contraseña actualizada.')
    setTimeout(() => setActive(false), 1200)
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6">
        <h2 className="font-serif text-2xl">Nueva contraseña</h2>
        <input type="password" minLength={6} required placeholder="Nueva contraseña (mínimo 6 caracteres)" value={pw} onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-lg border border-celeste-300 px-3 py-2" />
        {msg && <p className="text-sm" role="status">{msg}</p>}
        <button className="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-white">Guardar contraseña</button>
      </form>
    </div>
  )
}
