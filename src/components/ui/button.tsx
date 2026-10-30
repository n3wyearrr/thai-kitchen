import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#1B4332] text-white shadow-sm hover:bg-[#143325] hover:shadow",
        accent:
          "bg-[#EA580C] text-white shadow-sm hover:bg-[#C2410C] hover:shadow",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-slate-200/80 bg-white text-[#1E293B] shadow-sm hover:bg-slate-50 hover:border-slate-300",
        secondary:
          "bg-[#FFF7ED] text-[#EA580C] border border-orange-200/60 hover:bg-orange-100/70",
        ghost: "text-[#64748B] hover:bg-slate-100/80 hover:text-[#1E293B]",
        link: "text-[#1B4332] underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
