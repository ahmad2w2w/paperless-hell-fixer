"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button, Icons } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";

export function NavBar() {
  const { data } = useSession();
  const authed = Boolean(data?.user?.email);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background-card)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/30">
            P
          </div>
          <span className="hidden sm:inline">Paperless Hell Fixer</span>
        </Link>

        <nav className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
            title={`Thema: ${theme === "system" ? "systeem" : theme === "light" ? "licht" : "donker"}`}
          >
            {resolvedTheme === "dark" ? Icons.moon : Icons.sun}
          </button>

          {authed ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition-all"
              >
                {Icons.document}
                Dashboard
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {data?.user?.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Uitloggen
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Inloggen
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md shadow-indigo-500/20 transition-all"
              >
                Registreren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
