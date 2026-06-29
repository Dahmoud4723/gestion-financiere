import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5271ff]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06091b] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#5271ff] to-[#7c5fff] text-white shadow-lg shadow-[#5271ff]/20 hover:from-[#6480ff] hover:to-[#8b6fff] hover:shadow-[#5271ff]/30 hover:-translate-y-px",
        destructive:
          "bg-gradient-to-r from-[#ff4d72] to-[#e0325a] text-white shadow-lg shadow-[#ff4d72]/20 hover:from-[#ff6384] hover:to-[#f04470] hover:-translate-y-px",
        outline:
          "border border-[rgba(100,130,200,0.2)] bg-white/[0.03] text-[#c8d8f0] backdrop-blur-sm hover:bg-white/[0.06] hover:border-[rgba(100,130,200,0.35)] hover:text-white hover:-translate-y-px",
        ghost:
          "text-[#8aa4c8] hover:bg-white/[0.05] hover:text-white",
        link:
          "text-[#7da8ff] underline-offset-4 hover:underline hover:text-[#a0c0ff]",
        success:
          "bg-gradient-to-r from-[#00c9a7] to-[#00a896] text-white shadow-lg shadow-[#00c9a7]/20 hover:from-[#00d9b5] hover:to-[#00baa6] hover:-translate-y-px",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 rounded-lg px-3 text-xs",
        lg:      "h-12 rounded-xl px-7 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
