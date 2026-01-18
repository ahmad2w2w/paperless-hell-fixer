import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const id = ctx.params.id;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, job: { select: { id: true, status: true } } },
  });
  if (!doc?.job) {
    return NextResponse.json({ error: "Job niet gevonden." }, { status: 404 });
  }
  if (doc.job.status !== "FAILED") {
    return NextResponse.json(
      { error: "Opnieuw proberen kan alleen bij FAILED jobs." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id },
      data: {
        extractedText: null,
        type: null,
        sender: null,
        amount: null,
        deadline: null,
        summary: null,
        confidence: null,
      },
    });
    await tx.actionItem.deleteMany({ where: { documentId: id } });
    await tx.processingJob.update({
      where: { documentId: id },
      data: { status: "PENDING", error: null },
    });
  });

  return NextResponse.json({ ok: true });
}


