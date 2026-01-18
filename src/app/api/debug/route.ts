import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Debug endpoint to check system status
export async function GET() {
  try {
    // Check database connection
    const dbStatus = await prisma.$queryRaw`SELECT 1 as connected`;
    
    // Check for pending jobs
    const pendingJobs = await prisma.processingJob.findMany({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      select: {
        id: true,
        status: true,
        documentId: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 10,
    });

    // Check for failed jobs
    const failedJobs = await prisma.processingJob.findMany({
      where: { status: "FAILED" },
      select: {
        id: true,
        documentId: true,
        error: true,
        updatedAt: true,
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    // Check OpenAI key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 10) + "...";

    return NextResponse.json({
      status: "ok",
      database: "connected",
      openai: {
        hasKey: hasOpenAIKey,
        keyPrefix: hasOpenAIKey ? openAIKeyPrefix : null,
      },
      pendingJobs: pendingJobs.length,
      pendingJobDetails: pendingJobs,
      failedJobs: failedJobs.length,
      failedJobDetails: failedJobs,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
      },
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      error: String(err),
    }, { status: 500 });
  }
}

