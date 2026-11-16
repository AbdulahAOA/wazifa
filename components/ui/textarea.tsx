import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full border-[3px] border-ink bg-white p-3 text-base text-ink outline-none placeholder:text-ink/40 focus:bg-electric/30 focus:shadow-[4px_4px_0_0_#111111]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
