import Link from "next/link";
import { Card } from "@/components/ui";

// Define icons inline for Server Component compatibility
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const features = [
  {
    icon: <UploadIcon />,
    title: "Upload",
    description: "PDF of foto van een brief/document. Sleep & drop of klik om te uploaden.",
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  },
  {
    icon: <SparklesIcon />,
    title: "AI Analyse",
    description: "OCR + slimme extractie + classificatie. We begrijpen wat er staat.",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    icon: <CheckIcon />,
    title: "Duidelijke Acties",
    description: "Wat moet je doen? Wanneer? Hoeveel? Alles in simpel Nederlands.",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
];

const benefits = [
  { stat: "90%", label: "Minder tijd kwijt aan papierwerk" },
  { stat: "0", label: "Gemiste deadlines" },
  { stat: "∞", label: "Documenten opgeslagen" },
];

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-sm font-medium mb-6">
            <SparklesIcon />
            <span>AI-powered document analyse</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--foreground)]">
            Nooit meer{" "}
            <span className="gradient-text">papieren chaos</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto leading-relaxed">
            Upload een brief, factuur of document. Wij analyseren het automatisch
            en maken er duidelijke actiepunten van in{" "}
            <strong className="text-[var(--foreground)]">simpel Nederlands</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
            >
              Gratis starten
              <span className="group-hover:translate-x-1 transition-transform"><ArrowRightIcon /></span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-xl text-[var(--foreground)] hover:bg-[var(--background-card)] border border-[var(--border)] transition-all"
            >
              Inloggen
            </Link>
          </div>

          <p className="mt-4 text-sm text-[var(--foreground-subtle)]">
            ✓ Geen creditcard nodig &nbsp; ✓ Direct aan de slag
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="animate-fade-in stagger-1">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {benefits.map((b) => (
            <div key={b.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--primary)]">
                {b.stat}
              </div>
              <div className="mt-1 text-sm text-[var(--foreground-muted)]">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="animate-fade-in stagger-2">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Hoe het werkt
          </h2>
          <p className="mt-2 text-[var(--foreground-muted)]">
            In 3 simpele stappen van chaos naar controle
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              hover
              className="relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <span className="text-4xl font-bold text-[var(--border)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Document Types */}
      <section className="animate-fade-in stagger-3">
        <Card className="bg-gradient-to-br from-[var(--background-card)] to-[var(--background)] border-0 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Werkt met alle documenten
            </h2>
            <p className="mt-2 text-[var(--foreground-muted)]">
              Van belastingbrief tot boete, van polis tot factuur
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Belasting", icon: "🏛️" },
              { label: "Boetes", icon: "⚠️" },
              { label: "Verzekeringen", icon: "🛡️" },
              { label: "Abonnementen", icon: "📅" },
              { label: "Facturen", icon: "💶" },
              { label: "Brieven", icon: "✉️" },
              { label: "Contracten", icon: "📋" },
              { label: "Medisch", icon: "🏥" },
            ].map((type) => (
              <div
                key={type.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background)] border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-default"
              >
                <span>{type.icon}</span>
                {type.label}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="animate-fade-in stagger-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 border-0 text-white text-center py-12">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Klaar om te beginnen?
            </h2>
            <p className="mt-3 text-indigo-100 max-w-md mx-auto">
              Maak binnen 30 seconden een account en upload je eerste document.
              Geen gedoe, geen creditcard.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg transition-all hover:-translate-y-0.5"
            >
              Account maken
              <ArrowRightIcon />
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-[var(--foreground-subtle)] pt-8 border-t border-[var(--border)]">
        <p>
          © {new Date().getFullYear()} Paperless Hell Fixer. Gemaakt met ❤️ voor
          iedereen die papierwerk haat.
        </p>
      </footer>
    </div>
  );
}
