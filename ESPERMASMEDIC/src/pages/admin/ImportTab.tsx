import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { TreeCourse } from '../../lib/useAdminData'

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const COLS = 'curso,unidad,tema,enunciado,a,b,c,d,e,correcta,explicacion,exp_a,exp_b,exp_c,exp_d,exp_e,dificultad'

interface Parsed { line: number; data: Record<string, string>; error?: string }

export default function ImportTab({ tree, reload }: { tree: TreeCourse[]; reload: () => void }) {
  const [rows, setRows] = useState<Parsed[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  function template() {
    const example = 'medicina-interna,Cardiología,Síndromes coronarios agudos,"Enunciado de ejemplo","Alt A","Alt B","Alt C","Alt D","Alt E",C,"Explicación correcta",,"Por qué B falla",,,,alta'
    const url = URL.createObjectURL(new Blob([`\uFEFF${COLS}\n${example}\n`], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: 'plantilla-preguntas.csv' }).click()
    URL.revokeObjectURL(url)
  }

  async function onFile(file: File) {
    setMsg(''); setRows([])
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer())
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
    const parsed = raw.map((r, i): Parsed => {
      const d: Record<string, string> = {}
      Object.entries(r).forEach(([k, v]) => { d[norm(k)] = String(v ?? '').trim() })
      const course = tree.find((c) => norm(c.slug) === norm(d.curso) || norm(c.name) === norm(d.curso))
      let error = ''
      if (!course) error = `curso "${d.curso}" no existe (créalo antes en Cursos y temas)`
      else if (!d.unidad || !d.tema) error = 'falta unidad o tema'
      else if (!d.enunciado || !d.explicacion) error = 'falta enunciado o explicación'
      else if (!['a', 'b', 'c', 'd', 'e'].every((l) => d[l])) error = 'faltan alternativas A–E'
      else if (!['A', 'B', 'C', 'D', 'E'].includes(d.correcta?.toUpperCase())) error = 'la columna correcta debe ser A–E'
      else if (d.dificultad && !['baja', 'media', 'alta'].includes(norm(d.dificultad))) error = 'dificultad debe ser baja, media o alta'
      return { line: i + 2, data: d, error: error || undefined }
    })
    setRows(parsed)
  }

  async function doImport() {
    const ok = rows.filter((r) => !r.error)
    if (!supabase || ok.length === 0) return
    setBusy(true); setMsg('')
    try {
      const unitIds = new Map<string, string>(), topicIds = new Map<string, string>()
      tree.forEach((c) => c.units.forEach((u) => { unitIds.set(`${c.id}|${norm(u.name)}`, u.id); u.topics.forEach((t) => topicIds.set(`${u.id}|${norm(t.name)}`, t.id)) }))
      const payload = []
      for (const { data: d } of ok) {
        const c = tree.find((x) => norm(x.slug) === norm(d.curso) || norm(x.name) === norm(d.curso))!
        let uid = unitIds.get(`${c.id}|${norm(d.unidad)}`)
        if (!uid) {
          const { data, error } = await supabase.from('units').insert({ course_id: c.id, name: d.unidad, sort_order: 99 }).select('id').single()
          if (error) throw error
          uid = data.id as string; unitIds.set(`${c.id}|${norm(d.unidad)}`, uid)
        }
        let tid = topicIds.get(`${uid}|${norm(d.tema)}`)
        if (!tid) {
          const { data, error } = await supabase.from('topics').insert({ unit_id: uid, name: d.tema }).select('id').single()
          if (error) throw error
          tid = data.id as string; topicIds.set(`${uid}|${norm(d.tema)}`, tid)
        }
        const correct = d.correcta.toUpperCase()
        const wrong = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].filter((l) => l.toUpperCase() !== correct && d[`exp_${l}`]).map((l) => [l.toUpperCase(), d[`exp_${l}`]]))
        payload.push({
          topic_id: tid, statement: d.enunciado, option_a: d.a, option_b: d.b, option_c: d.c, option_d: d.d, option_e: d.e,
          correct, explanation: d.explicacion, wrong_explanations: wrong, difficulty: norm(d.dificultad) || 'alta', source: 'Importación',
        })
      }
      for (let i = 0; i < payload.length; i += 100) {
        const { error } = await supabase.from('questions').insert(payload.slice(i, i + 100))
        if (error) throw error
      }
      setMsg(`Se importaron ${payload.length} preguntas.`); setRows([]); reload()
    } catch (e) {
      setMsg(`Error: ${(e as { message?: string }).message ?? 'no se pudo importar'}`)
    }
    setBusy(false)
  }

  const bad = rows.filter((r) => r.error)
  return (
    <div className="space-y-4">
      <p className="text-sm text-navy-700/80">Sube un archivo CSV o Excel (.xlsx) con estas columnas: <code>{COLS}</code>. Las columnas <code>exp_a</code>…<code>exp_e</code> explican por qué cada alternativa incorrecta lo es (opcionales). Las unidades y temas nuevos se crean solos; los cursos deben existir.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={template} className="rounded-lg border border-celeste-300 bg-white px-4 py-2">Descargar plantilla</button>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} aria-label="Archivo a importar" />
      </div>
      {rows.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-celeste-300 bg-white p-4">
          <p>{rows.length - bad.length} filas válidas · {bad.length} con errores</p>
          {bad.length > 0 && <ul className="max-h-48 overflow-auto text-sm text-rose-700">{bad.map((r) => <li key={r.line}>Fila {r.line}: {r.error}</li>)}</ul>}
          <button onClick={doImport} disabled={busy || rows.length === bad.length} className="rounded-lg bg-navy-900 px-5 py-2 font-semibold text-white disabled:opacity-60">
            {busy ? 'Importando…' : `Importar ${rows.length - bad.length} preguntas válidas`}
          </button>
        </div>
      )}
      {msg && <p className="text-sm" role="status">{msg}</p>}
    </div>
  )
}
