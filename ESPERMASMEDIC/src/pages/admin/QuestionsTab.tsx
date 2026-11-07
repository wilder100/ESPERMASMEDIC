import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { TreeCourse } from '../../lib/useAdminData'
import { LETTERS, type Letter } from '../../types'

interface Row {
  id: string; topic_id: string; statement: string; correct: Letter; explanation: string
  wrong_explanations: Partial<Record<Letter, string>>; image_url: string | null
  difficulty: 'baja' | 'media' | 'alta'; is_active: boolean
  option_a: string; option_b: string; option_c: string; option_d: string; option_e: string
}
interface Form {
  id?: string; topic_id: string; statement: string; opts: Record<Letter, string>; correct: Letter
  explanation: string; wrong: Record<Letter, string>; difficulty: Row['difficulty']; image_url: string | null; is_active: boolean
}
const blank: Record<Letter, string> = { A: '', B: '', C: '', D: '', E: '' }
const empty: Form = { topic_id: '', statement: '', opts: blank, correct: 'A', explanation: '', wrong: blank, difficulty: 'alta', image_url: null, is_active: true }
const inp = 'w-full rounded-lg border border-celeste-300 bg-white px-3 py-2'

function toForm(r: Row): Form {
  return {
    id: r.id, topic_id: r.topic_id, statement: r.statement, correct: r.correct, explanation: r.explanation,
    opts: { A: r.option_a, B: r.option_b, C: r.option_c, D: r.option_d, E: r.option_e },
    wrong: { ...blank, ...r.wrong_explanations } as Record<Letter, string>,
    difficulty: r.difficulty, image_url: r.image_url, is_active: r.is_active,
  }
}

