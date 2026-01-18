import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractTextFromFile } from "@/lib/extract/text";
import { extractWithOpenAI } from "@/lib/extract/openai";

function toDateOrNull(iso: string | null) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function processDocument(documentId: string) {
  const job = await prisma.processingJob.findFirst({
    where: { documentId, status: "PENDING" },
    select: {
      id: true,
      documentId: true,
      document: {
        select: {
          id: true,
          filePath: true,
          mimetype: true,
          language: true,
        },
      },
    },
  });

  if (!job) return;

  // Claim the job
  const claimed = await prisma.processingJob.updateMany({
    where: { id: job.id, status: "PENDING" },
    data: { status: "PROCESSING", error: null },
  });
  if (claimed.count === 0) return;

  const language = job.document.language || "nl";

  try {
    const absolutePath = path.join(process.cwd(), job.document.filePath);
    const extractedText = await extractTextFromFile({
      absolutePath,
      mimetype: job.document.mimetype,
    });

    const noTextMessage = language === "ar" ? "(لم يتم العثور على نص)" : "(geen tekst gevonden)";
    const llm = await extractWithOpenAI(extractedText || noTextMessage, language);

    const docDeadline = toDateOrNull(llm.deadline);

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: job.documentId },
        data: {
          extractedText,
          type: llm.docType,
          sender: llm.sender,
          amount: llm.amountEUR === null ? null : new Prisma.Decimal(llm.amountEUR),
          deadline: docDeadline,
          summary: llm.summarySimple,
          confidence: Math.round(llm.confidence),
        },
      });

      await tx.actionItem.deleteMany({ where: { documentId: job.documentId } });

      if (llm.actions.length > 0) {
        await tx.actionItem.createMany({
          data: llm.actions.map((a) => ({
            documentId: job.documentId,
            title: a.title,
            description: a.description,
            deadline: toDateOrNull(a.deadline),
            status: "OPEN" as const,
          })),
        });
      } else {
        const defaultTitle = language === "ar" ? "تحقق من هذا المستند" : "Controleer dit document";
        const defaultDesc = language === "ar"
          ? "لم نتمكن من العثور على إجراءات واضحة. اقرأ الرسالة وحدد ما يجب عليك فعله."
          : "We konden geen duidelijke acties vinden. Lees de brief en bepaal wat je moet doen.";

        await tx.actionItem.create({
          data: {
            documentId: job.documentId,
            title: defaultTitle,
            description: defaultDesc,
            deadline: docDeadline,
          },
        });
      }

      await tx.processingJob.update({
        where: { id: job.id },
        data: { status: "DONE", error: null },
      });
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (err) {
    console.error(`Document ${documentId} processing failed:`, err);
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(err) },
    });
  }
}

