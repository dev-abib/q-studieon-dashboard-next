"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_SECTIONS, Role } from "@/components/layout/dashboard/Sidebar";
import { Admin } from "@/features/admin/types/admin.types";
import { CornerDownLeft, Sparkles } from "lucide-react";

type CommandPaletteProps = {
  admin: Admin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  admin,
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const role = (admin.role as Role) || "admin";

  const accessibleSections = NAV_SECTIONS.map(section => {
    const flattenedItems: {
      label: string;
      category?: string;
      href: string;
      icon: React.ElementType;
    }[] = [];

    section.items.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          if (
            child.href &&
            !child.disabled &&
            (!child.requiredRoles || child.requiredRoles.includes(role))
          ) {
            flattenedItems.push({
              label: child.label,
              category: item.label,
              href: child.href,
              icon: child.icon || item.icon,
            });
          }
        });
      } else if (item.href && (!item.requiredRoles || item.requiredRoles.includes(role))) {
        flattenedItems.push({
          label: item.label,
          href: item.href,
          icon: item.icon,
        });
      }
    });

    return {
      title: section.title,
      items: flattenedItems,
    };
  }).filter(section => section.items.length > 0);

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a page name or search command…" />
      <CommandList>
        <CommandEmpty>No matching navigation pages found.</CommandEmpty>
        {accessibleSections.map(section => (
          <CommandGroup key={section.title} heading={section.title}>
            {section.items.map(({ label, category, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`${category ? `${category} ` : ""}${label} ${href}`}
                onSelect={() => handleSelect(href)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-data-[selected=true]:bg-primary group-data-[selected=true]:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    {category && (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-data-[selected=true]:text-primary/70">
                        {category} &gt;
                      </span>
                    )}
                    <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100 group-data-[selected=true]:text-primary">
                      {label}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 group-data-[selected=true]:text-slate-600 dark:group-data-[selected=true]:text-slate-300 truncate">
                    {href}
                  </span>
                </div>
                <CommandShortcut className="flex items-center gap-1 font-semibold text-slate-400 group-data-[selected=true]:text-primary">
                  <span>Jump</span>
                  <CornerDownLeft className="h-3 w-3" />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Quick Footer Navigation Hint Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑</kbd>
            <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1 font-medium">
            <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↵</kbd>
            Select
          </span>
        </div>
        <div className="flex items-center gap-1 text-primary font-semibold">
          <Sparkles className="h-3 w-3" />
          <span>Quick Palette</span>
        </div>
      </div>
    </CommandDialog>
  );
}
