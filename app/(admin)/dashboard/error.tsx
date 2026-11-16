"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border-[3px] border-ink bg-white p-8">
      <h1 className="text-4xl font-black">THE DESK FAILED TO LOAD.</h1>
      <p className="mt-3">Refresh the data and try the action again.</p>
      <Button className="mt-6" onClick={() => reset()}>Retry</Button>
    </div>
  );
}
