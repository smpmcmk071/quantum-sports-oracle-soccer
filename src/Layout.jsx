import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, LayoutDashboard, Calendar, Database, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { label: "Matches", page: "Matches", icon: Calendar },
  { label: "Predictions", page: "Predictions", icon: TrendingUp },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      {/* Top Nav */}
      <nav className="border-b border-white/5 bg-[#080b14]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white text-sm tracking-tight">Quantum</span>
              <span className="font-light text-white/40 text-sm ml-1">Oracle</span>
              <span className="ml-2 text-[10px] bg-violet-500/20 text-violet-300 rounded-full px-2 py-0.5 font-medium">MLS</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ label, page, icon: Icon }) => {
              const isActive = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Admin link (only for admins) */}
            {user?.role === "admin" && (
              <Link
                to={createPageUrl("Admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPageName === "Admin"
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-white/30 hover:text-amber-300 hover:bg-amber-500/10"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-4 text-center">
        <p className="text-[11px] text-white/20 leading-relaxed">
          © {new Date().getFullYear()} Threshold7 Analytics & 7day11.com · All Rights Reserved.<br />
          MLS data provided by ESPN. MLS and all team names/logos are trademarks of their respective owners. For entertainment purposes only.
        </p>
      </footer>
    </div>
  );
}