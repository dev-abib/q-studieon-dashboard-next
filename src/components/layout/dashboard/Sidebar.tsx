"use client";

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
  Sparkles,
  ShieldAlert,
  Headphones,
  FileText,
  DollarSign,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Role =
  | "super_admin"
  | "admin"
  | "customer_support"
  | "content_manager"
  | "finance"
  | "user";

interface SidebarProps {
  role: Role | string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredRoles?: Role[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = (role as Role) || "admin";

  const sections: NavSection[] = [
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
      ],
    },
    {
      title: "Content & Support",
      items: [
        {
          label: "Onsite Categories",
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
          label: "Onsite Questions",
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
      title: "System",
      items: [
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  const getRoleBadge = (userRole: string | null) => {
    switch (userRole) {
      case "super_admin":
        return {
          label: "Super Admin",
          icon: ShieldAlert,
          bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
        };
      case "customer_support":
        return {
          label: "Support Member",
          icon: Headphones,
          bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
        };
      case "content_manager":
        return {
          label: "Content Manager",
          icon: FileText,
          bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          label: "Administrator",
          icon: ShieldCheck,
          bg: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20",
        };
    }
  };

  const roleInfo = getRoleBadge(role);
  const RoleIcon = roleInfo.icon;

  return (
    <aside className="w-64 rounded-2xl h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between transition-colors">
      {/* ── Brand Logo ── */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100/80 dark:border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              {process.env.NEXT_PUBLIC_SITE_NAME || "Dwellr"}
            </h1>
            <span className="text-[11px] font-medium text-slate-400 mt-1">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation Items ── */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="flex flex-col gap-6">
          {sections.map(section => {
            const filteredItems = section.items.filter(
              item =>
                !item.requiredRoles ||
                item.requiredRoles.includes(currentRole),
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="flex flex-col gap-1.5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
                <nav className="flex flex-col gap-1">
                  {filteredItems.map(({ label, href, icon: Icon, badge }) => {
                    const isActive =
                      href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(href);

                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {/* Left Active Indicator Bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full shadow-sm shadow-amber-500" />
                        )}

                        <Icon
                          className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                            isActive
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                          }`}
                        />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border ${roleInfo.bg}`}
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm shrink-0">
            <RoleIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
              Logged in as
            </span>
            <span className="text-xs font-bold truncate">{roleInfo.label}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
