import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { recognize } from "tesseract.js";

export async function extractTextFromFile(params: {
  absolutePath: string;
  mimetype: string;
}): Promise<string> {
  const { absolutePath, mimetype } = params;
  const buf = await fs.readFile(absolutePath);

  const isPdf =
    mimetype === "application/pdf" || absolutePath.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    // pdf-parse v1 is CommonJS and has debug side-effects when imported as ESM.
    // Using createRequire forces CommonJS loading reliably on Node 20+ / Windows.
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text?: string }>;
    if (typeof pdfParse !== "function") {
      throw new Error("pdf-parse kon niet geladen worden (geen function export).");
    }
    const parsed = await pdfParse(buf);
    return (parsed.text || "").trim();
  }

  const isImage = mimetype.startsWith("image/");
  if (!isImage) {
    throw new Error(
      `Onbekend bestandstype: ${mimetype || path.extname(absolutePath)}`,
    );
  }

  // OCR (Dutch). Note: first run may download language data / wasm.
  const res = await recognize(buf, "nld");
  return (res.data.text || "").trim();
}


