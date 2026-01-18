import { z } from "zod";

export const llmResultSchema = z.object({
  docType: z.enum(["BELASTING", "BOETE", "VERZEKERING", "ABONNEMENT", "OVERIG"]),
  sender: z.string().nullable(),
  // Accept both summarySimple (new) and summarySimpleNL (legacy)
  summarySimple: z.string().min(1).max(1200).optional(),
  summarySimpleNL: z.string().min(1).max(1200).optional(),
  actions: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      deadline: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    }),
  ),
  amountEUR: z.number().nullable(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  confidence: z.number().min(0).max(100),
}).transform((data) => ({
  ...data,
  // Normalize to summarySimple
  summarySimple: data.summarySimple || data.summarySimpleNL || "",
}));

export type LlmResult = z.infer<typeof llmResultSchema>;


