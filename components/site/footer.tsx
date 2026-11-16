import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t-[3px] border-ink bg-ink text-white">
      <div className="border-b-[3px] border-white/20 bg-electric px-4 py-3 text-ink md:px-6">
        <p className="mx-auto max-w-7xl text-xs font-extrabold tracking-[0.2em] uppercase">
          Wazifa · A brutalist hiring board for people who hate beige software
        </p>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="inline-block border-[3px] border-white bg-electric px-2 py-1 text-xl font-black text-ink">
            WAZIFA
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
            Search roles, apply in one pass, and track every status. Hard edges, loud type, no corporate fog.
          </p>
        </div>
        <div>
          <p className="section-kicker text-electric">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm font-bold">
            <Link href="/jobs" className="hover:underline">
              Browse jobs
            </Link>
            <Link href="/sign-up" className="hover:underline">
              Create account
            </Link>
            <Link href="/applications" className="hover:underline">
              My applications
            </Link>
            <Link href="/forgot-password" className="hover:underline">
              Reset password
            </Link>
          </div>
        </div>
        <div>
          <p className="section-kicker text-electric">Operators</p>
          <div className="mt-3 flex flex-col gap-2 text-sm font-bold">
            <Link href="/dashboard" className="hover:underline">
              Admin dashboard
            </Link>
            <Link href="/dashboard/jobs/new" className="hover:underline">
              Post a role
            </Link>
            <Link href="/dashboard/applications" className="hover:underline">
              Review queue
            </Link>
            <Link href="/sign-in" className="hover:underline">
              Operator sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t-[3px] border-white/20 px-4 py-4 text-xs font-extrabold tracking-widest uppercase md:px-6">
        © 2026 Wazifa · Built as a Brutalist hiring product
      </div>
    </footer>
  );
}
