import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#E0688A] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#E0688A] text-white",
        secondary:
          "border border-[#F2DBE3] bg-[#FFF0F4] text-[#9B2C54]",
        outline:
          "text-[#4A3B41] border-[#E8C5D1] bg-white",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:
          "border-transparent bg-rose-50 text-rose-800 border-rose-200",
        destructive:
          "border-transparent bg-rose-50 text-rose-700 border-rose-200",
        shopee:
          "border border-pink-200 bg-[#FFF0F4] text-[#E0688A] font-semibold",
        offline:
          "border-transparent bg-stone-800 text-white",
        custom:
          "border-transparent bg-pink-100/70 text-[#9B2C54] border border-pink-200",
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
