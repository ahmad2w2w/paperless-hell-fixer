"use client";

import { useMemo, useState } from "react";
import { Badge, Button, EmptyState, Icons, Input, Textarea } from "@/components/ui";
import { formatDutchDate } from "@/lib/date";

type Item = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: "OPEN" | "DONE";
  notes: string | null;
  updatedAt: string;
};

function isoToDateValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ActionItemsClient({ items }: { items: Item[] }) {
  const [local, setLocal] = useState<Item[]>(items);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...local].sort((a, b) => {
      // Open items first, then by deadline
      if (a.status !== b.status) {
        return a.status === "OPEN" ? -1 : 1;
      }
      const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [local]);

  const updateLocal = (id: string, patch: Partial<Item>) =>
    setLocal((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const markDone = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/action-items/${id}/done`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kon niet afronden.");
      updateLocal(id, { status: "DONE" });
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingId(null);
    }
  };

  const saveItem = async (it: Item) => {
    setSavingId(it.id);
    setError(null);
    try {
      const dateValue = isoToDateValue(it.deadline);
      const res = await fetch(`/api/action-items/${it.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: it.title,
          deadline: dateValue || null,
          notes: it.notes ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Opslaan mislukt.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
          {Icons.warning}
          {error}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Icons.check}
          title="Geen acties"
          description="Dit document heeft nog geen actiepunten."
        />
      ) : (
        sorted.map((it) => {
          const isExpanded = expandedId === it.id;
          const isDone = it.status === "DONE";

          return (
            <div
              key={it.id}
              className={`rounded-xl border transition-all ${
                isDone
                  ? "border-[var(--border)] bg-[var(--background)] opacity-60"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : it.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-medium ${
                          isDone
                            ? "text-[var(--foreground-muted)] line-through"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {it.title}
                      </span>
                      <Badge
                        color={isDone ? "success" : "warning"}
                        size="sm"
                        dot
                      >
                        {isDone ? "Afgerond" : "Open"}
                      </Badge>
                    </div>
                    {it.deadline && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--foreground-subtle)]">
                        {Icons.calendar}
                        {formatDutchDate(new Date(it.deadline))}
                      </div>
                    )}
                    <p className="mt-2 text-sm text-[var(--foreground-muted)] line-clamp-2">
                      {it.description}
                    </p>
                  </div>

                  {!isDone && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markDone(it.id)}
                      loading={savingId === it.id}
                    >
                      {Icons.check}
                      Done
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded edit form */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--background)]/50 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                        Titel
                      </label>
                      <Input
                        value={it.title}
                        onChange={(e) => updateLocal(it.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                        Deadline
                      </label>
                      <Input
                        type="date"
                        value={isoToDateValue(it.deadline)}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateLocal(it.id, {
                            deadline: v ? new Date(`${v}T00:00:00.000Z`).toISOString() : null,
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                      Notities
                    </label>
                    <Textarea
                      rows={3}
                      value={it.notes ?? ""}
                      onChange={(e) => updateLocal(it.id, { notes: e.target.value })}
                      placeholder="Voeg persoonlijke notities toe..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--foreground-subtle)]">
                      Laatst gewijzigd: {formatDutchDate(new Date(it.updatedAt))}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => saveItem(it)}
                      loading={savingId === it.id}
                    >
                      Wijzigingen opslaan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
