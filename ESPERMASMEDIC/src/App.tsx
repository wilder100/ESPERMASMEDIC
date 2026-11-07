import { useState } from 'react'
import { Menu } from 'lucide-react'
import Splash from './components/Splash'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import ProgressPage from './pages/ProgressPage'
import RecoveryGate from './components/RecoveryGate'
import AdminPage from './pages/AdminPage'
import { useCourses } from './lib/useCourses'
import SimulacrosPage from './pages/SimulacrosPage'
import CoursePage from './pages/CoursePage'
import { useHash } from './lib/useHash'
import CourseCard from './components/CourseCard'
import { useCourseCounts } from './lib/useCourseCounts'
import { areaLabels, type Area } from './data/courses'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const courses = useCourses()
  const counts = useCourseCounts()
  const hash = useHash()
  const course = courses.find((c) => c.slug === hash)
  const areas: Area[] = ['basicas', 'clinicas']

  return (
    <div className="min-h-screen">
      <Splash />
      <RecoveryGate />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-celeste-300 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="rounded p-1.5 hover:bg-celeste-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-700" aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <img src="/logo.jpg" alt="" className="h-8 w-8 rounded-full" />
          <span className="font-serif text-lg font-semibold leading-tight">Espermas Medic Academy</span>
        </header>

        <main className="mx-auto max-w-6xl space-y-12 px-4 py-6 sm:px-8 sm:py-10">
          {(hash === 'progreso' || hash === 'registro') ? <ProgressPage /> : hash === 'admin' ? <AdminPage /> : hash === 'simulacros' ? <SimulacrosPage /> : course ? <CoursePage course={course} /> : (
            <>
          <Hero />

          <div id="cursos" className="scroll-mt-20 space-y-10">
            {areas.map((area) => (
              <section key={area}>
                <h2 className="mb-4 font-serif text-2xl font-medium">{areaLabels[area]}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.filter((c) => c.area === area).map((c) => (
                    <CourseCard key={c.slug} course={c} count={counts[c.slug]} />
                  ))}
                </div>
              </section>
            ))}
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
