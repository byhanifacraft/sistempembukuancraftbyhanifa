import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0688A] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs active:translate-y-[0.5px]",
        secondary:
          "bg-[#FFF0F4] text-[#9B2C54] hover:bg-[#FCE2EC] border border-[#F2DBE3]",
        outline:
          "border border-[#E8C5D1] bg-white hover:bg-[#FFF0F4] text-[#3D3035] hover:text-[#9B2C54]",
        ghost:
          "hover:bg-[#FFF0F4] text-[#3D3035] hover:text-[#9B2C54]",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-xs",
        link: "text-[#E0688A] underline-offset-4 hover:underline",
        sage: "bg-[#10B981] text-white hover:bg-[#059669] shadow-xs",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
