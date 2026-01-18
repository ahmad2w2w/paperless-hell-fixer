import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/processDocument";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const mobileUser = getMobileUserFromRequest(req);
  const session = await getServerSession(authOptions);
  const userId = mobileUser?.userId || session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { id } = await ctx.params;

  const doc = await prisma.document.findFirst({
    where: { id, userId },
    select: { id: true, job: { select: { id: true, status: true, error: true } } },
  });
  if (!doc?.job) {
    return NextResponse.json({ error: "Job niet gevonden." }, { status: 404 });
  }
  
  // Allow retry for FAILED or stuck PENDING/PROCESSING jobs
  if (doc.job.status === "DONE") {
    return NextResponse.json(
      { error: "Document is al verwerkt." },
      { status: 400 },
    );
  }

  // Reset the job to PENDING
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

  // Process immediately
  try {
    await processDocument(id);
    return NextResponse.json({ ok: true, status: "processed" });
  } catch (err) {
    return NextResponse.json({ 
      ok: false, 
      error: String(err),
      status: "failed" 
    }, { status: 500 });
  }
}


