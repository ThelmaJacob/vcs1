"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowExit20Regular,
  BoardSplit20Regular,
  DataUsage20Regular,
  Grid20Regular,
  Table20Regular,
  QuestionCircle20Regular,
} from "@fluentui/react-icons";

const NAV = [
  { href: "/", label: "Dashboard", icon: DataUsage20Regular },
  { href: "/table", label: "Table View", icon: Table20Regular },
  { href: "/gallery", label: "Gallery View", icon: Grid20Regular },
  { href: "/board", label: "Funnel Board", icon: BoardSplit20Regular },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/login", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };

  return (
    <header className="sticky top-0 z-30">
      {/* Corporate band */}
      <div className="flex h-11 items-center justify-between bg-navy px-4 text-white">
        <div className="flex items-baseline gap-3">
          <span className="text-[17px] font-bold tracking-tight">Bayer</span>
          <span className="text-white/30">|</span>
          <span className="text-[13px] font-semibold text-white/90">Public Affairs</span>
          <span className="text-white/30">—</span>
          <span className="text-[13px] text-white/70">Value Capture System</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/manual"
            className="flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <QuestionCircle20Regular className="h-4 w-4" />
            User manual
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowExit20Regular className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* View navigation */}
      <div className="flex h-11 items-center gap-1 border-b border-line bg-white px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-[3px] px-3 py-1.5 text-[12.5px] font-semibold transition ${
                active
                  ? "bg-navy-tint text-navy"
                  : "text-ink-soft hover:bg-muted hover:text-navy"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* The two characters from the original app header. They live on this white
            row rather than on the navy band, where their dark line work would sink
            into the background. */}
        <span className="ml-auto flex shrink-0 items-end gap-1 pr-1">
          <img src="/character-extinguisher.png" alt="" width={38} height={38} />
          <img src="/character-timer.png" alt="" width={38} height={38} />
        </span>
      </div>
    </header>
  );
}
