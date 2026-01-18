import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const id = ctx.params.id;

  const updated = await prisma.actionItem.updateMany({
    where: { id, document: { userId: session.user.id } },
    data: { status: "DONE" },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Actie niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}


