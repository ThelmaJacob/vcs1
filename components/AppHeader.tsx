"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowExit20Regular,
  BoardSplit20Regular,
  DataUsage20Regular,
  Table20Regular,
  QuestionCircle20Regular,
} from "@fluentui/react-icons";

const NAV = [
  { href: "/", label: "Dashboard", icon: DataUsage20Regular },
  { href: "/table", label: "Table View", icon: Table20Regular },
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

  const isActive = (item: (typeof NAV)[number]) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <header className="sticky top-0 z-30">
      {/* Corporate band */}
      <div className="flex h-11 items-center justify-between bg-navy px-4 text-white">
        <div className="flex items-baseline gap-3">
          <span className="text-[17px] font-bold tracking-tight">Bayer</span>
          <span className="text-white/30">|</span>
          <span className="text-[13px] font-semibold text-white/90">Public Affairs</span>
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

      {/* Title band, as in the original app: the same character on both sides */}
      <div className="flex items-center justify-center gap-6 border-b border-line bg-white py-1.5">
        <img src="/character-extinguisher.png" alt="" width={54} height={62} />
        <div className="text-center">
          <h1 className="text-[16px] font-bold text-navy">
            Public Affairs — Value Capture System
          </h1>
          <p className="text-[10.5px] text-ink-soft">Version 1.0</p>
        </div>
        <img
          src="/character-extinguisher.png"
          alt=""
          width={54}
          height={62}
          className="-scale-x-100"
        />
      </div>

      {/* Views, and the actions available on every screen */}
      <div className="flex h-11 items-center gap-1 border-b border-line bg-white px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-[3px] px-3 py-1.5 text-[12.5px] font-semibold transition ${
                active ? "bg-navy-tint text-navy" : "text-ink-soft hover:bg-muted hover:text-navy"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Screen-level actions go here, on the right of the view tabs. */}
      </div>
    </header>
  );
}
