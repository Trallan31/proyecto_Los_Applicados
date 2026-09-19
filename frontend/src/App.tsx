import { useState } from 'react'
import OrganizerView from './OrganizerView'
import { ScrumView } from './ScrumView'
import './index.css'

export default function App() {
  const [view, setView] = useState<'organizer' | 'scrum'>('organizer')

  return (
    <div className="w-full h-full bg-[#0d0f14] text-white flex flex-col min-h-screen">
      <header className="h-16 bg-[#151820]/80 backdrop-blur-md border-b border-[#2a2f45] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f7cff] to-[#9b6dff] flex items-center justify-center shadow-lg shadow-[#4f7cff]/20">
            <span className="font-bold text-white text-xs">APP</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white/90">
            Applicate
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center w-1/3">
          <div className="bg-[#0d0f14] p-1 rounded-full flex gap-1 border border-[#2a2f45]/50 shadow-inner">
            <button 
              onClick={() => setView('organizer')}
              className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${view === 'organizer' ? 'bg-[#2a2f45] text-white shadow-md' : 'text-[#7c82a0] hover:text-[#e8eaf2]'}`}
            >
              Organizador Personal
            </button>
            <button 
              onClick={() => setView('scrum')}
              className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${view === 'scrum' ? 'bg-[#2a2f45] text-white shadow-md' : 'text-[#7c82a0] hover:text-[#e8eaf2]'}`}
            >
              Proyectos de Equipo
            </button>
          </div>
        </div>

        <div className="w-1/3 flex justify-end">
          <div className="w-8 h-8 rounded-full bg-[#2a2f45] border border-[#4a5070] flex items-center justify-center">
            <span className="text-xs font-semibold text-[#e8eaf2]">U</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        {view === 'organizer' ? <OrganizerView /> : <ScrumView />}
      </main>
    </div>
  )
}
