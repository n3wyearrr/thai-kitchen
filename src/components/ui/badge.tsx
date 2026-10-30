import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30",
  {
    variants: {
      variant: {
        default:
          "border-orange-200/70 bg-[#FFF7ED] text-[#EA580C]",
        secondary:
          "border-slate-200/70 bg-slate-100 text-[#64748B]",
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        outline: "text-[#1E293B] border-slate-200/80 bg-white",
        success: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200/80 bg-amber-50 text-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
