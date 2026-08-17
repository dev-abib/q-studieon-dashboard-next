"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Headphones,
  ShieldAlert,
  FileText,
  DollarSign,
  Search,
  LayoutDashboard,
  Users,
  BookMarked,
  MessageCircleQuestion,
  Lightbulb,
  BookDashed,
  Sparkles,
  Globe,
  LayoutTemplate,
  Newspaper,
  Image as ImageIcon,
  MessageSquareQuote,
  MailQuestion,
  UserCheck,
  Briefcase,
  Activity,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Admin } from "@/features/admin/types/admin.types";
import { useLogOut } from "@/features/auth/hooks/use-logout";
import { CommandPalette } from "@/components/layout/dashboard/CommandPalette";
import { useSidebarStore } from "@/stores/use-sidebar-store";

import { ThemeAccentPicker } from "@/components/layout/dashboard/ThemeAccentPicker";
import { GlobalNotificationsPanel } from "@/components/layout/dashboard/GlobalNotificationsPanel";

type HeaderProps = {
  admin: Admin;
};

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Overview",
  users: "Users Management",
  admins: "Admins Center",
  queries: "User Inquiries",
  settings: "Settings",
  status: "System Status",
  activity: "Team Activity Feed",
  categories: "Onsite Categories",
  questions: "Onsite Questions",
  insights: "Helpful Insights",
  faqs: "FAQs",
  "dynamic-page": "Dynamic Pages",
  website: "Website CMS",
  pages: "Pages & Sections",
  blogs: "Blogs & Articles",
  banners: "Hero & Banners",
  testimonials: "Testimonials",
};

const PAGE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  users: Users,
  admins: ShieldCheck,
  queries: MailQuestion,
  settings: Settings,
  status: Activity,
  activity: Activity,
  categories: BookMarked,
  questions: MessageCircleQuestion,
  insights: Lightbulb,
  faqs: HelpCircle,
  "dynamic-page": BookDashed,
  website: Globe,
  pages: LayoutTemplate,
  blogs: Newspaper,
  banners: ImageIcon,
  testimonials: MessageSquareQuote,
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl K";

// Crisp Avatar with error fallback handling
function HeaderAvatar({
  src,
  initials,
  sizeClass = "h-8 w-8",
  textSizeClass = "text-xs",
}: {
  src?: string | null;
  initials: string;
  sizeClass?: string;
  textSizeClass?: string;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30 shadow-xs bg-slate-100 dark:bg-slate-800`}>
      {src && !imgErr ? (
        <img
          src={src}
          alt="Avatar"
          onError={() => setImgErr(true)}
          className="h-full w-full object-cover object-center transition-transform duration-200 hover:scale-105"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold ${textSizeClass}`}>
          {initials}
        </div>
      )}
    </div>
  );
}

export function Header({ admin }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: logOutMutation, isPending } = useLogOut();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogOut = () => {
    logOutMutation();
  };

  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .filter(segment => segment !== "dashboard");

  const parentSegments = pathSegments.slice(0, -1);
  const currentSegment = pathSegments[pathSegments.length - 1] || "dashboard";

  const resolvedSegment =
    BREADCRUMB_MAP[currentSegment] ||
    parentSegments[parentSegments.length - 1] ||
    "dashboard";

  const pageTitle = BREADCRUMB_MAP[resolvedSegment] || currentSegment;
  const PageIcon = PAGE_ICONS[resolvedSegment] || LayoutDashboard;

  const initials = (admin.name ?? "A")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getRoleBadge = (role: string) => {
    switch (role) {
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
          bg: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20",
        };
      case "content_manager":
        return {
          label: "Content Manager",
          icon: FileText,
          bg: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          bg: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
        };
      default:
        return {
          label: "Administrator",
          icon: ShieldCheck,
          bg: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20",
        };
    }
  };

  const roleBadge = getRoleBadge(admin.role);
  const RoleBadgeIcon = roleBadge.icon;

  const toggleSidebar = useSidebarStore((s) => s.toggle);

  return (
    <header className="h-14 sm:h-16 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-4 sm:mb-6 flex items-center justify-between px-3 sm:px-5 lg:px-6 transition-all gap-2 sm:gap-3">
      {/* ── Mobile Hamburger & Page Title / Breadcrumb ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger Menu Toggle (Mobile / Tablet) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <PageIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <nav className="hidden sm:flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors truncate max-w-[80px]"
            >
              Dashboard
            </Link>
            {parentSegments.map((segment, index) => {
              const href = `/dashboard/${pathSegments
                .slice(0, index + 1)
                .join("/")}`;
              return (
                <div key={href} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />
                  <Link
                    href={href}
                    className="hover:text-primary transition-colors truncate max-w-[90px]"
                  >
                    {BREADCRUMB_MAP[segment] || segment}
                  </Link>
                </div>
              );
            })}
          </nav>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate leading-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* ── Center Quick Search Pill (Desktop) ── */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden md:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-400 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium">Quick search...</span>
        <kbd className="ml-2 font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 font-semibold shadow-2xs">
          {SHORTCUT_LABEL}
        </kbd>
      </button>

      <CommandPalette
        admin={admin}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      {/* ── Right User Menu & Theme Picker ── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile Quick Search Icon Button */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Quick search"
        >
          <Search className="h-4 w-4" />
        </button>

        <GlobalNotificationsPanel />
        <ThemeAccentPicker />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 sm:h-11 px-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all focus-visible:ring-0 cursor-pointer"
            >
              <div className="relative flex items-center">
                <HeaderAvatar
                  src={admin.profilePictureURL}
                  initials={initials}
                  sizeClass="h-8.5 w-8.5"
                  textSizeClass="text-xs font-bold"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                  {admin.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {admin.role.replace("_", " ")}
                </span>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 backdrop-blur-xl animate-in fade-in-80 zoom-in-95 duration-150"
          >
            {/* User Details Header Card */}
            <div className="px-3.5 py-3 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl mb-1 border border-slate-100 dark:border-slate-800">
              <HeaderAvatar
                src={admin.profilePictureURL}
                initials={initials}
                sizeClass="h-10 w-10"
                textSizeClass="text-sm font-bold"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {admin.name}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {admin.email}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.bg}`}>
                    <RoleBadgeIcon className="h-3 w-3" />
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            {/* Menu Items */}
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/admins/me")}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Briefcase className="h-4 w-4 text-primary" />
              My Duties & Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings & Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/faqs")}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              Help & Support
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogOut}
              disabled={isPending}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              {isPending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
