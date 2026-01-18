import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload mislukt: geen bestand ontvangen." },
      { status: 400 },
    );
  }

  if (
    !(
      file.type === "application/pdf" ||
      file.type.startsWith("image/") ||
      file.name.toLowerCase().endsWith(".pdf")
    )
  ) {
    return NextResponse.json(
      { error: "Alleen PDF of foto (image) is toegestaan." },
      { status: 400 },
    );
  }

  const documentId = crypto.randomUUID();
  const storage = getStorage();
  const stored = await storage.saveUploadedFile({
    userId,
    documentId,
    file,
  });

  const doc = await prisma.document.create({
    data: {
      id: documentId,
      userId,
      filePath: stored.relativePath,
      originalFilename: stored.originalFilename,
      mimetype: stored.mimetype,
      job: { create: { status: "PENDING" } },
    },
    select: { id: true },
  });

  return NextResponse.json({ documentId: doc.id });
}


