"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// ============================================
// BUTTON
// ============================================
export function Button(
  props: ComponentProps<"button"> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
  },
) {
  const {
    className,
    variant = "primary",
    size = "md",
    loading,
    disabled,
    children,
    ...rest
  } = props;

  const base =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring rounded-lg";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const variants = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]",
    secondary:
      "bg-[var(--background-card)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--background)] active:scale-[0.98]",
    ghost:
      "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-card)]",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-[0.98]",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled || loading ? "opacity-60 cursor-not-allowed" : ""
      } ${className ?? ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </button>
  );
}

// ============================================
// INPUT
// ============================================
export function Input(props: ComponentProps<"input"> & { icon?: ReactNode }) {
  const { className, icon, ...rest } = props;
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]">
          {icon}
        </div>
      )}
      <input
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none transition-all focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 ${
          icon ? "pl-10" : ""
        } ${className ?? ""}`}
        {...rest}
      />
    </div>
  );
}

// ============================================
// SELECT
// ============================================
export function Select(props: ComponentProps<"select">) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 cursor-pointer ${className ?? ""}`}
      {...rest}
    >
      {children}
    </select>
  );
}

// ============================================
// TEXTAREA
// ============================================
export function Textarea(props: ComponentProps<"textarea">) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none transition-all focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 resize-none ${className ?? ""}`}
      {...rest}
    />
  );
}

// ============================================
// CARD
// ============================================
export function Card(
  props: ComponentProps<"div"> & {
    hover?: boolean;
    gradient?: boolean;
  },
) {
  const { className, hover, gradient, ...rest } = props;
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-sm ${
        hover ? "card-hover cursor-pointer" : ""
      } ${gradient ? "bg-gradient-to-b from-[var(--primary-light)]/30 to-transparent" : ""} ${className ?? ""}`}
      {...rest}
    />
  );
}

// ============================================
// BADGE
// ============================================
export function Badge({
  children,
  color = "default",
  size = "md",
  dot,
}: {
  children: React.ReactNode;
  color?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}) {
  const colors: Record<string, string> = {
    default: "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)]",
    primary: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors[color]} ${sizes[size]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            color === "success"
              ? "bg-emerald-500"
              : color === "warning"
                ? "bg-amber-500"
                : color === "danger"
                  ? "bg-red-500"
                  : color === "info"
                    ? "bg-blue-500"
                    : "bg-current"
          }`}
        />
      )}
      {children}
    </span>
  );
}

// ============================================
// TEXT LINK
// ============================================
export function TextLink(
  props: ComponentProps<typeof Link> & { children: React.ReactNode },
) {
  const { className, ...rest } = props;
  return (
    <Link
      className={`text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors ${className ?? ""}`}
      {...rest}
    />
  );
}

// ============================================
// STAT CARD
// ============================================
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const iconColors = {
    primary: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--foreground-subtle)]">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.value >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[var(--foreground-subtle)]">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconColors[color]}`}>{icon}</div>
        )}
      </div>
      <div
        className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 ${
          color === "primary"
            ? "bg-indigo-500"
            : color === "success"
              ? "bg-emerald-500"
              : color === "warning"
                ? "bg-amber-500"
                : "bg-red-500"
        }`}
      />
    </Card>
  );
}

// ============================================
// EMPTY STATE
// ============================================
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-[var(--background)] text-[var(--foreground-subtle)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--foreground-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded-lg bg-[var(--border)] ${className ?? ""}`}
    />
  );
}

// ============================================
// ICONS
// ============================================
export const Icons = {
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  sun: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  euro: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
};
