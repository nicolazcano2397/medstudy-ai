import { useState, useEffect } from 'react'
import { FileQuestion, Loader2, CheckCircle, XCircle, Upload, Trash2, ChevronRight } from 'lucide-react'
import { quizzesAPI, documentsAPI } from '../services/api'

const ALLOWED = '.pdf,.ppt,.pptx,.doc,.docx'
const QUIZ_TYPES = [
  { id: 'multiple_choice', label: 'Selección múltiple' },
  { id: 'true_false', label: 'Verdadero / Falso' },
  { id: 'development', label: 'Desarrollo' },
  { id: 'clinical_case', label: 'Caso clínico' },
]

export default function QuizzesPage() {
  const [topic, setTopic] = useState('')
  const [quizType, setQuizType] = useState('multiple_choice')
  const [numQ, setNumQ] = useState(5)
  const [mode, setMode] = useState('topic')
  const [file, setFile] = useState(null)
  const [docId, setDocId] = useState(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [clinicalAnswer, setClinicalAnswer] = useState('')
  const [devAnswers, setDevAnswers] = useState({})
  const [devFeedback, setDevFeedback] = useState({})
  const [devLoading, setDevLoading] = useState({})
  const [evaluation, setEvaluation] = useState(null)
  const [history, setHistory] = useState([])
  const [view, setView] = useState('generate')

  const loadHistory = () => quizzesAPI.list().then(r => setHistory(r.data)).catch(() => {})
  useEffect(() => { loadHistory() }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploadMsg('Procesando...')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await documentsAPI.upload(fd)
      setDocId(r.data.id); setUploadMsg(`Listo: ${r.data.char_count.toLocaleString()} caracteres`)
    } catch { setUploadMsg('Error al procesar') }
  }

  const reset = (keepQuiz = false) => {
    if (!keepQuiz) setQuiz(null)
    setAnswers({}); setSubmitted(false)
    setEvaluation(null); setClinicalAnswer('')
    setDevAnswers({}); setDevFeedback({}); setDevLoading({})
  }

  const handleGenerate = async () => {
    if (!topic.trim() || (mode === 'file' && !docId)) return
    setLoading(true); reset(false)
    try {
      const payload = { topic, quiz_type: quizType, num_questions: numQ, ...(mode === 'file' && docId ? { document_id: docId } : {}) }
      const r = await quizzesAPI.generate(payload)
      setQuiz(r.data); loadHistory()
    } catch (e) { alert(e.response?.data?.detail || 'Error al generar') }
    setLoading(false)
  }

  const handleDelete = async (id, e) => {
    e?.stopPropagation()
    await quizzesAPI.delete(id).catch(() => {})
    loadHistory()
    if (quiz?.id === id) reset()
  }

  const handleEvalDev = async (qId) => {
    if (!devAnswers[qId]?.trim()) return
    setDevLoading(prev => ({ ...prev, [qId]: true }))
    try {
      const r = await quizzesAPI.evaluateDevelopment({ quiz_id: quiz.id, question_id: qId, user_response: devAnswers[qId] })
      setDevFeedback(prev => ({ ...prev, [qId]: r.data }))
    } catch (e) { alert(e.response?.data?.detail || 'Error al evaluar') }
    setDevLoading(prev => ({ ...prev, [qId]: false }))
  }

  // Multiple choice
  const renderMC = () => {
    const { questions } = quiz.content
    const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : null
    return (
      <div className="space-y-5">
        {submitted && (
          <div className="flex items-center gap-3 px-4 py-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
            <CheckCircle size={16} className="text-teal-400" />
            <span className="text-sm font-medium text-teal-300">Resultado: {score}/{questions.length} correctas</span>
          </div>
        )}
        {questions.map(q => (
          <div key={q.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-sm text-[#e5e5e5] mb-3 leading-relaxed">{q.id}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map(opt => {
                const letter = opt[0]
                const isSelected = answers[q.id] === letter
                const isCorrect = submitted && letter === q.correct
                const isWrong = submitted && isSelected && letter !== q.correct
                return (
                  <button key={opt} onClick={() => !submitted && setAnswers(a => ({ ...a, [q.id]: letter }))}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border ${isCorrect ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : isWrong ? 'bg-red-500/20 border-red-500/40 text-red-300' : isSelected ? 'bg-[#1a1a1a] border-teal-500/30 text-[#e5e5e5]' : 'border-[#1a1a1a] text-[#737373] hover:border-[#2a2a2a] hover:text-[#a3a3a3]'}`}>
                    {opt}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <div className="mt-3 px-4 py-3 bg-[#111111] rounded-lg border border-[#1a1a1a]">
                <p className="text-xs text-[#737373] leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
        {!submitted && Object.keys(answers).length > 0 && (
          <button onClick={() => setSubmitted(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-all">
            Ver respuestas correctas
          </button>
        )}
      </div>
    )
  }

  // True / False
  const renderTF = () => {
    const { questions } = quiz.content
    const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : null
    return (
      <div className="space-y-4">
        {submitted && (
          <div className="flex items-center gap-3 px-4 py-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
            <CheckCircle size={16} className="text-teal-400" />
            <span className="text-sm font-medium text-teal-300">Resultado: {score}/{questions.length} correctas</span>
          </div>
        )}
        {questions.map(q => {
          const sel = answers[q.id]
          const correct = q.correct === true || q.correct === 'true'
          return (
            <div key={q.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-sm text-[#e5e5e5] mb-3 leading-relaxed">{q.id}. {q.statement}</p>
              <div className="flex gap-2">
                {[true, false].map(val => {
                  const label = val ? 'Verdadero' : 'Falso'
                  const isSelected = sel === val
                  const isCorrect = submitted && val === correct
                  const isWrong = submitted && isSelected && val !== correct
                  return (
                    <button key={label} onClick={() => !submitted && setAnswers(a => ({ ...a, [q.id]: val }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${isCorrect ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : isWrong ? 'bg-red-500/20 border-red-500/40 text-red-300' : isSelected ? 'bg-[#1a1a1a] border-teal-500/30 text-[#e5e5e5]' : 'border-[#1a1a1a] text-[#737373] hover:border-[#2a2a2a]'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <div className="mt-3 px-4 py-3 bg-[#111111] rounded-lg border border-[#1a1a1a]">
                  <p className="text-xs text-[#737373] leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
        {!submitted && Object.keys(answers).length > 0 && (
          <button onClick={() => setSubmitted(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-all">
            Ver respuestas correctas
          </button>
        )}
      </div>
    )
  }

  // Development
  const renderDev = () => (
    <div className="space-y-5">
      {quiz.content.questions.map(q => (
        <div key={q.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
          <p className="text-sm text-[#e5e5e5] mb-3 leading-relaxed">{q.id}. {q.question}</p>
          {!devFeedback[q.id] ? (
            <>
              <textarea value={devAnswers[q.id] || ''} onChange={e => setDevAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full h-28 bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm text-[#e5e5e5] placeholder-[#404040] resize-none focus:outline-none focus:border-teal-500/50" />
              <button onClick={() => handleEvalDev(q.id)} disabled={devLoading[q.id] || !devAnswers[q.id]?.trim()}
                className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-2">
                {devLoading[q.id] ? <Loader2 size={12} className="animate-spin" /> : null} Evaluar
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#111111] border border-teal-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-teal-300">{devFeedback[q.id].score?.toFixed(1)}</span>
                  <span className="text-xs text-[#525252]">/ 10</span>
                </div>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">{devFeedback[q.id].feedback}</p>
              </div>
              {devFeedback[q.id].missing_points?.length > 0 && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-red-400 mb-1">Puntos omitidos</p>
                  {devFeedback[q.id].missing_points.map((p, i) => (
                    <p key={i} className="text-xs text-[#a3a3a3] flex gap-2"><XCircle size={11} className="text-red-400 mt-0.5 flex-shrink-0" />{p}</p>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 bg-[#111111] border border-[#1a1a1a] rounded-lg">
                <p className="text-xs font-semibold text-[#525252] mb-1">Respuesta modelo</p>
                <p className="text-xs text-[#737373] leading-relaxed">{q.model_answer}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // Clinical case
  const renderClinical = () => (
    <div className="space-y-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Caso clínico</p>
        <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{quiz.content.case}</p>
      </div>
      {!evaluation ? (
        <div className="space-y-3">
          <textarea value={clinicalAnswer} onChange={e => setClinicalAnswer(e.target.value)}
            placeholder="Escribe tu diagnóstico y plan de manejo..."
            className="w-full h-36 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-[#e5e5e5] placeholder-[#404040] resize-none focus:outline-none focus:border-teal-500/50" />
          <button onClick={async () => {
            if (!clinicalAnswer.trim()) return
            setLoading(true)
            try { const r = await quizzesAPI.evaluateClinical({ quiz_id: quiz.id, user_response: clinicalAnswer }); setEvaluation(r.data) }
            catch (e) { alert(e.response?.data?.detail || 'Error al evaluar') }
            setLoading(false)
          }} disabled={loading || !clinicalAnswer.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null} Evaluar respuesta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-[#0d0d0d] border border-teal-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold text-teal-300">{evaluation.score?.toFixed(1)}</span>
              <span className="text-sm text-[#525252]">/ 10</span>
              <span className="ml-auto text-xs text-[#525252]">Dx: {evaluation.diagnosis_score} · Tto: {evaluation.treatment_score}</span>
            </div>
            <p className="text-sm text-[#a3a3a3] leading-relaxed">{evaluation.feedback}</p>
          </div>
          {evaluation.omissions?.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 mb-2">Puntos omitidos</p>
              {evaluation.omissions.map((o, i) => <p key={i} className="text-xs text-[#a3a3a3] flex gap-2"><XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />{o}</p>)}
            </div>
          )}
          {evaluation.strengths?.length > 0 && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-teal-400 mb-2">Fortalezas</p>
              {evaluation.strengths.map((s, i) => <p key={i} className="text-xs text-[#a3a3a3] flex gap-2"><CheckCircle size={12} className="text-teal-400 mt-0.5 flex-shrink-0" />{s}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderQuiz = () => {
    const type = quiz?.content?.type
    if (type === 'multiple_choice') return renderMC()
    if (type === 'true_false') return renderTF()
    if (type === 'development') return renderDev()
    if (type === 'clinical_case') return renderClinical()
    return null
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileQuestion size={18} className="text-teal-400" />
        <h1 className="text-lg font-bold text-[#e5e5e5]">Cuestionarios</h1>
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

            <p className="text-xs text-[#525252] mb-2">Tipo de cuestionario</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUIZ_TYPES.map(t => (
                <button key={t.id} onClick={() => setQuizType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${quizType === t.id ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-[#111111] text-[#525252] border border-[#1a1a1a] hover:text-[#737373]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder={mode === 'file' ? 'Tema o aspecto del archivo' : 'Tema (ej: Insuficiencia cardíaca, Sepsis)'}
                className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50" />
              {quizType !== 'clinical_case' && (
                <select value={numQ} onChange={e => setNumQ(Number(e.target.value))}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:outline-none">
                  {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} preg.</option>)}
                </select>
              )}
              <button onClick={handleGenerate} disabled={loading || !topic.trim() || (mode === 'file' && !docId)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <FileQuestion size={14} />} Generar
              </button>
            </div>
          </div>

          {quiz && (
            <div className="mb-5">
              <p className="text-sm font-medium text-[#e5e5e5] mb-4">{quiz.title}</p>
              {renderQuiz()}
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && <p className="text-sm text-[#525252] text-center py-12">No hay cuestionarios guardados aún</p>}
          {history.map(q => (
            <div key={q.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#111111] transition-all"
                onClick={() => { try { setQuiz({ id: q.id, title: q.title, content: JSON.parse(q.content) }); reset(true); setView('generate') } catch {} }}>
                <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${q.quiz_type === 'multiple_choice' ? 'bg-blue-500/10 text-blue-400' : q.quiz_type === 'development' ? 'bg-purple-500/10 text-purple-400' : q.quiz_type === 'true_false' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {QUIZ_TYPES.find(t => t.id === q.quiz_type)?.label || q.quiz_type}
                </span>
                <span className="text-sm text-[#a3a3a3] truncate flex-1">{q.topic}</span>
                <button onClick={e => handleDelete(q.id, e)} className="text-[#404040] hover:text-red-400 transition-all flex-shrink-0">
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
