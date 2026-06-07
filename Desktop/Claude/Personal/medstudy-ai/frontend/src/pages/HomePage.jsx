import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, GitBranch, Activity, FileQuestion, Folder, Brain } from 'lucide-react'
import { summariesAPI, diagramsAPI, diseasesAPI, quizzesAPI } from '../services/api'

const modules = [
  { to: '/summaries', label: 'Resúmenes', Icon: ClipboardList, desc: 'Genera resúmenes, bullets y flashcards desde PDFs o texto' },
  { to: '/diagrams', label: 'Diagramas', Icon: GitBranch, desc: 'Visualiza fisiopatologías y procesos con diagramas automáticos' },
  { to: '/diseases', label: 'Enfermedades', Icon: Activity, desc: 'Fichas completas de enfermedades con evidencia actualizada' },
  { to: '/quizzes', label: 'Cuestionarios', Icon: FileQuestion, desc: 'Preguntas tipo EUNACOM/MIR y casos clínicos con evaluación' },
  { to: '/folders', label: 'Carpetas', Icon: Folder, desc: 'Organiza tu material de estudio por ramo o tema' },
]

export default function HomePage() {
  const [stats, setStats] = useState({ summaries: 0, diagrams: 0, diseases: 0, quizzes: 0 })

  useEffect(() => {
    Promise.allSettled([
      summariesAPI.list(),
      diagramsAPI.list(),
      diseasesAPI.list(),
      quizzesAPI.list(),
    ]).then(([s, d, dis, q]) => {
      setStats({
        summaries: s.status === 'fulfilled' ? s.value.data.length : 0,
        diagrams: d.status === 'fulfilled' ? d.value.data.length : 0,
        diseases: dis.status === 'fulfilled' ? dis.value.data.length : 0,
        quizzes: q.status === 'fulfilled' ? q.value.data.length : 0,
      })
    })
  }, [])

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
          <Brain size={20} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#e5e5e5]">MedStudy AI</h1>
          <p className="text-sm text-[#525252]">Tu asistente de estudio para medicina</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Resúmenes', value: stats.summaries },
          { label: 'Diagramas', value: stats.diagrams },
          { label: 'Enfermedades', value: stats.diseases },
          { label: 'Cuestionarios', value: stats.quizzes },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#e5e5e5]">{value}</p>
            <p className="text-xs text-[#525252] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modules.map(({ to, label, Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] hover:bg-[#111111] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                <Icon size={15} className="text-teal-400" />
              </div>
              <span className="text-sm font-semibold text-[#e5e5e5]">{label}</span>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
