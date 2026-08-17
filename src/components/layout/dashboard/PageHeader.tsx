"use client";

import React from "react";

type PageHeaderProps = {
  kicker: string;
  title: React.ReactNode;
  icon: React.ElementType;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  kicker,
  title,
  icon: Icon,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5">
            <span>{kicker}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0">{children}</div>
      )}
    </div>
  );
}
