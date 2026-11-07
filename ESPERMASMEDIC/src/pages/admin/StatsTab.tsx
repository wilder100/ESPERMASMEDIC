import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { TreeCourse } from '../../lib/useAdminData'

interface Stats { students: number; questions: number; attempts: number; correct: number; exams: number; perCourse: [string, number][]; hardest: { statement: string; rate: number; n: number }[] }

export default function StatsTab({ tree }: { tree: TreeCourse[] }) {
  const [s, setS] = useState<Stats | null>(null)
  useEffect(() => {
    const db = supabase!
    const count = async (t: string, f?: (q: ReturnType<typeof db.from>) => unknown) => {
      let q = db.from(t).select('*', { count: 'exact', head: true }) as unknown as { eq: (c: string, v: unknown) => typeof q; then: PromiseLike<{ count: number | null }>['then'] }
      if (f) q = f(db.from(t)) as typeof q
      return ((await q) as { count: number | null }).count ?? 0
    }
    ;(async () => {
      const [students, questions, attempts, exams] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').then((r) => r.count ?? 0),
        count('questions'), count('attempts'), count('exams'),
      ])
      const correct = (await db.from('attempts').select('*', { count: 'exact', head: true }).eq('is_correct', true)).count ?? 0
      const { data: qs } = await db.from('questions').select('topic_id').limit(5000)
      const topicCourse = new Map<string, string>()
      tree.forEach((c) => c.units.forEach((u) => u.topics.forEach((t) => topicCourse.set(t.id, c.name))))
      const per = new Map<string, number>()
      ;(qs ?? []).forEach((q) => { const n = topicCourse.get(q.topic_id) ?? 'Sin curso'; per.set(n, (per.get(n) ?? 0) + 1) })
      const { data: at } = await db.from('attempts').select('question_id,is_correct').limit(5000)
      const agg = new Map<string, { n: number; bad: number }>()
      ;(at ?? []).forEach((a) => { const v = agg.get(a.question_id) ?? { n: 0, bad: 0 }; v.n++; if (!a.is_correct) v.bad++; agg.set(a.question_id, v) })
      const top = [...agg.entries()].filter(([, v]) => v.n >= 3).sort((a, b) => b[1].bad / b[1].n - a[1].bad / a[1].n).slice(0, 5)
      const { data: texts } = top.length ? await db.from('questions').select('id,statement').in('id', top.map(([id]) => id)) : { data: [] }
      setS({
        students, questions, attempts, correct, exams,
        perCourse: [...per.entries()].sort((a, b) => b[1] - a[1]),
        hardest: top.map(([id, v]) => ({ statement: texts?.find((t) => t.id === id)?.statement ?? '', rate: Math.round((v.bad / v.n) * 100), n: v.n })),
      })
    })()
  }, [tree])

  if (!s) return <p>Cargando estadísticas…</p>
  const card = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-celeste-300 bg-white p-4"><p className="font-serif text-3xl">{value}</p><p className="text-sm text-navy-700/80">{label}</p></div>
  )
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {card('Estudiantes', s.students)}{card('Preguntas', s.questions)}{card('Simulacros', s.exams)}
        {card('Respuestas registradas', s.attempts)}{card('Aciertos globales', s.attempts ? `${Math.round((s.correct / s.attempts) * 100)} %` : '—')}
      </div>
      <section><h2 className="mb-2 font-serif text-xl">Preguntas por curso</h2>
        <ul className="space-y-1 text-sm">{s.perCourse.map(([n, v]) => <li key={n} className="flex justify-between rounded-lg bg-white px-3 py-2"><span>{n}</span><span>{v}</span></li>)}</ul></section>
      <section><h2 className="mb-2 font-serif text-xl">Preguntas con más errores</h2>
        {s.hardest.length === 0 ? <p className="text-sm text-navy-700/80">Se necesitan al menos 3 respuestas por pregunta.</p> :
          <ul className="space-y-2 text-sm">{s.hardest.map((h, i) => <li key={i} className="rounded-lg bg-white p-3"><span className="font-semibold">{h.rate} % de error</span> ({h.n} respuestas) · {h.statement}</li>)}</ul>}</section>
    </div>
  )
}
