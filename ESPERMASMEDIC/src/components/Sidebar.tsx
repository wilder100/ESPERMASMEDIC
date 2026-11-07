import { Home, Timer, BarChart3, Shield, X } from 'lucide-react'
import { useCourses } from '../lib/useCourses'
import { useProfile } from '../lib/useAdminData'

interface Props { open: boolean; onClose: () => void }

const main = [
  { label: 'Inicio', href: '#inicio', icon: Home, ready: true },
  { label: 'Simulacros', href: '#simulacros', icon: Timer, ready: true },
  { label: 'Mi progreso', href: '#progreso', icon: BarChart3, ready: true },
]

export default function Sidebar({ open, onClose }: Props) {
  const courses = useCourses()
  const { role } = useProfile()
  const items = role === 'admin' ? [...main, { label: 'Administración', href: '#admin', icon: Shield, ready: true }] : main
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-900 text-celeste-200 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-between px-6 py-5">
          <span className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-11 w-11 rounded-full bg-white p-0.5" />
            <span className="font-serif text-lg font-semibold leading-tight text-white">Espermas<br />Medic Academy</span>
          </span>
          <button onClick={onClose} className="rounded p-1 hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-celeste-400 lg:hidden" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="space-y-1">
            {items.map(({ label, href, icon: Icon, ready }) => (
              <li key={label}>
                <a href={href} onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-celeste-400 ${ready ? 'hover:bg-navy-800 hover:text-white' : 'cursor-default opacity-60'}`}>
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {!ready && <span className="rounded bg-navy-800 px-1.5 py-0.5 text-xs">Pronto</span>}
                </a>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-7 px-3 text-xs font-semibold text-celeste-400">Cursos</p>
          <ul className="space-y-0.5">
            {courses.map(({ slug, name, icon: Icon }) => (
              <li key={slug}>
                <a href={`#${slug}`} onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-navy-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-celeste-400">
                  <Icon size={16} className="shrink-0 text-celeste-400" />
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  )
}
