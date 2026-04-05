import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, TrendingUp, Upload, Users } from "lucide-react";

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pending Review" },
    validated: { variant: "default", label: "Validated" },
    flagged: { variant: "destructive", label: "Flagged" },
    reviewed: { variant: "outline", label: "Reviewed" },
  };
  const config = variants[status] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [stats] = await db
    .select({
      totalInvoices: sql<number>`count(${invoices.id})`,
      flaggedCount: sql<number>`count(case when ${invoices.status} = 'flagged' then 1 end)`,
      totalSpend: sql<string>`coalesce(sum(${invoices.totalAmount}::numeric), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  const recentInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Invoice Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-powered maintenance invoice verification and cost benchmarking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">Processed this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats?.flaggedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(stats?.totalSpend || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Across all invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Invoice</CardTitle>
            <CardDescription>Scan or upload a maintenance invoice for validation</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upload">
              <Button className="w-full" size="lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Analytics</CardTitle>
            <CardDescription>View performance metrics by vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vendors">
              <Button variant="outline" className="w-full" size="lg">
                <Users className="mr-2 h-5 w-5" />
                View Vendors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your most recently uploaded invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No invoices yet. Upload your first invoice to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{invoice.vendorName || "Unknown Vendor"}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Invoice #{invoice.invoiceNumber || "N/A"} &bull;{" "}
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "No date"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ${invoice.totalAmount ? parseFloat(invoice.totalAmount).toFixed(2) : "0.00"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
