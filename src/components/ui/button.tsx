import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#14213d] text-white shadow hover:bg-[#14213d]/90 dark:bg-[#fca311] dark:text-white",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-500/90",
        outline:
          "border border-[#e2e8f0] bg-transparent shadow-sm hover:bg-[#f8fafc] hover:text-[#14213d] dark:border-[#334155] dark:hover:bg-[#1e293b]",
        secondary:
          "bg-[#f8fafc] text-[#1e293b] shadow-sm hover:bg-[#e2e8f0] dark:bg-[#1e293b] dark:text-[#f1f5f9] dark:hover:bg-[#334155]",
        ghost:
          "hover:bg-[#f8fafc] hover:text-[#14213d] dark:hover:bg-[#1e293b] dark:hover:text-[#f1f5f9]",
        link: "text-[#14213d] underline-offset-4 hover:underline dark:text-[#fca311]",
        accent:
          "bg-[#fca311] text-white shadow hover:bg-[#fca311]/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
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
