import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { vendors, invoices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/vendors/[id]/analytics">
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, id), eq(vendors.userId, userId)));

  if (!vendor) {
    return Response.json({ message: "Vendor not found" }, { status: 404 });
  }

  const vendorInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.vendorName, vendor.name)))
    .orderBy(desc(invoices.invoiceDate));

  return Response.json({
    vendor,
    invoices: vendorInvoices,
    stats: {
      totalInvoices: vendor.totalInvoices,
      totalSpend: vendor.totalSpend,
      averageVariance: vendor.averageVariance,
      flaggedInvoices: vendor.flaggedInvoices,
    },
  });
}
