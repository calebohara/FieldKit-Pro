import Link from "next/link";

const features = [
  {
    icon: "🔧",
    title: "PPCL Reference & Analyzer",
    description:
      "Every command, common errors, and code analysis at your fingertips",
  },
  {
    icon: "📊",
    title: "PID Loop Tuning",
    description:
      "Get recommended PID values for common HVAC loops in seconds",
  },
  {
    icon: "⚡",
    title: "ABB Drive Tools",
    description:
      "Fault codes, parameters, and common configurations for ACS series drives",
  },
  {
    icon: "⚡",
    title: "Yaskawa Drive Tools",
    description:
      "Fault codes, parameters, and setup guides for GA500/GA700 series",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <span className="text-base sm:text-xl font-bold flex items-center gap-1.5 sm:gap-2 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)] sm:w-[22px] sm:h-[22px]">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
            </svg>
            <span><span className="text-[var(--primary)]">FieldKit</span> Pro</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Your Field Engineering Toolkit.
            <br />
            Always in Your Pocket.
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto mb-10">
            PPCL troubleshooting, loop tuning, drive configuration — all the
            references you need, searchable in seconds. Built by a controls
            engineer, for controls engineers.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 text-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-all duration-200"
          >
            Get Started Free
          </Link>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-interactive p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} FieldKit Pro. Built for controls
        engineers.
      </footer>
    </div>
  );
}
