import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userVendors = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .orderBy(desc(vendors.totalSpend));

  return Response.json(userVendors);
}
