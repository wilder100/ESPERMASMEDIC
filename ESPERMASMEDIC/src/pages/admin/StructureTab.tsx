import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { TreeCourse } from '../../lib/useAdminData'

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const btn = 'text-sm underline'

export default function StructureTab({ tree, reload }: { tree: TreeCourse[]; reload: () => void }) {
  const [msg, setMsg] = useState('')
  const [name, setName] = useState('')
  const [area, setArea] = useState<'basicas' | 'clinicas'>('basicas')

  async function run(p: PromiseLike<{ error: { message: string } | null }>, courses = false) {
    const { error } = await p
    setMsg(error?.message ?? '')
    if (!error) { await reload(); if (courses) window.dispatchEvent(new Event('courses-changed')) }
  }
  const ask = (label: string, initial = '') => window.prompt(label, initial)?.trim() || null
  const del = (what: string) => window.confirm(`¿Eliminar ${what}? Se borrarán también las preguntas que contiene.`)

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm text-rose-700" role="alert">{msg}</p>}
      <form className="flex flex-wrap gap-2" onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        run(supabase!.from('courses').insert({ name: name.trim(), slug: slugify(name), area, sort_order: tree.length + 1 }), true)
        setName('')
      }}>
        <input className="rounded-lg border border-celeste-300 bg-white px-3 py-2" placeholder="Nuevo curso" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded-lg border border-celeste-300 bg-white px-3 py-2" value={area} onChange={(e) => setArea(e.target.value as 'basicas' | 'clinicas')} aria-label="Área">
          <option value="basicas">Ciencias básicas</option><option value="clinicas">Ciencias clínicas</option>
        </select>
        <button className="rounded-lg bg-navy-900 px-4 py-2 font-semibold text-white">Crear curso</button>
      </form>

      {tree.map((c) => (
        <section key={c.id} className="rounded-2xl border border-celeste-300 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">{c.name}</h3>
            <button className={btn} onClick={() => { const n = ask('Nuevo nombre del curso', c.name); if (n) run(supabase!.from('courses').update({ name: n }).eq('id', c.id), true) }}>Renombrar</button>
            <button className={btn} onClick={() => { const n = ask('Nombre de la unidad'); if (n) run(supabase!.from('units').insert({ course_id: c.id, name: n, sort_order: c.units.length + 1 })) }}>+ Unidad</button>
            <button className={`${btn} text-rose-700`} onClick={() => del(`el curso ${c.name}`) && run(supabase!.from('courses').delete().eq('id', c.id), true)}>Eliminar</button>
          </div>
          {c.units.map((u) => (
            <div key={u.id} className="ml-4 mt-3 border-l border-celeste-300 pl-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-medium">{u.name}</p>
                <button className={btn} onClick={() => { const n = ask('Nuevo nombre de la unidad', u.name); if (n) run(supabase!.from('units').update({ name: n }).eq('id', u.id)) }}>Renombrar</button>
                <button className={btn} onClick={() => { const n = ask('Nombre del tema'); if (n) run(supabase!.from('topics').insert({ unit_id: u.id, name: n })) }}>+ Tema</button>
                <button className={`${btn} text-rose-700`} onClick={() => del(`la unidad ${u.name}`) && run(supabase!.from('units').delete().eq('id', u.id))}>Eliminar</button>
              </div>
              <ul className="mt-1 space-y-1">
                {u.topics.map((t) => (
                  <li key={t.id} className="ml-4 flex flex-wrap items-center gap-3 text-sm">
                    <span>{t.name}</span>
                    <button className={btn} onClick={() => { const n = ask('Nuevo nombre del tema', t.name); if (n) run(supabase!.from('topics').update({ name: n }).eq('id', t.id)) }}>Editar</button>
                    <button className={`${btn} text-rose-700`} onClick={() => del(`el tema ${t.name}`) && run(supabase!.from('topics').delete().eq('id', t.id))}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
