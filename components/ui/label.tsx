import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-xs font-extrabold uppercase tracking-[0.16em]", className)}
      {...props}
    />
  );
}

export { Label };
