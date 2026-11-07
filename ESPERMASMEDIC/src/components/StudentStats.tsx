import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtTime } from '../lib/format'

interface Att { is_correct: boolean; questions: { topics: { name: string; units: { courses: { name: string } } } } | null }
interface ExamRow { id: string; total_questions: number; correct_count: number; score: number; duration_seconds: number; started_at: string }
type Agg = { ok: number; n: number }

const pct = (a: Agg) => Math.round((a.ok / a.n) * 100)
function Bar({ value }: { value: number }) {
  return <div className="h-2 w-full rounded bg-celeste-200"><div className="h-2 rounded bg-navy-800" style={{ width: `${value}%` }} /></div>
}

export default function StudentStats({ userId }: { userId: string }) {
  const [att, setAtt] = useState<Att[] | null>(null)
  const [exams, setExams] = useState<ExamRow[]>([])

  useEffect(() => {
    const db = supabase!
    db.from('attempts').select('is_correct, questions(topics(name, units(courses(name))))').eq('user_id', userId).limit(5000)
      .then(({ data }) => setAtt((data ?? []) as unknown as Att[]))
    db.from('exams').select('id,total_questions,correct_count,score,duration_seconds,started_at').eq('user_id', userId)
      .not('finished_at', 'is', null).order('started_at', { ascending: false }).limit(5)
      .then(({ data }) => setExams((data ?? []) as ExamRow[]))
  }, [userId])

  if (!att) return <p>Cargando estadísticas…</p>
  const total = att.length, ok = att.filter((a) => a.is_correct).length
  const byCourse = new Map<string, Agg>(), byTopic = new Map<string, Agg>()
  att.forEach((a) => {
    const t = a.questions?.topics
    if (!t) return
    const course = t.units.courses.name
    for (const [m, key] of [[byCourse, course], [byTopic, `${course} · ${t.name}`]] as [Map<string, Agg>, string][]) {
      const v = m.get(key) ?? { ok: 0, n: 0 }
      v.n++; if (a.is_correct) v.ok++; m.set(key, v)
    }
  })
  const courses = [...byCourse.entries()].sort((a, b) => pct(a[1]) - pct(b[1]))
  const weak = [...byTopic.entries()].filter(([, v]) => v.n >= 2 && pct(v) < 70).sort((a, b) => pct(a[1]) - pct(b[1])).slice(0, 5)
  const card = 'rounded-2xl border border-celeste-300 bg-white p-4'

  if (total === 0) return <p className={card}>Aún no has resuelto preguntas. Tus estadísticas aparecerán aquí.</p>
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="font-serif text-3xl">{total}</p><p className="text-sm text-navy-700/80">Preguntas resueltas</p></div>
        <div className={card}><p className="font-serif text-3xl">{Math.round((ok / total) * 100)} %</p><p className="text-sm text-navy-700/80">Aciertos</p></div>
        <div className={card}><p className="font-serif text-3xl">{Math.round(((total - ok) / total) * 100)} %</p><p className="text-sm text-navy-700/80">Errores</p></div>
      </div>

      <section className={card}>
        <h3 className="mb-3 font-serif text-xl">Rendimiento por asignatura</h3>
        <ul className="space-y-3">
          {courses.map(([name, v]) => (
            <li key={name}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span>{pct(v)} % · {v.n} resp.</span></div><Bar value={pct(v)} /></li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h3 className="mb-3 font-serif text-xl">Temas con dificultad</h3>
        {weak.length === 0 ? <p className="text-sm text-navy-700/80">Ningún tema por debajo de 70 % (se necesitan al menos 2 respuestas por tema).</p> : (
          <ul className="space-y-3">
            {weak.map(([name, v]) => (
              <li key={name}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span>{pct(v)} % · {v.n} resp.</span></div><Bar value={pct(v)} /></li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h3 className="mb-3 font-serif text-xl">Últimos simulacros</h3>
        {exams.length === 0 ? <p className="text-sm text-navy-700/80">Todavía no terminaste ningún simulacro.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-navy-700/80"><tr><th className="py-1">Fecha</th><th>Preguntas</th><th>Correctas</th><th>Nota</th><th>Tiempo</th></tr></thead>
            <tbody>{exams.map((e) => (
              <tr key={e.id} className="border-t border-celeste-200">
                <td className="py-2">{new Date(e.started_at).toLocaleDateString('es-PE')}</td><td>{e.total_questions}</td><td>{e.correct_count}</td>
                <td className="font-semibold">{e.score} %</td><td>{fmtTime(e.duration_seconds ?? 0)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
        <a href="#simulacros" className="mt-3 inline-block text-sm underline">Ver historial completo</a>
      </section>
      <p className="text-xs text-navy-700/70">Se consideran tus últimas 5000 respuestas.</p>
    </div>
  )
}
