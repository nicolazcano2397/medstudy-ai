import { useState, useEffect } from 'react'
import { Folder, FolderPlus, Trash2, Upload, FileText } from 'lucide-react'
import { foldersAPI, documentsAPI } from '../services/api'

export default function FoldersPage() {
  const [folders, setFolders] = useState([])
  const [selected, setSelected] = useState(null)
  const [docs, setDocs] = useState([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadFolders = () => foldersAPI.list().then(r => setFolders(r.data)).catch(() => {})
  const loadDocs = (fid) => documentsAPI.list({ folder_id: fid }).then(r => setDocs(r.data)).catch(() => {})

  useEffect(() => { loadFolders() }, [])
  useEffect(() => { if (selected) loadDocs(selected.id) }, [selected])

  const handleCreate = async () => {
    if (!newName.trim()) return
    await foldersAPI.create({ name: newName, description: newDesc })
    setNewName(''); setNewDesc(''); setShowForm(false)
    loadFolders()
  }

  const handleDelete = async (id) => {
    await foldersAPI.delete(id)
    if (selected?.id === id) { setSelected(null); setDocs([]) }
    loadFolders()
  }

  const handleUpload = async () => {
    if (!uploadFile || !selected) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('folder_id', selected.id)
    try {
      await documentsAPI.upload(fd)
      setUploadFile(null)
      loadDocs(selected.id)
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al subir')
    }
    setUploading(false)
  }

  const handleDeleteDoc = async (id) => {
    await documentsAPI.delete(id)
    loadDocs(selected.id)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Folder size={18} className="text-teal-400" />
        <h1 className="text-lg font-bold text-[#e5e5e5]">Carpetas</h1>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-lg transition-all">
          <FolderPlus size={13} /> Nueva carpeta
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-4">
          <div className="space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nombre de la carpeta (ej: Cardiología)"
              className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50" />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#404040] focus:outline-none focus:border-teal-500/50" />
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all">
                Crear
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[#525252] hover:text-[#737373] transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {folders.map(f => (
          <div key={f.id}
            onClick={() => setSelected(f)}
            className={`bg-[#0d0d0d] border rounded-xl p-4 cursor-pointer transition-all group ${selected?.id === f.id ? 'border-teal-500/40 bg-teal-500/5' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'}`}>
            <div className="flex items-start justify-between">
              <Folder size={20} className={selected?.id === f.id ? 'text-teal-400' : 'text-[#525252]'} />
              <button onClick={e => { e.stopPropagation(); handleDelete(f.id) }}
                className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-red-400 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
            <p className="text-sm font-medium text-[#e5e5e5] mt-2">{f.name}</p>
            {f.description && <p className="text-xs text-[#525252] mt-0.5 truncate">{f.description}</p>}
          </div>
        ))}
        {folders.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[#404040] text-sm">
            Crea tu primera carpeta para organizar el material
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Folder size={14} className="text-teal-400" />
            <span className="text-sm font-medium text-[#e5e5e5]">{selected.name}</span>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="file" accept=".pdf,.ppt,.pptx"
              onChange={e => setUploadFile(e.target.files[0])}
              className="text-sm text-[#737373] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1a1a1a] file:text-[#e5e5e5] file:text-sm" />
            <button onClick={handleUpload} disabled={!uploadFile || uploading}
              className="px-3 py-1.5 bg-[#1a1a1a] text-sm text-[#e5e5e5] rounded-lg hover:bg-[#2a2a2a] disabled:opacity-40 transition-all flex items-center gap-1.5">
              <Upload size={13} /> {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
          {docs.length > 0 ? (
            <div className="space-y-1">
              {docs.map(d => (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1a1a1a] group">
                  <FileText size={13} className="text-[#525252] flex-shrink-0" />
                  <span className="text-sm text-[#a3a3a3] flex-1 truncate">{d.title}</span>
                  <span className="text-xs text-[#404040]">{d.file_type?.toUpperCase()}</span>
                  <button onClick={() => handleDeleteDoc(d.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#404040] text-center py-6">Sube PDFs o PPTs a esta carpeta</p>
          )}
        </div>
      )}
    </div>
  )
}
