import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Vul een geldig e-mailadres en wachtwoord in (min 6 tekens)." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registratie mislukt." },
      { status: 500 }
    );
  }
}



