import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await authAPI.login(password)
      localStorage.setItem('medstudy_token', r.data.token)
      navigate('/')
    } catch {
      setError('Contraseña incorrecta')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#e5e5e5]">MedStudy AI</h1>
          <p className="text-sm text-[#525252] mt-1">Ingresa la contraseña para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#737373] mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
