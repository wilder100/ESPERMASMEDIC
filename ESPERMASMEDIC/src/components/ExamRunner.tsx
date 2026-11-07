import { useEffect, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { fmtTime } from '../lib/format'
import { LETTERS, type Letter, type Question } from '../types'

interface Props {
  questions: Question[]
  limitSeconds: number
  onFinish: (answers: Record<string, Letter>, elapsed: number) => void
}
const optionText = (q: Question, l: Letter) => q[`option_${l.toLowerCase()}` as keyof Question] as string

export default function ExamRunner({ questions, limitSeconds, onFinish }: Props) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Letter>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [left, setLeft] = useState(limitSeconds)
  const answersRef = useRef(answers)
  const start = useRef(Date.now())
  const done = useRef(false)

  function finish() {
    if (done.current) return
    done.current = true
    onFinish(answersRef.current, Math.min(limitSeconds, Math.round((Date.now() - start.current) / 1000)))
  }

  useEffect(() => {
    const id = setInterval(() => {
      const rest = Math.max(0, Math.ceil((start.current + limitSeconds * 1000 - Date.now()) / 1000))
      setLeft(rest)
      if (rest === 0) finish()
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const q = questions[i]
  const pick = (l: Letter) => {
    const next = { ...answers, [q.id]: l }
    answersRef.current = next
    setAnswers(next)
  }
  const toggleFlag = () => setFlagged((s) => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n })
  const manualFinish = () => {
    const missing = questions.length - Object.keys(answers).length
    if (window.confirm(missing ? `Tienes ${missing} sin responder. ¿Finalizar el simulacro?` : '¿Finalizar el simulacro?')) finish()
  }

  const cell = (id: string, idx: number) =>
    idx === i ? 'bg-navy-900 text-white'
    : flagged.has(id) ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-400'
    : answers[id] ? 'bg-celeste-300' : 'bg-white ring-1 ring-celeste-300'

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-10 flex items-center justify-between rounded-xl border border-celeste-300 bg-white/95 px-4 py-2 backdrop-blur lg:top-2">
        <span className="text-sm">{Object.keys(answers).length} de {questions.length} respondidas</span>
        <span className={`font-mono text-lg font-semibold ${left <= 300 ? 'text-rose-700' : ''}`} aria-label="Tiempo restante">{fmtTime(left)}</span>
        <button onClick={manualFinish} className="rounded-lg bg-navy-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy-800">Finalizar</button>
      </div>

      <article className="rounded-2xl border border-celeste-300 bg-white p-5 sm:p-7">
        <div className="mb-3 flex items-center justify-between text-sm text-navy-700/80">
          <span>Pregunta {i + 1} de {questions.length}</span>
          <button onClick={toggleFlag} className={`flex items-center gap-1 rounded px-2 py-1 ${flagged.has(q.id) ? 'bg-amber-100 text-amber-800' : 'hover:bg-celeste-200'}`}>
            <Flag size={15} /> {flagged.has(q.id) ? 'Marcada' : 'Marcar para revisar'}
          </button>
        </div>
        <p className="text-lg leading-relaxed">{q.statement}</p>
        {q.image_url && <img src={q.image_url} alt="Imagen de la pregunta" className="mt-4 max-h-80 rounded-lg" />}
        <ul className="mt-5 space-y-2">
          {LETTERS.map((l) => (
            <li key={l}>
              <button onClick={() => pick(l)} aria-pressed={answers[q.id] === l}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${answers[q.id] === l ? 'border-navy-700 bg-celeste-100' : 'border-celeste-300 hover:border-navy-700'}`}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-celeste-200 text-xs font-semibold">{l}</span>
                <span>{optionText(q, l)}</span>
              </button>
            </li>
          ))}
        </ul>
      </article>

      <div className="flex justify-between">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-lg border border-celeste-300 bg-white px-4 py-2 disabled:opacity-40">Anterior</button>
        <button disabled={i === questions.length - 1} onClick={() => setI(i + 1)} className="rounded-lg border border-celeste-300 bg-white px-4 py-2 disabled:opacity-40">Siguiente</button>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Navegador de preguntas">
        {questions.map((x, idx) => (
          <button key={x.id} onClick={() => setI(idx)} className={`h-8 w-8 rounded text-xs font-medium ${cell(x.id, idx)}`}>{idx + 1}</button>
        ))}
      </div>
      <p className="text-xs text-navy-700/70">Celeste: respondida · Ámbar: marcada para revisar · Blanca: sin responder.</p>
    </div>
  )
}
