import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[rgba(100,130,200,0.15)] bg-[rgba(10,16,35,0.7)] px-3.5 py-2 text-sm text-[#c8d8f0] placeholder:text-[#3d5270] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5271ff]/30 focus:border-[rgba(82,113,255,0.4)] focus:bg-[rgba(10,16,35,0.95)] hover:border-[rgba(100,130,200,0.25)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
