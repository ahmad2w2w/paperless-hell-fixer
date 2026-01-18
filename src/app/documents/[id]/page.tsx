import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { formatDutchDate, toISODate } from "@/lib/date";
import { ActionItemsClient } from "@/app/documents/[id]/ActionItemsClient";

// Server-safe icons
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EuroIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
  BELASTING: { label: "Belasting", emoji: "🏛️", color: "primary" },
  BOETE: { label: "Boete", emoji: "⚠️", color: "danger" },
  VERZEKERING: { label: "Verzekering", emoji: "🛡️", color: "info" },
  ABONNEMENT: { label: "Abonnement", emoji: "📅", color: "warning" },
  OVERIG: { label: "Overig", emoji: "📄", color: "default" },
};

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const doc = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: {
      id: true,
      originalFilename: true,
      mimetype: true,
      filePath: true,
      extractedText: true,
      type: true,
      sender: true,
      amount: true,
      deadline: true,
      summary: true,
      confidence: true,
      createdAt: true,
      updatedAt: true,
      job: { select: { status: true, error: true, updatedAt: true } },
      actionItems: {
        orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          status: true,
          notes: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!doc) return notFound();

  const deadlineIso = toISODate(doc.deadline);
  const typeInfo = doc.type ? typeLabels[doc.type] : null;
  const isProcessing = doc.job?.status === "PENDING" || doc.job?.status === "PROCESSING";
  const isFailed = doc.job?.status === "FAILED";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-2"
          >
            ← Terug naar dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
            {typeInfo && <span>{typeInfo.emoji}</span>}
            {doc.originalFilename}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {typeInfo ? (
              <Badge color={typeInfo.color as any}>{typeInfo.label}</Badge>
            ) : (
              <Badge>Onbekend type</Badge>
            )}
            {doc.sender && <Badge color="info">{doc.sender}</Badge>}
            {isFailed ? (
              <Badge color="danger" dot>Mislukt</Badge>
            ) : isProcessing ? (
              <Badge color="warning" dot>Verwerken...</Badge>
            ) : (
              <Badge color="success" dot>Verwerkt</Badge>
            )}
            {doc.confidence !== null && doc.confidence !== undefined && (
              <Badge>
                {doc.confidence}% zekerheid
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Summary & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <SparklesIcon />
              </div>
              <h2 className="font-semibold text-[var(--foreground)]">AI Samenvatting</h2>
            </div>
            
            {doc.summary ? (
              <p className="text-[var(--foreground-muted)] leading-relaxed whitespace-pre-line">
                {doc.summary}
              </p>
            ) : isFailed ? (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {doc.job?.error || "Verwerking mislukt. Probeer het document opnieuw te uploaden."}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                <div className="animate-pulse-subtle"><ClockIcon /></div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Document wordt verwerkt...
                </p>
              </div>
            )}
          </Card>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CalendarIcon />
              </div>
              <div>
                <div className="text-sm text-[var(--foreground-subtle)]">Deadline</div>
                <div className="font-semibold text-[var(--foreground)]">
                  {doc.deadline ? formatDutchDate(doc.deadline) : "Geen deadline"}
                </div>
                {deadlineIso && (
                  <div className="text-xs text-[var(--foreground-subtle)]">{deadlineIso}</div>
                )}
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <EuroIcon />
              </div>
              <div>
                <div className="text-sm text-[var(--foreground-subtle)]">Bedrag</div>
                <div className="font-semibold text-[var(--foreground)]">
                  {doc.amount ? `€ ${doc.amount.toString()}` : "Geen bedrag"}
                </div>
              </div>
            </Card>
          </div>

          {/* Extracted Text */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--background)] text-[var(--foreground-muted)]">
                  <DocumentIcon />
                </div>
                <h2 className="font-semibold text-[var(--foreground)]">Uitgelezen tekst</h2>
              </div>
              <Badge size="sm">OCR</Badge>
            </div>
            <p className="text-sm text-[var(--foreground-muted)] mb-3">
              Dit is de tekst die uit het document is gehaald. Controleer of alles klopt.
            </p>
            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-xs text-[var(--foreground-muted)] font-mono leading-relaxed">
              {doc.extractedText || "(nog geen tekst beschikbaar)"}
            </pre>
          </Card>
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <CheckIcon />
              </div>
              <h2 className="font-semibold text-[var(--foreground)]">Actiepunten</h2>
              <Badge color="primary" size="sm">{doc.actionItems.length}</Badge>
            </div>
            
            <ActionItemsClient
              items={doc.actionItems.map((a) => ({
                ...a,
                deadline: a.deadline ? a.deadline.toISOString() : null,
                updatedAt: a.updatedAt.toISOString(),
              }))}
            />
          </Card>

          {/* Document Info */}
          <Card>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Document info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--foreground-muted)]">Aangemaakt</span>
                <span className="text-[var(--foreground)]">{formatDutchDate(doc.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground-muted)]">Laatst bijgewerkt</span>
                <span className="text-[var(--foreground)]">{formatDutchDate(doc.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground-muted)]">Bestandstype</span>
                <span className="text-[var(--foreground)]">{doc.mimetype}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
