import OpenAI from "openai";
import { llmResultSchema, type LlmResult } from "@/lib/extract/llmSchema";

const SYSTEM_PROMPT = `Je bent een assistent die Nederlandse administratieve documenten leest.
Je output is ALLEEN geldige JSON (geen markdown, geen tekst).

Je moet exact dit schema aanhouden:
{
  "docType": "BELASTING|BOETE|VERZEKERING|ABONNEMENT|OVERIG",
  "sender": "string|null",
  "summarySimpleNL": "string",
  "actions": [{"title":"string","description":"string","deadline":"YYYY-MM-DD|null"}],
  "amountEUR": number|null,
  "deadline": "YYYY-MM-DD|null",
  "confidence": number
}

Regels:
- Schrijf summarySimpleNL in simpele Nederlandse taal, maximaal 5 regels.
- deadlines: als je geen datum ziet, gebruik null.
- confidence: 0 t/m 100 (integer of decimal is ok).
`;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY ontbreekt.");
  return new OpenAI({ apiKey });
}

function truncateText(text: string, max = 12000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[...TRUNCATED...]";
}

async function callLLM(inputText: string) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Lees onderstaande tekst en geef JSON volgens het schema.\n\n` +
          `TEKST:\n"""${truncateText(inputText)}"""`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content.trim()) throw new Error("Lege LLM output.");
  return content;
}

export async function extractWithOpenAI(inputText: string): Promise<LlmResult> {
  const first = await callLLM(inputText);
  const tryParse = (raw: string) => {
    const json = JSON.parse(raw);
    return llmResultSchema.parse(json);
  };

  try {
    return tryParse(first);
  } catch (err) {
    // Retry once with a "fix JSON" prompt
    const client = getClient();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Je taak: maak van de input geldige JSON die exact aan het schema voldoet. Output alleen JSON.",
        },
        {
          role: "user",
          content:
            `De vorige output was ongeldig.\n` +
            `FOUT:\n${String(err)}\n\n` +
            `ONGELDIGE OUTPUT:\n${first}\n\n` +
            `Geef nu alleen geldige JSON volgens het schema (geen extra tekst).`,
        },
      ],
    });
    const fixed = completion.choices[0]?.message?.content ?? "";
    try {
      return tryParse(fixed);
    } catch (err2) {
      throw new Error(`LLM output ongeldig na retry: ${String(err2)}`);
    }
  }
}


