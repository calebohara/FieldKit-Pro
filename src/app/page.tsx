import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    icon: "🔧",
    title: "PPCL Reference & Analyzer",
    description:
      "Every PPCL command documented with syntax, examples, and common errors. Paste code to analyze it instantly.",
    detail: "621 commands + error database",
  },
  {
    icon: "📊",
    title: "PID Loop Tuning",
    description:
      "Select your loop type, get recommended P-I-D values with a live response curve. 12 HVAC presets built in.",
    detail: "AHU, VAV, chiller, boiler & more",
  },
  {
    icon: "⚡",
    title: "ABB Drive Tools",
    description:
      "76 fault codes with causes and remedies, 58 key parameters with ranges and defaults for ACS series drives.",
    detail: "ACS580 / ACS880 coverage",
  },
  {
    icon: "⚡",
    title: "Yaskawa Drive Tools",
    description:
      "59 fault codes and 60 parameters for GA500/GA700 series. Searchable by code, name, or category.",
    detail: "GA500 / GA700 coverage",
  },
];

const scenarios = [
  {
    icon: "🏢",
    who: "The AHU Tech",
    scenario:
      "You're on a rooftop at 6 AM and the ACS580 throws an F0068. Pull up FieldKit — fieldbus comm loss, check the BACnet cable. Fixed before the tenant complaint hits.",
  },
  {
    icon: "🔥",
    who: "The Controls Programmer",
    scenario:
      "Midway through a PPCL program and can't remember the TODMOD syntax. Search it in FieldKit — full syntax, examples, and gotchas. No digging through binders.",
  },
  {
    icon: "🌡️",
    who: "The Commissioning Engineer",
    scenario:
      "Tuning a chiller plant with 6 loops to dial in. Open PID Tuning, pick the preset, get starting values for each loop type. Hours of trial-and-error saved.",
  },
];

const stats = [
  { value: "135+", label: "Fault codes" },
  { value: "118+", label: "Drive parameters" },
  { value: "12", label: "PID presets" },
  { value: "100%", label: "Works offline" },
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
            <ThemeToggle />
            <Link
              href="/login"
              className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center animate-fade-in">
          <p className="text-sm font-medium text-[var(--primary)] mb-4 tracking-wide uppercase">
            Built by a controls engineer, for controls engineers
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Stop Googling Fault Codes
            <br />
            <span className="text-[var(--primary)]">on the Job Site.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
            ABB & Yaskawa drive fault codes, PID loop tuning, PPCL
            reference — everything you need in the field, searchable in
            seconds. Even offline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 text-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-all duration-200"
            >
              Get Started Free
            </Link>
            <span className="text-sm text-[var(--muted-foreground)]">
              No credit card required
            </span>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="border-y border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            Everything You Need in the Field
          </h2>
          <p className="text-center text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto">
            No more lugging binders or searching through PDFs on your phone. Every reference is instant.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-interactive p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--muted-foreground)] mb-3 leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {feature.detail}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case Scenarios */}
        <section className="bg-[var(--card)] border-y border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
              Built for the Field
            </h2>
            <p className="text-center text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto">
              Real scenarios where FieldKit Pro saves you time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              {scenarios.map((s) => (
                <div
                  key={s.who}
                  className="p-6 rounded-xl bg-[var(--background)] border border-[var(--border)]"
                >
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold mb-2 text-[var(--primary)]">
                    {s.who}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {s.scenario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Works Offline Callout */}
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-4xl mb-4">📡</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Works Offline. Seriously.
            </h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">
              Basement mechanical rooms, rooftops with no signal, remote
              sites — FieldKit Pro caches your tools so they work even when
              your connection doesn&apos;t. Install it as an app on your phone
              for the best experience.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                iOS & Android
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Add to Home Screen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                No app store needed
              </span>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Work Smarter in the Field?
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8 max-w-xl mx-auto">
              Join controls engineers who are ditching the binders. Free plan
              includes full PPCL reference, PID tuning, and 3 fault lookups
              per day.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 text-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-all duration-200"
            >
              Get Started Free
            </Link>
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
