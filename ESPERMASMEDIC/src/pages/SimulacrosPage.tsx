import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { fmtTime } from '../lib/format'
import { useCourses } from '../lib/useCourses'
import AuthGate from '../components/AuthGate'
import ExamRunner from '../components/ExamRunner'
import ExamReview from '../components/ExamReview'
import type { Letter, Question } from '../types'

interface ExamRow { id: string; total_questions: number; correct_count: number; score: number; duration_seconds: number; started_at: string }
interface Result { correct: number; total: number; score: number; elapsed: number; answers: Record<string, Letter>; questions: Question[] }

const SECONDS_PER_QUESTION = 90
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

export default function SimulacrosPage() {
  const courses = useCourses()
  const { session, loading } = useSession()
  const [size, setSize] = useState(20)
  const [slug, setSlug] = useState('todos')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [run, setRun] = useState<{ examId: string; questions: Question[]; limit: number } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [history, setHistory] = useState<ExamRow[]>([])

  const loadHistory = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('exams')
      .select('id,total_questions,correct_count,score,duration_seconds,started_at')
      .not('finished_at', 'is', null).order('started_at', { ascending: false }).limit(30)
    setHistory((data ?? []) as ExamRow[])
  }, [])
  useEffect(() => { if (session) loadHistory() }, [session, loadHistory])

  async function start() {
    if (!supabase) return
    setBusy(true); setError(''); setResult(null)
    let query = supabase.from('questions').select('*, topics!inner(name, units!inner(courses!inner(slug)))').eq('is_active', true)
    if (slug !== 'todos') query = query.eq('topics.units.courses.slug', slug)
    const { data, error: e1 } = await query
    const qs = shuffle((data ?? []) as unknown as Question[]).slice(0, size)
    if (e1 || qs.length === 0) { setBusy(false); setError(e1?.message ?? 'No hay preguntas disponibles en esta selección.'); return }
    const limit = qs.length * SECONDS_PER_QUESTION
    const { data: ex, error: e2 } = await supabase.from('exams').insert({ total_questions: qs.length, time_limit_seconds: limit }).select('id').single()
    setBusy(false)
    if (e2 || !ex) { setError(e2?.message ?? 'No se pudo crear el simulacro.'); return }
    setRun({ examId: ex.id, questions: qs, limit })
  }

  async function finish(answers: Record<string, Letter>, elapsed: number) {
    if (!supabase || !run) return
    const payload = Object.entries(answers).map(([question_id, selected]) => ({ question_id, selected }))
    const { data, error: e } = await supabase.rpc('finish_exam', { p_exam_id: run.examId, p_answers: payload, p_elapsed: elapsed })
    const localOk = run.questions.filter((q) => answers[q.id] === q.correct).length
    const row = Array.isArray(data) ? data[0] : null
    if (e) setError(`No se pudo guardar el simulacro: ${e.message}`)
    const total = run.questions.length
    setResult({ correct: row?.r_correct ?? localOk, total, score: row?.r_score ?? Math.round((localOk * 100) / total), elapsed, answers, questions: run.questions })
    setRun(null)
    loadHistory()
  }

  const title = <h1 className="font-serif text-3xl">Simulacros</h1>
  if (!supabase) return <p className="rounded-xl bg-white p-5">Falta configurar Supabase en <code>.env.local</code>.</p>
  if (loading) return null
  if (!session) return <div className="space-y-6">{title}<AuthGate /></div>
  if (run) return <ExamRunner questions={run.questions} limitSeconds={run.limit} onFinish={finish} />

  const box = 'rounded-2xl border border-celeste-300 bg-white p-5'
  return (
    <div className="space-y-8">
      {title}
      {result && (
        <>
          <div className={`${box} text-center`}>
            <p className="font-serif text-5xl">{result.score} %</p>
            <p className="mt-1">{result.correct} de {result.total} correctas · tiempo {fmtTime(result.elapsed)}</p>
          </div>
          <ExamReview questions={result.questions} answers={result.answers} />
        </>
      )}

      <section className={`${box} space-y-4`}>
        <h2 className="font-serif text-xl">Nuevo simulacro</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Número de preguntas">
          {[20, 50, 100].map((n) => (
            <button key={n} role="radio" aria-checked={size === n} onClick={() => setSize(n)}
              className={`rounded-lg border px-4 py-2 ${size === n ? 'border-navy-900 bg-navy-900 text-white' : 'border-celeste-300 hover:border-navy-700'}`}>
              {n} preguntas · {fmtTime(n * SECONDS_PER_QUESTION)}
            </button>
          ))}
        </div>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border border-celeste-300 bg-white px-3 py-2" aria-label="Curso">
          <option value="todos">Todos los cursos</option>
          {courses.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <p className="text-sm text-navy-700/80">Si el banco tiene menos preguntas que las elegidas, el simulacro usará las disponibles.</p>
        {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
        <button onClick={start} disabled={busy} className="rounded-lg bg-navy-900 px-5 py-2.5 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
          {busy ? 'Preparando…' : 'Comenzar simulacro'}
        </button>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl">Historial</h2>
        {history.length === 0 ? <p className="text-navy-700/80">Aún no has terminado ningún simulacro.</p> : (
          <div className="overflow-x-auto rounded-2xl border border-celeste-300 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-navy-700/80"><tr><th className="p-3">Fecha</th><th>Preguntas</th><th>Correctas</th><th>Nota</th><th>Tiempo</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-celeste-200">
                    <td className="p-3">{new Date(h.started_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{h.total_questions}</td><td>{h.correct_count}</td><td className="font-semibold">{h.score} %</td><td>{fmtTime(h.duration_seconds ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
