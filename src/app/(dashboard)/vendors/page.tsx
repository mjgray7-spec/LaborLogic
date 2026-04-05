import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";

export default async function VendorsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const userVendors = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .orderBy(desc(vendors.totalSpend));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">&larr; Back to Dashboard</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Vendor Analytics</h1>
        <p className="text-muted-foreground">
          Track spending and flag patterns across your repair shops
        </p>
      </div>

      {userVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No vendor data yet. Upload invoices to start tracking vendors.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  {(vendor.flaggedInvoices ?? 0) > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {vendor.flaggedInvoices} flagged
                    </Badge>
                  )}
                </div>
                <CardDescription>{vendor.totalInvoices} invoice{vendor.totalInvoices !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Spend</span>
                    <span className="font-bold text-lg">
                      ${parseFloat(vendor.totalSpend || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {vendor.averageVariance && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Variance</span>
                      <span className={`font-medium flex items-center gap-1 ${parseFloat(vendor.averageVariance) > 0 ? "text-orange-600" : "text-green-600"}`}>
                        <TrendingUp className="h-3 w-3" />
                        {parseFloat(vendor.averageVariance) > 0 ? "+" : ""}
                        {parseFloat(vendor.averageVariance).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
