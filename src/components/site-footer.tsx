import { Link } from "@tanstack/react-router";
import { KnifeMark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <KnifeMark className="h-3.5 w-3.5 text-ember" />
          <span className="font-mono">KILL MY IDEA · 2026</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/billing" className="transition-colors hover:text-foreground">
            Billing
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link to="/refunds" className="transition-colors hover:text-foreground">
            Refunds
          </Link>
        </nav>
      </div>
    </footer>
  );
}
