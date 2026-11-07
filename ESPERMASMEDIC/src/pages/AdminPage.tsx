import { useState } from 'react'
import { useProfile, useTree } from '../lib/useAdminData'
import { supabase } from '../lib/supabase'
import AuthGate from '../components/AuthGate'
import QuestionsTab from './admin/QuestionsTab'
import StructureTab from './admin/StructureTab'
import ImportTab from './admin/ImportTab'
import StatsTab from './admin/StatsTab'

const tabs = ['Preguntas', 'Cursos y temas', 'Importar', 'Estadísticas'] as const

export default function AdminPage() {
  const { session, role, ready } = useProfile()
  const { tree, reload } = useTree()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Preguntas')

  if (!supabase) return <p className="rounded-xl bg-white p-5">Falta configurar Supabase en <code>.env.local</code>.</p>
  if (!ready) return null
  if (!session) return <AuthGate />
  if (role !== 'admin') return <p className="rounded-xl border border-celeste-300 bg-white p-5">No tienes permisos de administrador.</p>

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Administración</h1>
      <div className="flex flex-wrap gap-1 border-b border-celeste-300" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-navy-900' : 'border-transparent text-navy-700/70 hover:text-navy-900'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Preguntas' && <QuestionsTab tree={tree} />}
      {tab === 'Cursos y temas' && <StructureTab tree={tree} reload={reload} />}
      {tab === 'Importar' && <ImportTab tree={tree} reload={reload} />}
      {tab === 'Estadísticas' && <StatsTab tree={tree} />}
    </div>
  )
}
