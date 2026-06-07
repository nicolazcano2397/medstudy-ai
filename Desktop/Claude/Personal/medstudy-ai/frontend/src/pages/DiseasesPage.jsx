import { useState, useEffect } from 'react'
import { Activity, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { diseasesAPI } from '../services/api'

const SECTIONS = [
  { key: 'etiology', label: 'Etiología' },
  { key: 'pathophysiology', label: 'Fisiopatología' },
  { key: 'clinical_presentation', label: 'Presentación Clínica' },
  { key: 'diagnosis', label: 'Diagnóstico' },
  { key: 'treatment', label: 'Tratamiento' },
  { key: 'prognosis', label: 'Pronóstico' },
]

function DiseaseCard({ disease }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1a1a1a]">
        <h2 className="text-base font-bold text-[#e5e5e5]">{disease.name}</h2>
      </div>
      <div>
        {SECTIONS.map(({ key, label }) => disease[key] && (
          <div key={key} className="border-b border-[#1a1a1a] last:border-0">
            <button
              onClick={() => setOpen(open === key ? null : key)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#111111] transition-all"
            >
              <span className="text-teal-400">{label}</span>
              {open === key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open === key && (
              <div className="px-5 pb-4">
                <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{disease[key]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DiseasesPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [list, setList] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    diseasesAPI.list().then(r => setList(r.data)).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSelected(null)
    try {
      const r = await diseasesAPI.generate({ name: query })
      setSelected(r.data)
      diseasesAPI.list().then(x => setList(x.data)).catch(() => {})
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al generar')
    }
    setLoading(false)
  }

  const filtered = search
    ? list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    : list

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Activity size={18} className="text-teal-400" />
        <h1 className="text-lg font-bold text-[#e5e5e5]">Fichas de Enfermedades</h1>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-5">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="Nombre de la enfermedad (ej: Neumonía por Streptococcus)"
            className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50"
          />
          <button onClick={handleGenerate} disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            Generar ficha
          </button>
        </div>
      </div>

      {selected && <div className="mb-5"><DiseaseCard disease={selected} /></div>}

      {list.length > 0 && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider flex-1">Fichas guardadas</p>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-7 pr-3 py-1 text-xs bg-[#111111] border border-[#1a1a1a] rounded-lg text-[#a3a3a3] focus:outline-none focus:border-teal-500/40 w-40" />
            </div>
          </div>
          <div className="space-y-1">
            {filtered.map(d => (
              <button key={d.id} onClick={() => setSelected(d)}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#111111] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all">
                <span className="text-sm text-[#a3a3a3]">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
