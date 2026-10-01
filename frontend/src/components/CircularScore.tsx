import type { Priority } from '../types/lead'

interface CircularScoreProps {
  score: number
  priority: Priority
  size?: 'sm' | 'md' | 'lg'
}

/**
 * CircularScore
 *
 * Professional CRM circular progress indicator for lead priority score (0–100).
 * Displays numeric score, /100 indicator, and priority badge (HOT/WARM/COLD).
 */
export default function CircularScore({ score, priority, size = 'sm' }: CircularScoreProps) {
  const dim = size === 'sm' ? 56 : size === 'md' ? 72 : 84
  const strokeWidth = size === 'sm' ? 4 : 5
  const radius = (dim - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  const colors: Record<Priority, { stroke: string; text: string; bg: string }> = {
    HOT: { stroke: '#DC2626', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    WARM: { stroke: '#D97706', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    COLD: { stroke: '#64748B', text: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg height={dim} width={dim} className="transform -rotate-90">
          {/* Track Circle */}
          <circle
            stroke="#E2E8F0"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={dim / 2}
            cy={dim / 2}
          />
          {/* Progress Circle */}
          <circle
            stroke={colors[priority].stroke}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.4s ease-in-out' }}
            strokeLinecap="round"
            r={radius}
            cx={dim / 2}
            cy={dim / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-extrabold text-slate-900 leading-none ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {clampedScore}
          </span>
          <span className="text-[9px] font-semibold text-slate-500 leading-tight">
            /100
          </span>
        </div>
      </div>
      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${colors[priority].bg} ${colors[priority].text}`}>
        {priority}
      </span>
    </div>
  )
}
