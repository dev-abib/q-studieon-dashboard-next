"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  BookDashed,
  HelpCircle,
  BookMarked,
  Lightbulb,
  MessageCircleQuestion,
  ShieldAlert,
  Headphones,
  FileText,
  DollarSign,
  Building2,
  ChevronDown,
  Smartphone,
  Globe,
  LayoutTemplate,
  Newspaper,
  Image as ImageIcon,
  MessageSquareQuote,
  MailQuestion,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Role =
  | "super_admin"
  | "admin"
  | "customer_support"
  | "content_manager"
  | "finance"
  | "user";

interface SidebarProps {
  role: Role | string | null;
}

export interface NavSubItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  badge?: string;
  disabled?: boolean;
  requiredRoles?: Role[];
}

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  requiredRoles?: Role[];
  badge?: string;
  children?: NavSubItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Users",
        href: "/dashboard/users",
        icon: Users,
        requiredRoles: ["super_admin", "admin", "customer_support"],
      },
      {
        label: "Admins",
        href: "/dashboard/admins",
        icon: ShieldCheck,
        requiredRoles: ["super_admin"],
      },
      {
        label: "User Inquiries",
        href: "/dashboard/queries",
        icon: MailQuestion,
        requiredRoles: ["super_admin", "admin", "customer_support"],
      },
    ],
  },
  {
    title: "Content & Management",
    items: [
      {
        label: "App CMS",
        icon: Smartphone,
        children: [
          {
            label: "Categories",
            href: "/dashboard/categories",
            icon: BookMarked,
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Questions",
            href: "/dashboard/questions",
            icon: HelpCircle,
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Helpful Insights",
            href: "/dashboard/insights",
            icon: Lightbulb,
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "FAQs",
            href: "/dashboard/faqs",
            icon: MessageCircleQuestion,
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Dynamic Pages",
            href: "/dashboard/dynamic-page",
            icon: BookDashed,
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
        ],
      },
      {
        label: "Website CMS",
        icon: Globe,
        badge: "Soon",
        children: [
          {
            label: "Pages & Sections",
            disabled: true,
            icon: LayoutTemplate,
            badge: "Soon",
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Blogs & Articles",
            disabled: true,
            icon: Newspaper,
            badge: "Soon",
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Hero & Banners",
            disabled: true,
            icon: ImageIcon,
            badge: "Soon",
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Testimonials",
            disabled: true,
            icon: MessageSquareQuote,
            badge: "Soon",
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
          {
            label: "Website FAQs",
            disabled: true,
            icon: HelpCircle,
            badge: "Soon",
            requiredRoles: [
              "super_admin",
              "admin",
              "customer_support",
              "content_manager",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

function hasAccess(item: NavItem | NavSubItem, role: Role) {
  return !item.requiredRoles || item.requiredRoles.includes(role);
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = (role as Role) || "admin";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "App CMS": true,
    "Website CMS": true,
  });

  // Automatically keep active group open when navigating
  useEffect(() => {
    NAV_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(child =>
            pathname === child.href || pathname.startsWith(`${child.href}/`)
          );
          if (isChildActive) {
            setOpenGroups(prev => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
  }, [pathname]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const getRoleBadge = (userRole: string | null) => {
    switch (userRole) {
      case "super_admin":
        return {
          label: "Super Admin",
          icon: ShieldAlert,
          bg: "bg-primary/10 text-primary border-primary/20",
        };
      case "customer_support":
        return {
          label: "Support Member",
          icon: Headphones,
          bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
        };
      case "content_manager":
        return {
          label: "Content Manager",
          icon: FileText,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          label: "Administrator",
          icon: ShieldCheck,
          bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
        };
    }
  };

  const roleInfo = getRoleBadge(role);
  const RoleIcon = roleInfo.icon;

  return (
    <aside className="w-64 rounded-2xl h-full bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
      {/* ── Brand Logo ── */}
      <div className="h-18 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              {process.env.NEXT_PUBLIC_SITE_NAME || "Dwellr"}
            </h1>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation Items ── */}
      <ScrollArea className="flex-1 px-3.5 py-5">
        <div className="flex flex-col gap-5">
          {NAV_SECTIONS.map(section => {
            const filteredItems = section.items
              .map(item => {
                if (item.children) {
                  const filteredChildren = item.children.filter(child =>
                    hasAccess(child, currentRole)
                  );
                  return filteredChildren.length > 0
                    ? { ...item, children: filteredChildren }
                    : null;
                }
                return hasAccess(item, currentRole) ? item : null;
              })
              .filter(Boolean) as NavItem[];

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="flex flex-col gap-1">
                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {section.title}
                </p>
                <nav className="flex flex-col gap-1">
                  {filteredItems.map(item => {
                    const { label, href, icon: Icon, badge, children } = item;

                    // Group / Sub-menu handling
                    if (children && children.length > 0) {
                      const isOpen = openGroups[label] ?? true;
                      const hasActiveChild = children.some(child =>
                        pathname === child.href || pathname.startsWith(`${child.href}/`)
                      );

                      return (
                        <div key={label} className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => toggleGroup(label)}
                            className={`group flex items-center justify-between w-full rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                              hasActiveChild
                                ? "text-slate-900 dark:text-white font-semibold bg-slate-100/70 dark:bg-slate-800/70"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`h-[15px] w-[15px] shrink-0 transition-colors ${
                                  hasActiveChild
                                    ? "text-primary"
                                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                }`}
                              />
                              <span className="truncate">{label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {badge && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                                  {badge}
                                </span>
                              )}
                              <ChevronDown
                                className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {/* Sub items collapsible list */}
                          {isOpen && (
                            <div className="mt-0.5 ml-3.5 pl-3 border-l border-slate-200/80 dark:border-slate-800 flex flex-col gap-0.5 py-1">
                              {children.map(child => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  !child.disabled &&
                                  child.href &&
                                  (pathname === child.href ||
                                    pathname.startsWith(`${child.href}/`));

                                if (child.disabled || !child.href) {
                                  return (
                                    <div
                                      key={child.label}
                                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
                                    >
                                      {ChildIcon && (
                                        <ChildIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                                      )}
                                      <span className="flex-1 truncate">{child.label}</span>
                                      {child.badge && (
                                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
                                          {child.badge}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-all ${
                                      isChildActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-normal"
                                    }`}
                                  >
                                    {isChildActive && (
                                      <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-3.5 bg-primary rounded-r-full" />
                                    )}

                                    {ChildIcon && (
                                      <ChildIcon
                                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                          isChildActive
                                            ? "text-primary"
                                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                        }`}
                                      />
                                    )}
                                    <span className="flex-1 truncate">{child.label}</span>
                                    {child.badge && (
                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                                        {child.badge}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Direct item handling
                    if (!href) return null;
                    const isActive =
                      href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-normal"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                        )}

                        <Icon
                          className={`h-[15px] w-[15px] shrink-0 transition-transform ${
                            isActive
                              ? "text-primary"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                          }`}
                        />
                        <span className="flex-1 truncate">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── Role Badge Footer ── */}
      <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl border ${roleInfo.bg}`}
        >
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 shadow-xs shrink-0">
            <RoleIcon className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Role
            </span>
            <span className="text-xs font-semibold truncate text-slate-900 dark:text-white">{roleInfo.label}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

