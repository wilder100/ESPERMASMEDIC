import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { isMuted, setMuted, playCorrect } from '../lib/sound'
import SpermJump from './SpermJump'
import { LETTERS, type Letter, type Question } from '../types'

const optionText = (q: Question, l: Letter) => q[`option_${l.toLowerCase()}` as keyof Question] as string

export default function QuestionPractice({ questions }: { questions: Question[] }) {
  const [i, setI] = useState(0)
  const [selected, setSelected] = useState<Letter | null>(null)
  const [hits, setHits] = useState(0)
  const [jump, setJump] = useState(0)
  const [mute, setMute] = useState(isMuted())
  const [saveError, setSaveError] = useState(false)

  if (i >= questions.length) {
    const pct = Math.round((hits / questions.length) * 100)
    return (
      <div className="rounded-2xl border border-celeste-300 bg-white p-8 text-center">
        <p className="font-serif text-3xl">{hits} de {questions.length} correctas</p>
        <p className="mt-1 text-navy-700/80">{pct} % de aciertos</p>
        <button onClick={() => { setI(0); setSelected(null); setHits(0) }} className="mt-6 rounded-lg bg-navy-900 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">
          Practicar de nuevo
        </button>
      </div>
    )
  }

  const q = questions[i]
  const answered = selected !== null

  async function choose(l: Letter) {
    if (answered) return
    setSelected(l)
    if (l === q.correct) { setHits((h) => h + 1); setJump((j) => j + 1); playCorrect() }
    const { error } = await supabase!.from('attempts').insert({ question_id: q.id, selected: l })
    setSaveError(!!error)
  }

  function style(l: Letter) {
    if (!answered) return 'border-celeste-300 hover:border-navy-700 hover:bg-celeste-100/60'
    if (l === q.correct) return 'border-emerald-600 bg-emerald-50'
    if (l === selected) return 'border-rose-500 bg-rose-50'
    return 'border-celeste-200 opacity-70'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-navy-700/80">
        <span>Pregunta {i + 1} de {questions.length} · {q.topics.name} · dificultad {q.difficulty}</span>
        <button onClick={() => { setMuted(!mute); setMute(!mute) }} className="rounded p-1.5 hover:bg-celeste-200" aria-label={mute ? 'Activar sonido' : 'Silenciar'}>
          {mute ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <article className="rounded-2xl border border-celeste-300 bg-white p-5 sm:p-7">
        <p className="text-lg leading-relaxed">{q.statement}</p>
        {q.image_url && <img src={q.image_url} alt="Imagen de la pregunta" className="mt-4 max-h-80 rounded-lg" />}

        <ul className="mt-5 space-y-2">
          {LETTERS.map((l) => (
            <li key={l}>
              <button onClick={() => choose(l)} disabled={answered}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${style(l)}`}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-celeste-200 text-xs font-semibold">{l}</span>
                <span>{optionText(q, l)}</span>
              </button>
              {answered && l !== q.correct && q.wrong_explanations[l] && (l === selected || true) && (
                <p className="ml-9 mt-1 text-sm text-navy-700/80">{q.wrong_explanations[l]}</p>
              )}
            </li>
          ))}
        </ul>

        {answered && (
          <div className="mt-5 rounded-xl bg-celeste-100 p-4">
            <p className="font-semibold">
              {selected === q.correct ? 'Correcto.' : `Incorrecto. La respuesta es ${q.correct}.`}
            </p>
            <p className="mt-1 text-navy-800">{q.explanation}</p>
          </div>
        )}
        {saveError && <p className="mt-3 text-sm text-rose-700">No se pudo guardar este intento.</p>}
      </article>

      {answered && (
        <button onClick={() => { setI(i + 1); setSelected(null) }} className="rounded-lg bg-navy-900 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">
          {i + 1 === questions.length ? 'Ver resultado' : 'Siguiente pregunta'}
        </button>
      )}
      {jump > 0 && <SpermJump key={jump} onDone={() => {}} />}
    </div>
  )
}
