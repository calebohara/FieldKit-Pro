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
      <header className="border-b border-[var(--border)] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--primary)]">
            FieldKit Pro
          </span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
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
            className="inline-block px-8 py-3 text-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
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
