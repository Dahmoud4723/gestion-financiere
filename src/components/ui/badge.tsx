import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all",
  {
    variants: {
      variant: {
        default:     "bg-slate-700/80 text-slate-200 border border-slate-600/40",
        primary:     "bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-sm shadow-blue-500/10",
        success:     "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-sm shadow-emerald-500/10",
        destructive: "bg-red-500/15 text-red-300 border border-red-500/25 shadow-sm shadow-red-500/10",
        warning:     "bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-sm shadow-amber-500/10",
        outline:     "border border-slate-600/60 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
