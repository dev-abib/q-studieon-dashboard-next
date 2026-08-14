"use client";

import React, { useState, useEffect } from "react";
import { Eye, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const [impersonatedUser, setImpersonatedUser] = useState<string | null>(null);

  useEffect(() => {
    // Check if session has active impersonation
    const stored = localStorage.getItem("impersonated_user");
    if (stored) {
      setImpersonatedUser(stored);
    }
  }, []);

  const handleExit = () => {
    localStorage.removeItem("impersonated_user");
    localStorage.removeItem("impersonated_token");
    window.location.href = "/dashboard/users";
  };

  if (!impersonatedUser) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-amber-500 text-slate-950 font-semibold text-xs shadow-md">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          <strong>Safe Impersonation Mode Active:</strong> You are viewing the platform as <u>{impersonatedUser}</u>.
        </span>
      </div>

      <Button
        size="sm"
        onClick={handleExit}
        className="h-7 px-3 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg gap-1.5"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Exit Impersonation</span>
      </Button>
    </div>
  );
}
