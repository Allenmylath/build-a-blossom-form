import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Dark Moss Green with Cornsilk text
        default: "bg-[#606c38] text-[#fefae0] hover:bg-[#4a5429] shadow-sm focus-visible:ring-[#606c38]",
        
        // Destructive: Tigers Eye for warning/delete actions
        destructive: "bg-[#bc6c25] text-[#fefae0] hover:bg-[#a15d20] focus-visible:ring-[#bc6c25]",
        
        // Outline: Pakistan Green border with transparent background
        outline: "border border-[#283618] bg-transparent text-[#283618] hover:bg-[#283618] hover:text-[#fefae0] focus-visible:ring-[#283618]",
        
        // Secondary: Earth Yellow with Pakistan Green text
        secondary: "bg-[#dda15e] text-[#283618] hover:bg-[#d4964f] shadow-sm focus-visible:ring-[#dda15e]",
        
        // Ghost: Subtle hover with Pakistan Green
        ghost: "text-[#283618] hover:bg-[#606c38]/10 hover:text-[#606c38] focus-visible:ring-[#606c38]",
        
        // Link: Pakistan Green with underline
        link: "text-[#283618] underline-offset-4 hover:underline hover:text-[#606c38] focus-visible:ring-[#606c38]",
        
        // Subtle: Light Earth Yellow background
        subtle: "bg-[#fefae0] text-[#283618] border border-[#dda15e]/30 hover:bg-[#dda15e]/20 hover:border-[#606c38]/50 focus-visible:ring-[#606c38]",
        
        // New variant: Forest (using Pakistan Green)
        forest: "bg-[#283618] text-[#fefae0] hover:bg-[#1f2a12] shadow-sm focus-visible:ring-[#283618]",
        
        // New variant: Warm (Earth Yellow with good contrast)
        warm: "bg-[#fefae0] text-[#283618] border border-[#dda15e] hover:bg-[#dda15e]/20 hover:border-[#606c38] focus-visible:ring-[#dda15e]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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