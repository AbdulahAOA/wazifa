import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid-surface flex min-h-full flex-col items-center justify-center px-4 py-20 text-center">
      <p className="section-kicker border-[3px] border-ink bg-coral px-2 py-1 text-white">404</p>
      <h1 className="mt-4 text-6xl font-black">PAGE NOT FOUND.</h1>
      <p className="mt-3 max-w-md">This route does not exist. The board still does.</p>
      <Button className="mt-6" variant="electric" asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
