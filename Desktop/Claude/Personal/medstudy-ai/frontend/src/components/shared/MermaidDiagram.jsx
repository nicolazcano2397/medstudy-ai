import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#111111',
    primaryColor: '#1d4ed8',
    primaryTextColor: '#e5e5e5',
    lineColor: '#404040',
    fontSize: '14px',
  }
})

export default function MermaidDiagram({ code }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !code) return
    const id = `mermaid-${Date.now()}`
    mermaid.render(id, code).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg
    }).catch(console.error)
  }, [code])
  return <div ref={ref} className="mermaid w-full overflow-x-auto p-4" />
}
