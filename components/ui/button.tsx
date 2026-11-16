import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-ink font-extrabold uppercase tracking-wide whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-white shadow-[4px_4px_0_0_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        electric:
          "bg-electric text-ink shadow-[4px_4px_0_0_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        cobalt:
          "bg-cobalt text-white shadow-[4px_4px_0_0_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        coral:
          "bg-coral text-white shadow-[4px_4px_0_0_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        outline:
          "bg-paper text-ink shadow-[4px_4px_0_0_#111111] hover:bg-pale hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-ink shadow-none hover:bg-pale hover:border-ink",
      },
      size: {
        default: "h-11 px-4 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
