import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export interface ParsedInvoiceData {
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  vehicleInfo?: {
    id?: string;
    make?: string;
    model?: string;
    year?: number;
  };
  lineItems: Array<{
    itemType: "labor" | "parts" | "other";
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    laborHours?: number;
  }>;
  totals: {
    labor?: number;
    parts?: number;
    tax?: number;
    total?: number;
  };
}

const EXTRACTION_PROMPT = `You are an expert at parsing auto repair and maintenance invoices. Extract structured data from the invoice and return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "vendorName": "string",
  "invoiceNumber": "string",
  "invoiceDate": "ISO date string",
  "vehicleInfo": { "id": "string", "make": "string", "model": "string", "year": number },
  "lineItems": [
    {
      "itemType": "labor|parts|other",
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "laborHours": number
    }
  ],
  "totals": { "labor": number, "parts": number, "tax": number, "total": number }
}
Be precise with numbers and dates. If a field is not present, omit it.`;

export async function parseInvoiceFromImage(
  base64Image: string
): Promise<ParsedInvoiceData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  return extractJson(response.choices[0]?.message?.content || "{}");
}

export async function parseInvoiceFromText(
  text: string
): Promise<ParsedInvoiceData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at parsing maintenance invoices. Extract structured data and return valid JSON only.",
      },
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nInvoice text:\n${text}`,
      },
    ],
    max_tokens: 2000,
  });

  return extractJson(response.choices[0]?.message?.content || "{}");
}

function extractJson(text: string): ParsedInvoiceData {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to extract JSON from AI response");
}

export async function validateWithBenchmark(
  lineItem: {
    itemType: string;
    description: string;
    laborHours?: number;
    totalPrice?: number;
  },
  _vehicleInfo?: {
    year?: number;
    make?: string;
    model?: string;
  }
): Promise<{
  benchmarkRate?: number;
  benchmarkTime?: number;
  variance?: number;
  flagged: boolean;
  flagReason?: string;
}> {
  // Placeholder for Motor API integration (Phase 2)
  // Currently uses simple rule-based validation
  const result: {
    benchmarkRate?: number;
    benchmarkTime?: number;
    variance?: number;
    flagged: boolean;
    flagReason?: string;
  } = { flagged: false };

  if (
    lineItem.itemType === "labor" &&
    lineItem.laborHours &&
    lineItem.totalPrice
  ) {
    const rate = lineItem.totalPrice / lineItem.laborHours;
    const benchmarkRate = 100;

    result.benchmarkRate = benchmarkRate;
    result.variance = ((rate - benchmarkRate) / benchmarkRate) * 100;

    if (rate > 150) {
      result.flagged = true;
      result.flagReason = `Labor rate ($${rate.toFixed(2)}/hr) exceeds typical range`;
    }
  }

  if (lineItem.itemType === "parts" && lineItem.totalPrice) {
    if (lineItem.totalPrice > 500) {
      result.variance = 25;
    }
  }

  return result;
}