export default function QuestionsTab({ tree }: { tree: TreeCourse[] }) {
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [courseId, setCourseId] = useState('todos')
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('questions').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) setMsg(error.message); else setRows(data as Row[])
  }, [])
  useEffect(() => { load() }, [load])

  const topicInfo = useMemo(() => {
    const m = new Map<string, { course: string; courseId: string; unit: string; topic: string }>()
    tree.forEach((c) => c.units.forEach((u) => u.topics.forEach((t) => m.set(t.id, { course: c.name, courseId: c.id, unit: u.name, topic: t.name }))))
    return m
  }, [tree])

  const shown = rows.filter((r) => (courseId === 'todos' || topicInfo.get(r.topic_id)?.courseId === courseId)
    && r.statement.toLowerCase().includes(q.toLowerCase()))

  async function upload(file: File) {
    if (!form) return
    if (!file.type.startsWith('image/') || file.size > 2_000_000) { setMsg('La imagen debe pesar menos de 2 MB.'); return }
    const path = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const { error } = await supabase!.storage.from('question-images').upload(path, file)
    if (error) { setMsg(error.message); return }
    setForm({ ...form, image_url: supabase!.storage.from('question-images').getPublicUrl(path).data.publicUrl })
  }

  async function save() {
    if (!form) return
    const missing = !form.topic_id || !form.statement.trim() || !form.explanation.trim() || LETTERS.some((l) => !form.opts[l].trim())
    if (missing) { setMsg('Completa el tema, el enunciado, las 5 alternativas y la explicación.'); return }
    setBusy(true); setMsg('')
    const payload = {
      topic_id: form.topic_id, statement: form.statement.trim(),
      option_a: form.opts.A.trim(), option_b: form.opts.B.trim(), option_c: form.opts.C.trim(), option_d: form.opts.D.trim(), option_e: form.opts.E.trim(),
      correct: form.correct, explanation: form.explanation.trim(),
      wrong_explanations: Object.fromEntries(LETTERS.filter((l) => l !== form.correct && form.wrong[l].trim()).map((l) => [l, form.wrong[l].trim()])),
      image_url: form.image_url, difficulty: form.difficulty, is_active: form.is_active,
    }
    const { error } = form.id
      ? await supabase!.from('questions').update(payload).eq('id', form.id)
      : await supabase!.from('questions').insert({ ...payload, source: 'Panel admin' })
    setBusy(false)
    if (error) { setMsg(error.message); return }
    setForm(null); load()
  }

  async function remove(r: Row) {
    if (!window.confirm('¿Eliminar esta pregunta? También se borran los intentos asociados.')) return
    const { error } = await supabase!.from('questions').delete().eq('id', r.id)
    if (error) setMsg(error.message); else load()
  }

  if (form) {
    const set = (p: Partial<Form>) => setForm({ ...form, ...p })
    return (
      <div className="space-y-4 rounded-2xl border border-celeste-300 bg-white p-5">
        <h2 className="font-serif text-xl">{form.id ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
        <select className={inp} value={form.topic_id} onChange={(e) => set({ topic_id: e.target.value })} aria-label="Tema">
          <option value="">Elige curso · unidad · tema</option>
          {tree.map((c) => c.units.map((u) => (
            <optgroup key={u.id} label={`${c.name} · ${u.name}`}>{u.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
          )))}
        </select>
        <textarea className={inp} rows={4} placeholder="Enunciado" value={form.statement} onChange={(e) => set({ statement: e.target.value })} />
        {LETTERS.map((l) => (
          <div key={l} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr] sm:items-start">
            <label className="flex items-center gap-2 pt-2 text-sm font-semibold">
              <input type="radio" name="correct" checked={form.correct === l} onChange={() => set({ correct: l })} /> {l} {form.correct === l && '(correcta)'}
            </label>
            <textarea className={inp} rows={2} placeholder={`Alternativa ${l}`} value={form.opts[l]} onChange={(e) => set({ opts: { ...form.opts, [l]: e.target.value } })} />
            <textarea className={inp} rows={2} disabled={form.correct === l} placeholder={form.correct === l ? '—' : `Por qué ${l} es incorrecta`}
              value={form.wrong[l]} onChange={(e) => set({ wrong: { ...form.wrong, [l]: e.target.value } })} />
          </div>
        ))}
        <textarea className={inp} rows={4} placeholder="Explicación de la respuesta correcta" value={form.explanation} onChange={(e) => set({ explanation: e.target.value })} />
        <div className="flex flex-wrap items-center gap-4">
          <select className={`${inp} w-auto`} value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value as Form['difficulty'] })} aria-label="Dificultad">
            <option value="baja">Dificultad baja</option><option value="media">Dificultad media</option><option value="alta">Dificultad alta</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} /> Activa (visible para estudiantes)</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} aria-label="Subir imagen" />
        </div>
        {form.image_url && (
          <div className="flex items-end gap-3"><img src={form.image_url} alt="" className="max-h-40 rounded-lg" />
            <button onClick={() => set({ image_url: null })} className="text-sm underline">Quitar imagen</button></div>
        )}
        {msg && <p className="text-sm text-rose-700" role="alert">{msg}</p>}
        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="rounded-lg bg-navy-900 px-5 py-2 font-semibold text-white disabled:opacity-60">Guardar</button>
          <button onClick={() => { setForm(null); setMsg('') }} className="rounded-lg border border-celeste-300 px-5 py-2">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setForm(empty)} className="rounded-lg bg-navy-900 px-4 py-2 font-semibold text-white">Nueva pregunta</button>
        <select className={`${inp} w-auto`} value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Curso">
          <option value="todos">Todos los cursos</option>{tree.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className={`${inp} w-auto flex-1`} placeholder="Buscar en el enunciado" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {msg && <p className="text-sm text-rose-700" role="alert">{msg}</p>}
      <p className="text-sm text-navy-700/80">{shown.length} preguntas</p>
      <ul className="space-y-2">
        {shown.map((r) => {
          const t = topicInfo.get(r.topic_id)
          return (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-celeste-300 bg-white p-4">
              <div className="min-w-0">
                <p className="line-clamp-2">{r.statement}</p>
                <p className="mt-1 text-xs text-navy-700/80">{t ? `${t.course} · ${t.topic}` : 'Sin tema'} · {r.difficulty} · correcta {r.correct}{!r.is_active && ' · inactiva'}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <button onClick={() => setForm(toForm(r))} className="underline">Editar</button>
                <button onClick={() => remove(r)} className="text-rose-700 underline">Eliminar</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
