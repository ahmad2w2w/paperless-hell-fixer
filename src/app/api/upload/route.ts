import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { processDocument } from "@/lib/processDocument";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for processing

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
  const language = (form.get("language") as string) || "nl"; // Default to Dutch
  
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
      language: language === "ar" ? "ar" : "nl", // Validate language
      job: { create: { status: "PENDING" } },
    },
    select: { id: true },
  });

  // Process the document immediately (don't wait for separate worker)
  // This runs async so the upload response is fast, but processing starts immediately
  processDocument(documentId).catch((err) => {
    console.error("Background processing error:", err);
  });

  return NextResponse.json({ documentId: doc.id });
}


