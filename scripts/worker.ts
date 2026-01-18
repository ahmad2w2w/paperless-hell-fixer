import "dotenv/config";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { extractTextFromFile } from "../src/lib/extract/text";
import { extractWithOpenAI } from "../src/lib/extract/openai";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toDateOrNull(iso: string | null) {
  if (!iso) return null;
  // Store as UTC midnight for consistency.
  return new Date(`${iso}T00:00:00.000Z`);
}

async function processOneJob() {
  const job = await prisma.processingJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      documentId: true,
      document: {
        select: {
          id: true,
          filePath: true,
          mimetype: true,
        },
      },
    },
  });

  if (!job) return false;

  const claimed = await prisma.processingJob.updateMany({
    where: { id: job.id, status: "PENDING" },
    data: { status: "PROCESSING", error: null },
  });
  if (claimed.count === 0) return true;

  try {
    const absolutePath = path.join(process.cwd(), job.document.filePath);
    const extractedText = await extractTextFromFile({
      absolutePath,
      mimetype: job.document.mimetype,
    });

    const llm = await extractWithOpenAI(extractedText || "(geen tekst gevonden)");

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
          summary: llm.summarySimpleNL,
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
        await tx.actionItem.create({
          data: {
            documentId: job.documentId,
            title: "Controleer dit document",
            description:
              "We konden geen duidelijke acties vinden. Lees de brief en bepaal wat je moet doen.",
            deadline: docDeadline,
          },
        });
      }

      await tx.processingJob.update({
        where: { id: job.id },
        data: { status: "DONE", error: null },
      });
    });

    return true;
  } catch (err) {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(err) },
    });
    return true;
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("Paperless Hell Fixer worker gestart. Polling elke 2s…");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processOneJob();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Worker loop error:", err);
    }
    await sleep(2000);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


