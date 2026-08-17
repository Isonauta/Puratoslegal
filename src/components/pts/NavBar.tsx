"use client";

import Link from "next/link";
import { USER_ROLE_LABELS } from "@/lib/pts/labels";
import type { UserRole } from "@/generated/prisma/client";

interface NavBarProps {
  userName?: string;
  userRole?: string | null;
}

export default function PtsNavBar({ userName, userRole }: NavBarProps) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-10 bg-[#9B0E26] text-white shadow">
      <div className="px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white text-sm">
            ← Purasafe
          </Link>
          <span className="text-white/40">|</span>
          <Link href="/pts" className="font-bold text-lg tracking-wide">
            PTS
          </Link>
        </div>
        {userName && (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{userName}</p>
              {userRole && (
                <p className="text-red-200 text-xs">
                  {USER_ROLE_LABELS[userRole as UserRole] ?? userRole}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-[#C41230] hover:bg-[#7A0B1E] px-3 py-2 rounded-lg text-xs font-medium"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
