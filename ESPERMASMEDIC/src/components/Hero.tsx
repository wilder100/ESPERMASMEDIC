export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-12 sm:py-16">
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-celeste-400/70" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
        <path className="ecg-line" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
          d="M0 70 H240 L270 70 L290 30 L320 105 L345 10 L370 70 H560 L585 70 L605 45 L625 70 H820 L845 70 L865 28 L895 100 L920 12 L945 70 H1200" />
      </svg>
      <div className="relative max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo de Espermas Medic Academy" className="h-16 w-16 rounded-full bg-white p-0.5" />
          <span className="font-serif text-2xl text-celeste-200">Espermas Medic Academy</span>
        </div>
        <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
          Practica con preguntas de opción múltiple y llega seguro a tu examen.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-celeste-200">
          Resuelve por curso y tema, recibe la explicación de cada alternativa y mide tu avance con simulacros de 20, 50 y 100 preguntas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#cursos" className="rounded-lg bg-celeste-400 px-5 py-3 font-semibold text-navy-950 hover:bg-celeste-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Elegir un curso
          </a>
          <a href="#registro" className="rounded-lg border border-celeste-400/60 px-5 py-3 font-semibold hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Crear cuenta
          </a>
        </div>
      </div>
    </section>
  )
}
