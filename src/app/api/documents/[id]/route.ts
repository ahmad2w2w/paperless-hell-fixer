import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { id } = ctx.params;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      originalFilename: true,
      mimetype: true,
      filePath: true,
      extractedText: true,
      type: true,
      sender: true,
      amount: true,
      deadline: true,
      summary: true,
      confidence: true,
      createdAt: true,
      updatedAt: true,
      job: { select: { status: true, error: true, updatedAt: true } },
      actionItems: {
        orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}


