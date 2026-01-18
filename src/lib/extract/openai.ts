import OpenAI from "openai";
import { llmResultSchema, type LlmResult } from "@/lib/extract/llmSchema";

const SYSTEM_PROMPT_NL = `Je bent een assistent die administratieve documenten leest.
Je output is ALLEEN geldige JSON (geen markdown, geen tekst).

Je moet exact dit schema aanhouden:
{
  "docType": "BELASTING|BOETE|VERZEKERING|ABONNEMENT|OVERIG",
  "sender": "string|null",
  "summarySimple": "string",
  "actions": [{"title":"string","description":"string","deadline":"YYYY-MM-DD|null"}],
  "amountEUR": number|null,
  "deadline": "YYYY-MM-DD|null",
  "confidence": number
}

Regels:
- Schrijf summarySimple in simpele Nederlandse taal, maximaal 5 regels.
- Schrijf actions (title en description) in het Nederlands.
- deadlines: als je geen datum ziet, gebruik null.
- confidence: 0 t/m 100 (integer of decimal is ok).
`;

const SYSTEM_PROMPT_AR = `أنت مساعد يقرأ المستندات الإدارية.
يجب أن يكون الناتج JSON صالح فقط (بدون markdown، بدون نص إضافي).

يجب أن تتبع هذا المخطط بالضبط:
{
  "docType": "BELASTING|BOETE|VERZEKERING|ABONNEMENT|OVERIG",
  "sender": "string|null",
  "summarySimple": "string",
  "actions": [{"title":"string","description":"string","deadline":"YYYY-MM-DD|null"}],
  "amountEUR": number|null,
  "deadline": "YYYY-MM-DD|null",
  "confidence": number
}

القواعد:
- اكتب summarySimple باللغة العربية البسيطة، بحد أقصى 5 أسطر.
- اكتب actions (العنوان والوصف) باللغة العربية.
- التواريخ: إذا لم تجد تاريخاً، استخدم null.
- confidence: من 0 إلى 100.
`;

function getSystemPrompt(language: string): string {
  return language === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_NL;
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY ontbreekt.");
  return new OpenAI({ apiKey });
}

function truncateText(text: string, max = 12000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[...TRUNCATED...]";
}

async function callLLM(inputText: string, language: string = "nl") {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt = getSystemPrompt(language);
  
  const userPrompt = language === "ar" 
    ? `اقرأ النص التالي وأعطِ JSON وفقًا للمخطط.\n\nالنص:\n"""${truncateText(inputText)}"""`
    : `Lees onderstaande tekst en geef JSON volgens het schema.\n\nTEKST:\n"""${truncateText(inputText)}"""`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content.trim()) throw new Error(language === "ar" ? "ناتج فارغ من الذكاء الاصطناعي" : "Lege LLM output.");
  return content;
}

export async function extractWithOpenAI(inputText: string, language: string = "nl"): Promise<LlmResult> {
  const first = await callLLM(inputText, language);
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
    
    const systemContent = language === "ar"
      ? "مهمتك: حوّل المدخلات إلى JSON صالح يتوافق تمامًا مع المخطط. أخرج JSON فقط."
      : "Je taak: maak van de input geldige JSON die exact aan het schema voldoet. Output alleen JSON.";
    
    const userContent = language === "ar"
      ? `الناتج السابق كان غير صالح.\nالخطأ:\n${String(err)}\n\nالناتج غير الصالح:\n${first}\n\nأعطِ الآن JSON صالح فقط وفقًا للمخطط (بدون نص إضافي).`
      : `De vorige output was ongeldig.\nFOUT:\n${String(err)}\n\nONGELDIGE OUTPUT:\n${first}\n\nGeef nu alleen geldige JSON volgens het schema (geen extra tekst).`;
    
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
    });
    const fixed = completion.choices[0]?.message?.content ?? "";
    try {
      return tryParse(fixed);
    } catch (err2) {
      const errorMsg = language === "ar" 
        ? `ناتج الذكاء الاصطناعي غير صالح بعد إعادة المحاولة: ${String(err2)}`
        : `LLM output ongeldig na retry: ${String(err2)}`;
      throw new Error(errorMsg);
    }
  }
}


