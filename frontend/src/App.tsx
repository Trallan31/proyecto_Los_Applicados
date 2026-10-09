import { useState } from 'react'
import OrganizerView from './OrganizerView'
import { ScrumView } from './ScrumView'
import { useTheme } from './context/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import './index.css'

export default function App() {
  const [view, setView] = useState<'organizer' | 'scrum'>('organizer')
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="w-full h-full bg-background text-text flex flex-col min-h-screen">
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f7cff] to-[#9b6dff] flex items-center justify-center shadow-lg shadow-[#4f7cff]/20">
            <span className="font-bold text-white text-xs">APP</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text">
            Applicate
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center w-1/3">
          <div className="bg-background p-1 rounded-full flex gap-1 border border-border shadow-inner">
            <button 
              onClick={() => setView('organizer')}
              className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${view === 'organizer' ? 'bg-panel text-text shadow-sm border border-border' : 'text-text-muted hover:text-text'}`}
            >
              Organizador Personal
            </button>
            <button 
              onClick={() => setView('scrum')}
              className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${view === 'scrum' ? 'bg-panel text-text shadow-sm border border-border' : 'text-text-muted hover:text-text'}`}
            >
              Proyectos de Equipo
            </button>
          </div>
        </div>

        <div className="w-1/3 flex items-center justify-end gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="p-2 rounded-lg bg-panel hover:bg-panel-hover text-text-muted hover:text-text border border-border transition-colors flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-panel border border-border flex items-center justify-center text-text">
            <span className="text-xs font-semibold">U</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        {view === 'organizer' ? <OrganizerView /> : <ScrumView />}
      </main>
    </div>
  )
}
