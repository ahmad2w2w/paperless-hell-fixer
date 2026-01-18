import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({
  status: z.enum(["all", "open", "done"]).optional(),
  type: z.enum(["BELASTING", "BOETE", "VERZEKERING", "ABONNEMENT", "OVERIG"]).optional(),
  q: z.string().optional(),
});

export async function GET(req: Request) {
  // Check for mobile auth first (Bearer token)
  const mobileUser = getMobileUserFromRequest(req);
  let userId: string | undefined;
  
  if (mobileUser) {
    userId = mobileUser.userId;
  } else {
    // Fall back to NextAuth session (web)
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  
  if (!userId) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige query." }, { status: 400 });
  }

  const { status = "all", type, q } = parsed.data;

  const qTrim = q?.trim();

  const documents = await prisma.document.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(qTrim
        ? {
            OR: [
              { sender: { contains: qTrim, mode: "insensitive" } },
              { summary: { contains: qTrim, mode: "insensitive" } },
              { originalFilename: { contains: qTrim, mode: "insensitive" } },
              { extractedText: { contains: qTrim, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      originalFilename: true,
      mimetype: true,
      type: true,
      sender: true,
      amount: true,
      deadline: true,
      summary: true,
      confidence: true,
      createdAt: true,
      job: { select: { status: true, error: true, updatedAt: true } },
      actionItems: {
        orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
        ...(status === "all"
          ? {}
          : {
              where: { status: status === "open" ? "OPEN" : "DONE" },
            }),
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          status: true,
          notes: true,
          updatedAt: true,
        },
      },
    },
  });

  return NextResponse.json({ documents });
}


