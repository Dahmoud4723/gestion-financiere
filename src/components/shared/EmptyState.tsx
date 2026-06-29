import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      {/* Icon container with glow */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-xl">
          <Icon className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
