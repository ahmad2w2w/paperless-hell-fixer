import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const jobs = await prisma.processingJob.findMany({
    where: { document: { userId: session.user.id } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      documentId: true,
      status: true,
      error: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ jobs });
}


