import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/processDocument";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

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

// POST: Process pending jobs (can be called to trigger processing)
export async function POST(req: Request) {
  const mobileUser = getMobileUserFromRequest(req);
  const session = await getServerSession(authOptions);
  const userId = mobileUser?.userId || session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  // Find pending jobs for this user
  const pendingJobs = await prisma.processingJob.findMany({
    where: { 
      status: "PENDING",
      document: { userId } 
    },
    select: { documentId: true },
    take: 5, // Process max 5 at a time
  });

  // Process them
  const results = await Promise.allSettled(
    pendingJobs.map((job) => processDocument(job.documentId))
  );

  return NextResponse.json({ 
    processed: pendingJobs.length,
    results: results.map((r) => r.status)
  });
}


