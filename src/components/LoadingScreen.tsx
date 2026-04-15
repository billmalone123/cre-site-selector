import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

interface Props {
  query: string
  onDone: () => void
}

const steps = [
  'Scanning your area...',
  'Finding hidden gems...',
  'Reading fresh reviews...',
  'Building your map...',
]

export function LoadingScreen({ query, onDone }: Props) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalMs = 2600
    const tickMs = 50
    let elapsed = 0

    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1))
    }, 600)

    const progressInterval = setInterval(() => {
      elapsed += tickMs
      const pct = Math.min((elapsed / totalMs) * 100, 100)
      setProgress(pct)
      if (elapsed >= totalMs) {
        clearInterval(progressInterval)
        onDone()
      }
    }, tickMs)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [onDone])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col items-center justify-center px-4">

      {/* Pulsing logo */}
      <div className="relative mb-10">
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
          <MapPin size={36} className="text-white" />
        </div>
        {/* Ripple rings */}
        <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 animate-ping" />
      </div>

      {/* Query echo */}
      {query && (
        <p className="text-slate-400 text-sm mb-2 tracking-wide">
          Searching for <span className="text-emerald-400 font-semibold">"{query}"</span>
        </p>
      )}

      {/* Step text */}
      <p className="text-white text-xl font-semibold mb-8 transition-all duration-300 h-8">
        {steps[step]}
      </p>

      {/* Progress bar */}
      <div className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '20%', left: '15%', color: '#ea580c', delay: '0s' },
          { top: '30%', left: '75%', color: '#16a34a', delay: '0.4s' },
          { top: '65%', left: '10%', color: '#9333ea', delay: '0.8s' },
          { top: '75%', left: '80%', color: '#db2777', delay: '1.2s' },
          { top: '45%', left: '88%', color: '#4338ca', delay: '0.2s' },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-pulse opacity-30"
            style={{
              top: dot.top,
              left: dot.left,
              backgroundColor: dot.color,
              animationDelay: dot.delay,
              animationDuration: '2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
