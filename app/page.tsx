import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute -left-24 top-[-100px] h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-28 bottom-[-140px] h-[26rem] w-[26rem] rounded-full bg-cyan-500/30 blur-3xl animate-pulse" />
      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
          Campus Layer
        </div>
        <h1 className="max-w-4xl bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          A living digital layer over physical spaces.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-zinc-200 sm:text-lg">
          Auto-joined communities for colleges, offices, hostels, events, and campuses.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/30"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:scale-105 hover:bg-white/20"
          >
            Sign up
          </Link>
          <Link
            href="/feed"
            className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:scale-105 hover:bg-cyan-500/25"
          >
            Enter app
          </Link>
        </div>
      </section>
    </main>
  );
}
