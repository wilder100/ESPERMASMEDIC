import { useState } from 'react'
import { LETTERS, type Letter, type Question } from '../types'

const optionText = (q: Question, l: Letter) => q[`option_${l.toLowerCase()}` as keyof Question] as string

export default function ExamReview({ questions, answers }: { questions: Question[]; answers: Record<string, Letter> }) {
  const [onlyWrong, setOnlyWrong] = useState(false)
  const rows = questions.map((q, n) => ({ q, n, mine: answers[q.id] })).filter(({ q, mine }) => !onlyWrong || mine !== q.correct)
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Revisión</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} /> Solo incorrectas y sin responder</label>
      </div>
      {rows.map(({ q, n, mine }) => (
        <article key={q.id} className="rounded-2xl border border-celeste-300 bg-white p-5">
          <p className="text-sm text-navy-700/80">Pregunta {n + 1} · {q.topics.name} · {!mine ? 'sin responder' : mine === q.correct ? 'correcta' : 'incorrecta'}</p>
          <p className="mt-1 leading-relaxed">{q.statement}</p>
          <ul className="mt-3 space-y-1.5">
            {LETTERS.map((l) => (
              <li key={l} className={`rounded-lg border px-3 py-2 text-sm ${l === q.correct ? 'border-emerald-600 bg-emerald-50' : l === mine ? 'border-rose-500 bg-rose-50' : 'border-celeste-200'}`}>
                <strong>{l}.</strong> {optionText(q, l)}
                {l !== q.correct && q.wrong_explanations[l] && <span className="mt-1 block text-navy-700/80">{q.wrong_explanations[l]}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-celeste-100 p-3 text-sm">{q.explanation}</p>
        </article>
      ))}
      {rows.length === 0 && <p>No hay preguntas incorrectas. Buen resultado.</p>}
    </section>
  )
}
