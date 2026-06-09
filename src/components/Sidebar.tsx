"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, Wind, Upload, TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/workouts", label: "筋トレ記録", icon: Dumbbell },
  { href: "/cardio", label: "有酸素運動", icon: Wind },
  { href: "/progress", label: "進捗グラフ", icon: TrendingUp },
  { href: "/import", label: "CSVインポート", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-card sticky top-0 z-50">
        <span className="font-bold text-lg text-primary">FitTracker</span>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-md hover:bg-accent">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:flex",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 flex items-center px-6 border-b shrink-0">
          <span className="font-bold text-xl text-primary">💪 FitTracker</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t text-xs text-muted-foreground">
          健康管理アプリ v1.0
        </div>
      </aside>
    </>
  );
}
