import { NavLink } from 'react-router-dom'
import { Brain, Home, ClipboardList, GitBranch, Activity, FileQuestion, Folder, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Inicio', Icon: Home },
  { to: '/summaries', label: 'Resúmenes', Icon: ClipboardList },
  { to: '/diagrams', label: 'Diagramas', Icon: GitBranch },
  { to: '/diseases', label: 'Enfermedades', Icon: Activity },
  { to: '/quizzes', label: 'Cuestionarios', Icon: FileQuestion },
  { to: '/folders', label: 'Carpetas', Icon: Folder },
]

export default function Sidebar() {
  return (
    <div className="w-56 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Brain size={14} className="text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e5e5e5] leading-none">MedStudy</p>
            <p className="text-[10px] text-teal-500 font-semibold leading-none mt-0.5">AI · Local</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1a1a1a] text-[#e5e5e5] [&>svg]:text-teal-400'
                  : 'text-[#525252] hover:text-[#737373] hover:bg-[#141414]'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 py-3 border-t border-[#1a1a1a] space-y-1">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#525252] hover:text-[#737373] hover:bg-[#141414] transition-all">
          <Settings size={15} />
          Configuración
        </button>
        <div className="mx-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
          <p className="text-[10px] text-[#525252]">Modelo activo</p>
          <p className="text-[11px] text-teal-400 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
            Claude Sonnet 4.6
          </p>
        </div>
      </div>
    </div>
  )
}
