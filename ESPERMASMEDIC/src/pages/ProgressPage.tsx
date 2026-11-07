import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import AuthGate from '../components/AuthGate'
import StudentStats from '../components/StudentStats'

export default function ProgressPage() {
  const { session, loading } = useSession()
  if (!supabase) return <p className="rounded-xl bg-white p-5">Falta configurar Supabase en <code>.env.local</code>.</p>
  if (loading) return null
  if (!session) return <div className="space-y-6"><h1 className="font-serif text-3xl">Mi progreso</h1><AuthGate /></div>
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Mi progreso</h1>
          <p className="text-sm text-navy-700/80">{session.user.email}</p>
        </div>
        <button onClick={() => supabase!.auth.signOut()} className="text-sm underline">Cerrar sesión</button>
      </div>
      <StudentStats userId={session.user.id} />
    </div>
  )
}
