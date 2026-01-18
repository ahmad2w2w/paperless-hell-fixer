"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parsed = schema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Vul een geldig e-mailadres en wachtwoord in (min 6 tekens)." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Dit e-mailadres bestaat al. Log in." };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash } });

  redirect("/login?registered=1");
}

export async function registerUser(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();

  const parsed = schema.safeParse({ email: trimmedEmail, password });
  if (!parsed.success) {
    return { ok: false, error: "Vul een geldig e-mailadres en wachtwoord in (min 6 tekens)." };
  }

  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing) return { ok: false, error: "Dit e-mailadres is al in gebruik." };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email: trimmedEmail, passwordHash } });

  return { ok: true };
}


