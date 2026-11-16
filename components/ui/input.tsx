import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full border-[3px] border-ink bg-white px-3 text-base text-ink outline-none placeholder:text-ink/40 focus:bg-electric/30 focus:shadow-[4px_4px_0_0_#111111] disabled:bg-pale disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Input };
