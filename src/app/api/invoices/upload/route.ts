import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { invoices, invoiceLineItems, vendors } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  parseInvoiceFromImage,
  parseInvoiceFromText,
  validateWithBenchmark,
} from "@/lib/ai-parser";

// Allow up to 60s for AI parsing
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ message: "No file uploaded" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { message: "Only images (JPEG, PNG) and PDFs are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { message: "File size exceeds 10MB limit" },
      { status: 400 }
    );
  }

  try {
    const ext = file.name.split(".").pop() || "bin";
    const blobPath = `invoices/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(blobPath, file, { access: "public" });

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId,
        fileName: file.name,
        fileUrl: blob.url,
        fileType: ext,
        status: "pending",
      })
      .returning();

    // Process asynchronously — don't block the response
    processInvoice(newInvoice.id, userId, file, ext).catch((error) => {
      console.error("Invoice processing failed:", error);
    });

    return Response.json({ message: "Invoice uploaded successfully", invoice: newInvoice });
  } catch (error) {
    console.error("Upload failed:", error);
    return Response.json(
      { message: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}

async function processInvoice(
  invoiceId: string,
  userId: string,
  file: File,
  fileType: string
) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let parsedData;

    if (fileType === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      const fullText = textResult.pages.map((p) => p.text).join("\n");
      parsedData = await parseInvoiceFromText(fullText);
    } else {
      const base64 = buffer.toString("base64");
      parsedData = await parseInvoiceFromImage(base64);
    }

    let hasFlags = false;

    if (parsedData.lineItems?.length) {
      for (const item of parsedData.lineItems) {
        const validation = await validateWithBenchmark(item, parsedData.vehicleInfo);
        if (validation.flagged) hasFlags = true;

        await db.insert(invoiceLineItems).values({
          invoiceId,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity?.toString(),
          unitPrice: item.unitPrice?.toString(),
          totalPrice: item.totalPrice?.toString(),
          laborHours: item.laborHours?.toString(),
          benchmarkRate: validation.benchmarkRate?.toString(),
          benchmarkTime: validation.benchmarkTime?.toString(),
          variance: validation.variance?.toString(),
          flagged: validation.flagged,
          flagReason: validation.flagReason,
        });
      }
    }

    await db
      .update(invoices)
      .set({
        vendorName: parsedData.vendorName,
        invoiceNumber: parsedData.invoiceNumber,
        invoiceDate: parsedData.invoiceDate ? new Date(parsedData.invoiceDate) : null,
        vehicleId: parsedData.vehicleInfo?.id,
        vehicleMake: parsedData.vehicleInfo?.make,
        vehicleModel: parsedData.vehicleInfo?.model,
        vehicleYear: parsedData.vehicleInfo?.year,
        totalAmount: parsedData.totals.total?.toString(),
        laborTotal: parsedData.totals.labor?.toString(),
        partsTotal: parsedData.totals.parts?.toString(),
        taxTotal: parsedData.totals.tax?.toString(),
        parsedData: parsedData,
        status: hasFlags ? "flagged" : "validated",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    // Upsert vendor
    if (parsedData.vendorName) {
      const [existingVendor] = await db
        .select()
        .from(vendors)
        .where(
          and(eq(vendors.userId, userId), eq(vendors.name, parsedData.vendorName))
        );

      if (existingVendor) {
        await db
          .update(vendors)
          .set({
            totalInvoices: sql`${vendors.totalInvoices} + 1`,
            totalSpend: sql`${vendors.totalSpend} + ${parsedData.totals.total || 0}`,
            flaggedInvoices: hasFlags
              ? sql`${vendors.flaggedInvoices} + 1`
              : vendors.flaggedInvoices,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, existingVendor.id));
      } else {
        await db.insert(vendors).values({
          userId,
          name: parsedData.vendorName,
          totalInvoices: 1,
          totalSpend: parsedData.totals.total?.toString() || "0",
          flaggedInvoices: hasFlags ? 1 : 0,
        });
      }
    }
  } catch (error) {
    console.error("AI parsing failed:", error);
    await db
      .update(invoices)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }
}
