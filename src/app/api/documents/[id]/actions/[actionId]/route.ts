import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
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

  const { id, actionId } = await params;
  
  // Verify document belongs to user
  const document = await prisma.document.findFirst({
    where: { id, userId },
  });
  
  if (!document) {
    return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
  }

  // Verify action belongs to document
  const action = await prisma.actionItem.findFirst({
    where: { id: actionId, documentId: id },
  });
  
  if (!action) {
    return NextResponse.json({ error: "Actie niet gevonden." }, { status: 404 });
  }

  const body = await req.json();
  const { status, notes } = body;

  // Update action
  const updatedAction = await prisma.actionItem.update({
    where: { id: actionId },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ action: updatedAction });
}



