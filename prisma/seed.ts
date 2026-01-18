import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "test@test.com";
  const password = "Test123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  const now = new Date();

  const doc1 = await prisma.document.create({
    data: {
      userId: user.id,
      filePath: "uploads/demo/demo.pdf",
      originalFilename: "voorbeeld-belastingbrief.pdf",
      mimetype: "application/pdf",
      extractedText: "Belastingdienst: U moet vóór 2026-02-01 betalen…",
      type: "BELASTING",
      sender: "Belastingdienst",
      amount: new Prisma.Decimal(123.45),
      deadline: new Date("2026-02-01T00:00:00.000Z"),
      summary:
        "Dit is een belastingbrief.\nJe moet €123,45 betalen.\nBetaal vóór 1 februari 2026.",
      confidence: 84,
      job: { create: { status: "DONE" } },
      actionItems: {
        create: [
          {
            title: "Betaal aanslag",
            description: "Betaal €123,45 via iDEAL of overschrijving.",
            deadline: new Date("2026-02-01T00:00:00.000Z"),
            status: "OPEN",
            notes: "Check of er betalingsregeling kan.",
          },
        ],
      },
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      userId: user.id,
      filePath: "uploads/demo/demo2.jpg",
      originalFilename: "voorbeeld-boete.jpg",
      mimetype: "image/jpeg",
      extractedText: "CJIB: boete €79… Betaal vóór 2026-01-20…",
      type: "BOETE",
      sender: "CJIB",
      amount: new Prisma.Decimal(79),
      deadline: new Date("2026-01-20T00:00:00.000Z"),
      summary:
        "Dit is een boete van het CJIB.\nJe moet €79 betalen.\nBetaal vóór 20 januari 2026.",
      confidence: 77,
      job: { create: { status: "DONE" } },
      actionItems: {
        create: [
          {
            title: "Betaal boete",
            description: "Betaal het bedrag om verhoging te voorkomen.",
            deadline: new Date("2026-01-20T00:00:00.000Z"),
            status: "DONE",
            notes: "Al betaald op 2026-01-05.",
          },
          {
            title: "Bewaar betalingsbewijs",
            description: "Sla een screenshot of pdf op voor je administratie.",
            deadline: null,
            status: "OPEN",
          },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed klaar:", { user: user.email, docs: [doc1.id, doc2.id].length });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


