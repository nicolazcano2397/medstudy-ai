import { useState, useEffect } from 'react'
import { GitBranch, Loader2, Upload, Download, Trash2, ChevronRight } from 'lucide-react'
import { diagramsAPI, documentsAPI } from '../services/api'
import MermaidDiagram from '../components/shared/MermaidDiagram'
import jsPDF from 'jspdf'

const ALLOWED = '.pdf,.ppt,.pptx,.doc,.docx'
const DIAGRAM_TYPES = [
  { id: 'flowchart', label: 'Flujo' },
  { id: 'cascade', label: 'Cascada' },
  { id: 'sequence', label: 'Secuencia' },
  { id: 'mindmap', label: 'Mapa mental' },
  { id: 'table', label: 'Tabla comparativa' },
  { id: 'timeline', label: 'Línea de tiempo' },
  { id: 'er', label: 'Relaciones' },
]

export default function DiagramsPage() {
  const [topic, setTopic] = useState('')
  const [diagramType, setDiagramType] = useState('flowchart')
  const [mode, setMode] = useState('topic')
  const [file, setFile] = useState(null)
  const [docId, setDocId] = useState(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [view, setView] = useState('generate')

  const loadHistory = () => diagramsAPI.list().then(r => setHistory(r.data)).catch(() => {})
  useEffect(() => { loadHistory() }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploadMsg('Procesando...')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await documentsAPI.upload(fd)
      setDocId(r.data.id); setUploadMsg(`Listo: ${r.data.char_count.toLocaleString()} caracteres`)
    } catch { setUploadMsg('Error al procesar el archivo') }
  }

  const handleGenerate = async () => {
    if (!topic.trim() || (mode === 'file' && !docId)) return
    setLoading(true); setCurrent(null)
    try {
      const payload = { topic, diagram_type: diagramType, ...(mode === 'file' && docId ? { document_id: docId } : {}) }
      const r = await diagramsAPI.generate(payload)
      setCurrent(r.data); loadHistory()
    } catch (e) {
      setCurrent({ error: e.response?.data?.detail || 'Error al generar' })
    }
    setLoading(false)
  }

  const handleDelete = async (id, e) => {
    e?.stopPropagation()
    await diagramsAPI.delete(id).catch(() => {})
    loadHistory()
    if (current?.id === id) setCurrent(null)
  }

  const getSvgEl = () => document.querySelector('.mermaid svg')

  const downloadSVG = () => {
    const svg = getSvgEl(); if (!svg) return
    const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml' }))
    const a = document.createElement('a'); a.href = url
    a.download = `${current?.title || 'diagrama'}.svg`; a.click(); URL.revokeObjectURL(url)
  }

  const downloadPNG = async () => {
    const svg = getSvgEl(); if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = svg.getBoundingClientRect().width * scale
    canvas.height = svg.getBoundingClientRect().height * scale
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png')
      a.download = `${current?.title || 'diagrama'}.png`; a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const downloadPDF = async () => {
    const svg = getSvgEl(); if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const rect = svg.getBoundingClientRect()
    canvas.width = rect.width * 2; canvas.height = rect.height * 2
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const doc = new jsPDF({ orientation: rect.width > rect.height ? 'landscape' : 'portrait', unit: 'px', format: [rect.width + 40, rect.height + 60] })
      doc.setFontSize(11); doc.setTextColor(20, 184, 166); doc.text('MedStudy AI — ' + (current?.title || ''), 20, 20)
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 30, rect.width, rect.height)
      doc.save(`${current?.title || 'diagrama'}.pdf`)
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const suggestions = ['Fisiopatología del IAM', 'Cascada de coagulación', 'Respuesta inflamatoria', 'Mecanismo de los IBP']

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <GitBranch size={18} className="text-teal-400" />
        <h1 className="text-lg font-bold text-[#e5e5e5]">Diagramas</h1>
        <div className="ml-auto flex gap-1">
          {['generate', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? 'bg-[#1a1a1a] text-[#e5e5e5]' : 'text-[#525252] hover:text-[#737373]'}`}>
              {v === 'generate' ? 'Generar' : `Historial (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      {view === 'generate' && (
        <>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-5">
            <div className="flex gap-2 mb-4">
              {['topic', 'file'].map(m => (
                <button key={m} onClick={() => { setMode(m); setDocId(null); setUploadMsg('') }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-[#525252] hover:text-[#737373]'}`}>
                  {m === 'topic' ? 'Por tema' : 'Desde archivo'}
                </button>
              ))}
            </div>

            {mode === 'file' && (
              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <input type="file" accept={ALLOWED} onChange={e => { setFile(e.target.files[0]); setDocId(null); setUploadMsg('') }}
                    className="text-sm text-[#737373] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1a1a1a] file:text-[#e5e5e5] file:text-sm" />
                  <button onClick={handleUpload} disabled={!file}
                    className="px-3 py-1.5 bg-[#1a1a1a] text-sm text-[#e5e5e5] rounded-lg hover:bg-[#2a2a2a] disabled:opacity-40 flex items-center gap-1.5">
                    <Upload size={13} /> Procesar
                  </button>
                </div>
                {uploadMsg && <p className={`text-xs ${docId ? 'text-teal-400' : 'text-[#737373]'}`}>{uploadMsg}</p>}
              </div>
            )}

            <p className="text-xs text-[#525252] mb-2">Tipo de diagrama</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {DIAGRAM_TYPES.map(t => (
                <button key={t.id} onClick={() => setDiagramType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${diagramType === t.id ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-[#111111] text-[#525252] border border-[#1a1a1a] hover:text-[#737373]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder={mode === 'file' ? 'Aspecto a diagramar del archivo' : 'Ej: Fisiopatología del shock séptico'}
                className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50" />
              <button onClick={handleGenerate} disabled={loading || !topic.trim() || (mode === 'file' && !docId)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />} Generar
              </button>
            </div>
            {mode === 'topic' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setTopic(s)}
                    className="px-2.5 py-1 text-xs text-[#525252] bg-[#111111] border border-[#1a1a1a] rounded-lg hover:text-[#737373] transition-all">{s}</button>
                ))}
              </div>
            )}
          </div>

          {current && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
              {current.error
                ? <p className="text-sm text-red-400">{current.error}</p>
                : <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[#e5e5e5]">{current.title}</p>
                    <div className="flex gap-2">
                      {[['SVG', downloadSVG], ['PNG', downloadPNG], ['PDF', downloadPDF]].map(([label, fn]) => (
                        <button key={label} onClick={fn}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#e5e5e5] bg-[#111111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg transition-all">
                          <Download size={12} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MermaidDiagram code={current.mermaid_code} />
                </>
              }
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && <p className="text-sm text-[#525252] text-center py-12">No hay diagramas guardados aún</p>}
          {history.map(d => (
            <div key={d.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#111111] transition-all"
                onClick={() => { setCurrent(d); setView('generate') }}>
                <GitBranch size={13} className="text-teal-500 flex-shrink-0" />
                <span className="text-sm text-[#a3a3a3] truncate flex-1">{d.title}</span>
                <button onClick={e => handleDelete(d.id, e)} className="text-[#404040] hover:text-red-400 transition-all flex-shrink-0">
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={13} className="text-[#404040] flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
