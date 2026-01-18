import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige input." }, { status: 400 });
  }

  const { title, deadline, notes } = parsed.data;
  const id = ctx.params.id;

  const updated = await prisma.actionItem.updateMany({
    where: { id, document: { userId: session.user.id } },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(deadline !== undefined
        ? { deadline: deadline ? new Date(`${deadline}T00:00:00.000Z`) : null }
        : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Actie niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}


