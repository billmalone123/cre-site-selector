import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'

interface Props {
  onSearch: (query: string) => void
}

const suggestions = [
  'things to do in NYC',
  'rooftop bars near me',
  'outdoor activities',
  'best hidden gems',
  'date night ideas',
  'free events this weekend',
]

export function LandingPage({ onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(query.trim())
  }

  function handleSuggestion(s: string) {
    setQuery(s)
    onSearch(s)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-green-400/8 rounded-full blur-3xl pointer-events-none" />

      {/* Floating map dots decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '15%', left: '10%', color: '#ea580c', size: 10, delay: '0s' },
          { top: '25%', left: '80%', color: '#16a34a', size: 8, delay: '0.5s' },
          { top: '60%', left: '8%', color: '#9333ea', size: 12, delay: '1s' },
          { top: '70%', left: '85%', color: '#db2777', size: 9, delay: '1.5s' },
          { top: '40%', left: '90%', color: '#4338ca', size: 7, delay: '0.3s' },
          { top: '80%', left: '20%', color: '#2563eb', size: 11, delay: '0.8s' },
          { top: '10%', left: '55%', color: '#ea580c', size: 7, delay: '1.2s' },
          { top: '50%', left: '3%', color: '#16a34a', size: 9, delay: '0.6s' },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse opacity-40"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              animationDelay: dot.delay,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-10 z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <MapPin size={28} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight">GoDo</h1>
        </div>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Discover what's fun, right where you are.
        </p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl z-10">
        <div
          className={`relative flex items-center bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
            focused ? 'ring-4 ring-emerald-400/40 shadow-emerald-500/20' : ''
          }`}
        >
          <Search
            size={20}
            className="absolute left-5 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="What do you want to do today?"
            className="flex-1 pl-14 pr-4 py-5 text-lg text-gray-800 bg-transparent rounded-2xl focus:outline-none placeholder:text-gray-400"
            autoFocus
          />
          <button
            type="submit"
            className="mr-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
          >
            Explore
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestion(s)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all border border-white/10 hover:border-white/25"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Bottom tagline */}
      <p className="absolute bottom-8 text-slate-600 text-xs tracking-widest uppercase">
        Powered by real people, real reviews
      </p>
    </div>
  )
}
