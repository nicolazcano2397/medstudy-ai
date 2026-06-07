import { useState, useEffect } from 'react'
import { ClipboardList, Upload, FileText, Loader2, Download, Trash2, ChevronRight } from 'lucide-react'
import { summariesAPI, documentsAPI } from '../services/api'
import jsPDF from 'jspdf'

const TYPES = [
  { id: 'executive', label: 'Resumen ejecutivo' },
  { id: 'bullets', label: 'Puntos clave' },
  { id: 'mechanism', label: 'Mecanismo / Fisiopatología' },
  { id: 'flashcards', label: 'Flashcards Anki' },
]
const ALLOWED = '.pdf,.ppt,.pptx,.doc,.docx'

function FlashcardsView({ cards }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const go = (dir) => { setIdx(i => i + dir); setFlipped(false) }
  const card = cards[idx]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[#525252]">
        <span>Tarjeta {idx + 1} de {cards.length}</span>
        <span className="text-teal-500/60">Clic para voltear</span>
      </div>

      <div
        onClick={() => setFlipped(f => !f)}
        className="relative cursor-pointer select-none"
        style={{ height: '200px', perspective: '1000px' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <div
            className="absolute inset-0 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm font-medium text-teal-200 text-center leading-relaxed">{card.front}</p>
          </div>
          <div
            className="absolute inset-0 bg-[#111111] border border-[#2a2a2a] rounded-xl flex items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-sm text-[#a3a3a3] text-center leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => go(-1)} disabled={idx === 0}
          className="px-4 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-sm text-[#737373] hover:text-[#e5e5e5] disabled:opacity-30 transition-all"
        >← Anterior</button>
        <button
          onClick={() => setFlipped(f => !f)}
          className="px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-lg text-sm text-teal-300 hover:bg-teal-500/30 transition-all"
        >Voltear</button>
        <button
          onClick={() => go(1)} disabled={idx === cards.length - 1}
          className="px-4 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-sm text-[#737373] hover:text-[#e5e5e5] disabled:opacity-30 transition-all"
        >Siguiente →</button>
      </div>

      <div className="flex justify-center gap-1 flex-wrap pt-1">
        {cards.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setFlipped(false) }}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-teal-400 scale-125' : 'bg-[#2a2a2a] hover:bg-[#404040]'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function SummariesPage() {
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [docId, setDocId] = useState(null)
  const [summaryType, setSummaryType] = useState('executive')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [uploadMsg, setUploadMsg] = useState('')
  const [view, setView] = useState('generate') // 'generate' | 'history'

  const loadHistory = () => summariesAPI.list().then(r => setHistory(r.data)).catch(() => {})
  useEffect(() => { loadHistory() }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploadMsg('Procesando...')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await documentsAPI.upload(fd)
      setDocId(r.data.id)
      setUploadMsg(`Listo: ${r.data.char_count.toLocaleString()} caracteres`)
    } catch { setUploadMsg('Error al procesar el archivo') }
  }

  const handleGenerate = async () => {
    if (mode === 'text' && !text.trim()) return
    if (mode === 'file' && !docId) return
    setLoading(true); setResult(null)
    try {
      const payload = mode === 'text' ? { text, summary_type: summaryType } : { document_id: docId, summary_type: summaryType }
      const r = await summariesAPI.generate(payload)
      setResult(r.data)
      loadHistory()
    } catch (e) {
      setResult({ error: e.response?.data?.detail || 'Error al generar' })
    }
    setLoading(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    await summariesAPI.delete(id).catch(() => {})
    loadHistory()
    if (result?.id === id) setResult(null)
  }

  const downloadPDF = (content, type) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const label = TYPES.find(t => t.id === type)?.label || type
    const marginL = 18, marginR = 18
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const maxW = pageW - marginL - marginR
    let y = 18

    const checkPage = (needed = 8) => {
      if (y + needed > pageH - 14) { doc.addPage(); y = 18 }
    }

    // Header
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 184, 166)
    doc.text('MedStudy AI', marginL, y); y += 7
    doc.setFontSize(12); doc.setTextColor(40, 40, 40); doc.text(label, marginL, y); y += 4
    doc.setDrawColor(200, 200, 200); doc.line(marginL, y, pageW - marginR, y); y += 6

    // Clean markdown and render lines
    let body = content
    if (type === 'flashcards') {
      try { body = JSON.parse(content).map((c, i) => `${i+1}. ${c.front}\n   → ${c.back}`).join('\n\n') } catch {}
    }

    // Strip markdown symbols
    const cleanLine = (line) => line
      .replace(/^#{1,3}\s*/, '')           // remove # headers
      .replace(/\*\*(.+?)\*\*/g, '$1')     // remove **bold**
      .replace(/\*(.+?)\*/g, '$1')         // remove *italic*
      .replace(/^---+$/, '───────────────────────────────────────────')
      .replace(/^- /, '• ')

    const lines = body.split('\n')

    for (const rawLine of lines) {
      const line = cleanLine(rawLine)
      checkPage()

      // Separator line
      if (line.startsWith('───')) {
        doc.setDrawColor(220, 220, 220)
        doc.line(marginL, y, pageW - marginR, y)
        y += 4; continue
      }

      // Empty line
      if (line.trim() === '') { y += 3; continue }

      // Section heading: all caps + short = title
      const isHeading = line === line.toUpperCase() && line.trim().length > 3 && line.trim().length < 80
      const isNumberedSection = /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(line) && line.length < 80

      if (isHeading || isNumberedSection) {
        checkPage(10)
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 184, 166)
        const wrapped = doc.splitTextToSize(line.trim(), maxW)
        wrapped.forEach(l => { checkPage(); doc.text(l, marginL, y); y += 5 })
        y += 1
      } else {
        doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 55)
        const wrapped = doc.splitTextToSize(line.trim(), maxW)
        wrapped.forEach(l => { checkPage(); doc.text(l, marginL, y); y += 5 })
      }
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(180, 180, 180)
      doc.text(`MedStudy AI · ${label} · Pág. ${i}/${totalPages}`, marginL, pageH - 8)
    }

    doc.save(`resumen-${type}-${Date.now()}.pdf`)
  }

  const downloadTXT = (content, type) => {
    let body = content
    if (type === 'flashcards') {
      try { body = JSON.parse(content).map((c, i) => `${i+1}.\nP: ${c.front}\nR: ${c.back}`).join('\n\n') } catch {}
    }
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `resumen-${type}-${Date.now()}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  const renderContent = (content, type) => {
    if (type === 'flashcards') {
      try {
        const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
        const cards = JSON.parse(clean)
        if (Array.isArray(cards) && cards.length > 0) return <FlashcardsView cards={cards} />
      } catch {}
    }
    return <p className="text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">{content}</p>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList size={18} className="text-teal-400" />
        <h1 className="text-lg font-bold text-[#e5e5e5]">Resúmenes</h1>
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
              {['text', 'file'].map(m => (
                <button key={m} onClick={() => { setMode(m); setDocId(null); setUploadMsg('') }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-[#525252] hover:text-[#737373]'}`}>
                  {m === 'text' ? 'Pegar texto' : 'Subir archivo'}
                </button>
              ))}
            </div>
            {mode === 'text'
              ? <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Pega aquí el texto médico..."
                  className="w-full h-40 bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-[#e5e5e5] placeholder-[#404040] resize-none focus:outline-none focus:border-teal-500/50" />
              : <div className="space-y-2">
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
            }
            <div className="flex flex-wrap gap-2 mt-4">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setSummaryType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${summaryType === t.id ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-[#111111] text-[#525252] border border-[#1a1a1a] hover:text-[#737373]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={loading || (mode === 'text' && !text.trim()) || (mode === 'file' && !docId)}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generando...</> : 'Generar'}
            </button>
          </div>

          {result && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-teal-400" />
                <span className="text-sm font-medium text-[#e5e5e5] flex-1">{TYPES.find(t => t.id === summaryType)?.label}</span>
                {!result.error && (
                  <div className="flex gap-2">
                    <button onClick={() => downloadPDF(result.content, summaryType)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#e5e5e5] bg-[#111111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg transition-all">
                      <Download size={12} /> PDF
                    </button>
                    <button onClick={() => downloadTXT(result.content, summaryType)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#e5e5e5] bg-[#111111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg transition-all">
                      <Download size={12} /> TXT
                    </button>
                  </div>
                )}
              </div>
              {result.error
                ? <p className="text-sm text-red-400">{result.error}</p>
                : <div className={summaryType === 'flashcards' ? 'space-y-3' : ''}>{renderContent(result.content, summaryType)}</div>
              }
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && <p className="text-sm text-[#525252] text-center py-12">No hay resúmenes guardados aún</p>}
          {history.map(s => (
            <div key={s.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#111111] transition-all"
                onClick={() => { setResult({ content: s.content, summary_type: s.summary_type, id: s.id }); setSummaryType(s.summary_type); setView('generate') }}>
                <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded flex-shrink-0">{s.summary_type}</span>
                <p className="text-sm text-[#a3a3a3] truncate flex-1">
                  {s.summary_type === 'flashcards'
                    ? (() => { try { const c = JSON.parse(s.content.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()); return `${c.length} tarjetas` } catch { return s.content.slice(0,100) } })()
                    : s.content.slice(0, 100) + '…'}
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); downloadPDF(s.content, s.summary_type) }}
                    className="text-[#404040] hover:text-[#737373] transition-all"><Download size={13} /></button>
                  <button onClick={e => handleDelete(s.id, e)}
                    className="text-[#404040] hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                  <ChevronRight size={13} className="text-[#404040]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
