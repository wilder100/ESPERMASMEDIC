import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import AuthGate from '../components/AuthGate'
import QuestionPractice from '../components/QuestionPractice'
import type { Question } from '../types'
import type { Course } from '../data/courses'

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

export default function CoursePage({ course }: { course: Course }) {
  const { session, loading } = useSession()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [topic, setTopic] = useState('todos')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase || !session) return
    setQuestions(null); setTopic('todos'); setError('')
    supabase
      .from('questions')
      .select('*, topics!inner(name, units!inner(courses!inner(slug)))')
      .eq('is_active', true)
      .eq('topics.units.courses.slug', course.slug)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setQuestions(shuffle((data ?? []) as unknown as Question[]))
      })
  }, [course.slug, session])

  const topics = useMemo(() => [...new Set((questions ?? []).map((q) => q.topics.name))], [questions])
  const visible = useMemo(() => (questions ?? []).filter((q) => topic === 'todos' || q.topics.name === topic), [questions, topic])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{course.name}</h1>
          <p className="text-navy-700/80">{course.description}</p>
        </div>
        {session && <button onClick={() => supabase?.auth.signOut()} className="text-sm text-navy-700 underline">Cerrar sesión</button>}
      </div>

      {!supabase ? (
        <p className="rounded-xl bg-white p-5">Falta configurar Supabase: completa <code>.env.local</code> y reinicia <code>npm run dev</code>.</p>
      ) : loading ? null : !session ? (
        <AuthGate />
      ) : error ? (
        <p className="text-rose-700" role="alert">{error}</p>
      ) : !questions ? (
        <p>Cargando preguntas…</p>
      ) : questions.length === 0 ? (
        <p className="rounded-xl border border-celeste-300 bg-white p-5">Este curso aún no tiene preguntas.</p>
      ) : (
        <>
          {topics.length > 1 && (
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-celeste-300 bg-white px-3 py-2" aria-label="Filtrar por tema">
              <option value="todos">Todos los temas</option>
              {topics.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
          <QuestionPractice key={topic} questions={visible} />
        </>
      )}
    </div>
  )
}
