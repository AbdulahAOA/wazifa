"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="border-[3px] border-ink bg-white p-8 hard-shadow">
        <h1 className="text-4xl font-black">SOMETHING BROKE.</h1>
        <p className="mt-3">The request failed. Nothing was changed by this message.</p>
        <Button className="mt-6" variant="electric" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
