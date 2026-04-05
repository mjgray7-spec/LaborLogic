import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoices, invoiceLineItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";

function getStatusBadge(status: string) {
  const config: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string; icon: React.ReactNode }> = {
    pending: { variant: "secondary", label: "Processing", icon: <Clock className="h-3 w-3" /> },
    validated: { variant: "default", label: "Validated", icon: <CheckCircle2 className="h-3 w-3" /> },
    flagged: { variant: "destructive", label: "Flagged", icon: <AlertTriangle className="h-3 w-3" /> },
    reviewed: { variant: "outline", label: "Reviewed", icon: <CheckCircle2 className="h-3 w-3" /> },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant={c.variant} className="flex items-center gap-1">
      {c.icon} {c.label}
    </Badge>
  );
}

export default async function InvoiceDetailPage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;
  const { userId } = await auth();
  if (!userId) return null;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

  if (!invoice) notFound();

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoice.id));

  const flaggedItems = lineItems.filter((item) => item.flagged);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">&larr; Back to Dashboard</Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{invoice.vendorName || "Unknown Vendor"}</h1>
            <p className="text-muted-foreground">
              Invoice #{invoice.invoiceNumber || "N/A"}
              {invoice.invoiceDate && ` - ${new Date(invoice.invoiceDate).toLocaleDateString()}`}
            </p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>
      </div>

      {invoice.status === "pending" && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Processing your invoice...</p>
                <p className="text-sm text-muted-foreground">
                  Our AI is analyzing the document. This usually takes 10-30 seconds. Refresh to check status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {flaggedItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">
                  {flaggedItems.length} item{flaggedItems.length > 1 ? "s" : ""} flagged for review
                </p>
                <p className="text-sm text-muted-foreground">
                  Some charges on this invoice may be above typical rates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoice.vehicleYear || invoice.vehicleMake || invoice.vehicleModel ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">
                    {[invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel].filter(Boolean).join(" ")}
                  </span>
                </div>
                {invoice.odometerReading && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Odometer</span>
                    <span className="font-medium">{invoice.odometerReading.toLocaleString()} mi</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No vehicle info extracted</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labor</span>
              <span className="font-medium">${parseFloat(invoice.laborTotal || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium">${parseFloat(invoice.partsTotal || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${parseFloat(invoice.taxTotal || "0").toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${parseFloat(invoice.totalAmount || "0").toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {invoice.status === "pending" ? "Items will appear once processing completes." : "No line items found."}
            </p>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${item.flagged ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{item.itemType}</Badge>
                        {item.flagged && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${parseFloat(item.totalPrice || "0").toFixed(2)}</p>
                    </div>
                  </div>

                  {item.itemType === "labor" && item.laborHours && (
                    <div className="text-sm text-muted-foreground mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <span className="block text-xs">Billed Hours</span>
                        <span className="font-medium text-foreground">{parseFloat(item.laborHours).toFixed(1)}h</span>
                      </div>
                      {item.benchmarkRate && (
                        <div>
                          <span className="block text-xs">Benchmark Rate</span>
                          <span className="font-medium text-foreground">${parseFloat(item.benchmarkRate).toFixed(0)}/hr</span>
                        </div>
                      )}
                      {item.variance && (
                        <div>
                          <span className="block text-xs">Variance</span>
                          <span className={`font-medium ${parseFloat(item.variance) > 0 ? "text-orange-600" : "text-green-600"}`}>
                            {parseFloat(item.variance) > 0 ? "+" : ""}{parseFloat(item.variance).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {item.flagReason && (
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {item.flagReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.fileUrl && (
        <div className="mt-6 text-center">
          <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> View Original Document
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
