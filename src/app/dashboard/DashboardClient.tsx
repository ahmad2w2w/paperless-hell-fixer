"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icons,
  Input,
  Select,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { formatDutchDate } from "@/lib/date";

type DocumentDTO = {
  id: string;
  originalFilename: string;
  type: "BELASTING" | "BOETE" | "VERZEKERING" | "ABONNEMENT" | "OVERIG" | null;
  sender: string | null;
  amount: string | null;
  deadline: string | null;
  summary: string | null;
  confidence: number | null;
  createdAt: string;
  job: { status: "PENDING" | "PROCESSING" | "DONE" | "FAILED"; error: string | null } | null;
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    status: "OPEN" | "DONE";
  }>;
};

async function fetchDocuments(params: {
  status: "all" | "open" | "done";
  type?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  sp.set("status", params.status);
  if (params.type) sp.set("type", params.type);
  if (params.q) sp.set("q", params.q);
  const res = await fetch(`/api/documents?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Kon documenten niet laden.");
  const json = await res.json();
  return json.documents as DocumentDTO[];
}

function parseDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getUrgency(deadline: Date | null): "urgent" | "soon" | "normal" | "none" {
  if (!deadline) return "none";
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return "urgent";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}

const typeLabels: Record<string, { label: string; emoji: string }> = {
  BELASTING: { label: "Belasting", emoji: "🏛️" },
  BOETE: { label: "Boete", emoji: "⚠️" },
  VERZEKERING: { label: "Verzekering", emoji: "🛡️" },
  ABONNEMENT: { label: "Abonnement", emoji: "📅" },
  OVERIG: { label: "Overig", emoji: "📄" },
};

export function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"all" | "open" | "done">("open");
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState("");

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments({
        status,
        type: type || undefined,
        q: q || undefined,
      });
      setDocuments(docs);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, q]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, q]);

  const stats = useMemo(() => {
    const allActions = documents.flatMap((d) => d.actionItems);
    const openActions = allActions.filter((a) => a.status === "OPEN");
    const urgentActions = openActions.filter((a) => {
      const deadline = parseDate(a.deadline);
      return deadline && getUrgency(deadline) === "urgent";
    });
    const thisWeekDeadlines = openActions.filter((a) => {
      const deadline = parseDate(a.deadline);
      if (!deadline) return false;
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline <= weekFromNow && deadline >= now;
    });

    return {
      totalDocs: documents.length,
      openActions: openActions.length,
      urgentActions: urgentActions.length,
      thisWeekDeadlines: thisWeekDeadlines.length,
    };
  }, [documents]);

  const actionsForView = useMemo(() => {
    const actions = documents
      .flatMap((d) =>
        d.actionItems.map((a) => ({
          ...a,
          documentId: d.id,
          documentName: d.originalFilename,
          docDeadline: d.deadline,
          docType: d.type,
        })),
      )
      .sort((a, b) => {
        const da = parseDate(a.deadline ?? a.docDeadline);
        const db = parseDate(b.deadline ?? b.docDeadline);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
    return actions;
  }, [documents]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload mislukt.");
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Beheer je documenten en actiepunten
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void load()}
          disabled={loading}
        >
          {Icons.refresh}
          Vernieuwen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Documenten"
          value={stats.totalDocs}
          icon={Icons.document}
          color="primary"
        />
        <StatCard
          title="Open acties"
          value={stats.openActions}
          icon={Icons.check}
          color="warning"
        />
        <StatCard
          title="Urgent"
          value={stats.urgentActions}
          subtitle="Deadline < 3 dagen"
          icon={Icons.warning}
          color="danger"
        />
        <StatCard
          title="Deze week"
          value={stats.thisWeekDeadlines}
          subtitle="Deadlines komende 7 dagen"
          icon={Icons.calendar}
          color="success"
        />
      </div>

      {/* Upload zone */}
      <Card
        className={`relative transition-all ${
          dragOver
            ? "border-[var(--primary)] bg-[var(--primary-light)]/50 scale-[1.01]"
            : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="p-4 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
            {Icons.upload}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-semibold text-[var(--foreground)]">
              Document uploaden
            </div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Sleep een bestand hierheen of klik om te bladeren. PDF of afbeelding (JPG/PNG).
            </div>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              disabled={uploading}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              Bestand kiezen
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1.5 block">
              Zoeken
            </label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op afzender, tekst..."
              icon={Icons.search}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1.5 block">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="open">Open</option>
              <option value="done">Afgerond</option>
              <option value="all">Alles</option>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1.5 block">
              Type
            </label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Alle types</option>
              <option value="BELASTING">Belasting</option>
              <option value="BOETE">Boete</option>
              <option value="VERZEKERING">Verzekering</option>
              <option value="ABONNEMENT">Abonnement</option>
              <option value="OVERIG">Overig</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          {Icons.warning}
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Actions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--foreground)]">
              {status === "open" ? "Open acties" : status === "done" ? "Afgeronde acties" : "Alle acties"}
            </h2>
            <Badge color="primary">{actionsForView.length}</Badge>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : actionsForView.length === 0 ? (
              <EmptyState
                icon={Icons.check}
                title="Geen acties"
                description={
                  status === "open"
                    ? "Je hebt geen openstaande acties. Goed bezig! 🎉"
                    : "Geen acties gevonden met deze filters."
                }
              />
            ) : (
              actionsForView.slice(0, 15).map((a, i) => {
                const deadline = parseDate(a.deadline ?? a.docDeadline);
                const urgency = getUrgency(deadline);

                return (
                  <div
                    key={a.id}
                    className={`group rounded-xl border p-4 transition-all hover:shadow-md animate-fade-in ${
                      urgency === "urgent"
                        ? "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5"
                        : urgency === "soon"
                          ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5"
                          : "border-[var(--border)] hover:border-[var(--border-hover)]"
                    }`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {a.docType && (
                            <span title={typeLabels[a.docType]?.label}>
                              {typeLabels[a.docType]?.emoji}
                            </span>
                          )}
                          <span className="font-medium text-[var(--foreground)] truncate">
                            {a.title}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--foreground-subtle)] truncate">
                          {a.documentName}
                        </div>
                      </div>
                      {deadline ? (
                        <Badge
                          color={
                            urgency === "urgent"
                              ? "danger"
                              : urgency === "soon"
                                ? "warning"
                                : "default"
                          }
                          dot
                        >
                          {formatDutchDate(deadline)}
                        </Badge>
                      ) : (
                        <Badge>Geen deadline</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)] line-clamp-2">
                      {a.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/documents/${a.documentId}`}
                        className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                      >
                        Bekijk document →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Documents */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--foreground)]">Documenten</h2>
            <Badge color="primary">{documents.length}</Badge>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={Icons.document}
                title="Geen documenten"
                description="Upload je eerste document om te beginnen."
                action={
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Document uploaden
                  </Button>
                }
              />
            ) : (
              documents.map((d, i) => {
                const isProcessing =
                  d.job?.status === "PENDING" || d.job?.status === "PROCESSING";
                const isFailed = d.job?.status === "FAILED";

                return (
                  <div
                    key={d.id}
                    className={`group rounded-xl border p-4 transition-all hover:shadow-md animate-fade-in ${
                      isFailed
                        ? "border-red-200 dark:border-red-500/30"
                        : isProcessing
                          ? "border-amber-200 dark:border-amber-500/30"
                          : "border-[var(--border)] hover:border-[var(--border-hover)]"
                    }`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {d.type && (
                            <span title={typeLabels[d.type]?.label}>
                              {typeLabels[d.type]?.emoji}
                            </span>
                          )}
                          <span className="font-medium text-[var(--foreground)] truncate">
                            {d.originalFilename}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                          {d.sender ? `Van: ${d.sender}` : "Afzender onbekend"}
                        </div>
                      </div>
                      {isFailed ? (
                        <Badge color="danger" dot>Mislukt</Badge>
                      ) : isProcessing ? (
                        <Badge color="warning" dot>
                          <span className="animate-pulse-subtle">Verwerken...</span>
                        </Badge>
                      ) : (
                        <Badge color="success" dot>Klaar</Badge>
                      )}
                    </div>

                    {d.summary && !isProcessing && !isFailed && (
                      <p className="mt-2 text-sm text-[var(--foreground-muted)] line-clamp-2">
                        {d.summary}
                      </p>
                    )}

                    {isFailed && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {d.job?.error || "Verwerking mislukt"}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            setError(null);
                            try {
                              const res = await fetch(`/api/documents/${d.id}/retry`, {
                                method: "POST",
                              });
                              const json = await res.json();
                              if (!res.ok) throw new Error(json?.error || "Retry mislukt.");
                              await load();
                            } catch (e) {
                              setError(String(e));
                            }
                          }}
                        >
                          Opnieuw proberen
                        </Button>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                          <div className="h-full w-1/3 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/documents/${d.id}`}
                        className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
                      >
                        {Icons.eye}
                        Details
                      </Link>
                      {d.deadline && (
                        <span className="text-xs text-[var(--foreground-subtle)] flex items-center gap-1">
                          {Icons.calendar}
                          {formatDutchDate(new Date(d.deadline))}
                        </span>
                      )}
                      {d.amount && (
                        <span className="text-xs text-[var(--foreground-subtle)] flex items-center gap-1">
                          {Icons.euro}
                          €{parseFloat(d.amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
