import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useLang, type Lang } from "@/lib/i18n";
import { useAuth, signOut } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, CreditCard, LogOut, ScrollText } from "lucide-react";
import { getMyMeta } from "@/lib/analyses.functions";

export function SiteHeader() {
  const { t } = useLang();
  const { user } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_4px_20px_-4px_var(--ember)]">
            <KnifeMark className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Kill My Idea</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" hash="how" className="transition-colors hover:text-foreground">
            {t("nav.how")}
          </Link>
          <Link to="/" hash="features" className="transition-colors hover:text-foreground">
            {t("nav.features")}
          </Link>
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/" hash="faq" className="transition-colors hover:text-foreground">
            {t("nav.faq")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/kill" }}
              className="hidden rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/kill"
            search={{ demo: false }}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            {t("nav.cta")} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-ember to-ember-glow text-xs font-bold text-background shadow-[0_2px_12px_-4px_var(--ember)]">
      {initials}
    </div>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const fetchMeta = useServerFn(getMyMeta);
  const { data: meta } = useQuery({
    queryKey: ["my-meta"],
    queryFn: () => fetchMeta(),
    enabled: !!user,
  });

  const displayName = meta?.displayName ?? (user as { name?: string } | null)?.name ?? "";
  const email = meta?.email ?? user?.email ?? "";
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email.slice(0, 1).toUpperCase();

  const isFree = meta?.plan === "free";
  const hasUnlimitedQuota = meta?.isAdmin || meta?.quota === null;
  const used = meta?.used ?? 0;
  const quota = meta?.quota ?? 0;
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        >
          <UserAvatar initials={initials} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5">
            <UserAvatar initials={initials} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{displayName || email}</p>
              {displayName && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
        </DropdownMenuLabel>

        {hasUnlimitedQuota && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Admin - unlimited</div>
        )}

        {!hasUnlimitedQuota && isFree && quota > 0 && (
          <>
            <div className="px-2 py-1.5">
              <p className="mb-1.5 text-xs text-muted-foreground">
                Free plan · {used}/{quota} used
              </p>
              <div className="h-1 rounded-full bg-border">
                <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-ember" />
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/my-autopsies" className="flex cursor-pointer items-center gap-2">
            <ScrollText className="h-4 w-4" /> Mis autopsias
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" /> Account settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/billing" className="flex cursor-pointer items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  const langs: Lang[] = ["en", "es"];

  return (
    <div
      role="group"
      aria-label="Language"
      className="relative flex items-center rounded-full border border-border bg-surface/60 p-0.5 text-xs font-medium backdrop-blur"
    >
      {langs.map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={`relative z-10 rounded-full px-2.5 py-1 font-mono uppercase tracking-wider transition-colors ${
              active ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-toggle-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-ember to-ember-glow"
              />
            )}
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function KnifeMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
      <path d="m13 19 6-6" />
      <path d="m16 16 4 4" />
      <path d="m19 21 2-2" />
    </svg>
  );
}
