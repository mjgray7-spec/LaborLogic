import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                LL
              </span>
            </div>
            <span className="text-xl font-bold">LaborLogic</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8">
        <section className="py-20 md:py-32 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Stop overpaying for auto repairs
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your repair invoice and get an instant AI-powered analysis.
            LaborLogic checks labor rates, parts markup, and billed hours
            against industry benchmarks so you know if you&apos;re getting a
            fair deal.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Check Your Invoice Free
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. 3 free invoice checks per month.
          </p>
        </section>

        <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Snap or Upload</h3>
            <p className="text-muted-foreground text-sm">
              Take a photo of your invoice or upload a PDF. Our AI reads it
              instantly.
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Instant Analysis</h3>
            <p className="text-muted-foreground text-sm">
              We compare every line item against industry labor rates, standard
              repair times, and fair parts pricing.
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Know Before You Pay
            </h3>
            <p className="text-muted-foreground text-sm">
              Get a clear verdict: fair price, slightly high, or potential
              overcharge, with plain-English explanations.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LaborLogic. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
