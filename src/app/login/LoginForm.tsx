"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, TextLink, Icons } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vul je e-mail en wachtwoord in.");
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    setLoading(false);

    if (res?.error) {
      setError("E-mail of wachtwoord onjuist.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold shadow-lg shadow-indigo-500/30 mb-4">
                P
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Welkom terug
              </h1>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Log in om je documenten en acties te beheren.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
                  {Icons.warning}
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  E-mailadres
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Wachtwoord
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Inloggen
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                Nog geen account?{" "}
                <TextLink href="/register">Registreren</TextLink>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
