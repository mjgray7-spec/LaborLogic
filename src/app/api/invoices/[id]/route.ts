import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { invoices, invoiceLineItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]">
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

  if (!invoice) {
    return Response.json({ message: "Invoice not found" }, { status: 404 });
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoice.id));

  return Response.json({ ...invoice, lineItems });
}
