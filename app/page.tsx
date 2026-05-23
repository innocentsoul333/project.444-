import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
          Campus Layer
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          A living digital layer over physical spaces.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
          Auto-joined communities for colleges, offices, hostels, events, and
          campuses.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Sign in
          </Link>
          <Link
            href="/feed"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white"
          >
            Enter app
          </Link>
        </div>
      </section>
    </main>
  );
}
