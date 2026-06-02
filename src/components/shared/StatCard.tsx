import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: string
  trendUp?: boolean
}

export function StatCard({ title, value, icon: Icon, iconColor = 'text-blue-400', iconBg = 'bg-blue-900/40', trend, trendUp }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend}
        </p>
      )}
    </div>
  )
}
