import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [stats] = await db
    .select({
      totalInvoices: sql<number>`count(${invoices.id})`,
      flaggedCount: sql<number>`count(case when ${invoices.status} = 'flagged' then 1 end)`,
      totalSpend: sql<string>`coalesce(sum(${invoices.totalAmount}::numeric), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  return Response.json(
    stats || { totalInvoices: 0, flaggedCount: 0, totalSpend: "0" }
  );
}
