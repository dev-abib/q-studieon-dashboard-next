"use client";
import { useState, useMemo } from "react";
import {
  Mail,
  CreditCard,
  Trash2,
  X,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Cpu,
  Globe,
  BadgeCheck,
  FileBarChart2,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useUserDetails } from "@/features/admin/hooks/use-get-user-details";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Admin } from "@/features/admin/types/admin.types";
import { useDeleteUser } from "@/features/auth/hooks/user-delete-user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSendAdminMail } from "@/features/admin/hooks/use-send-admin-mail";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const cap = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

const AVATAR_PALETTES = [
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
];

function avatarPalette(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonLoader = () => (
  <div
    className="flex flex-col gap-5 pb-10 pt-6"
    style={{ fontFamily: "'DM Sans', sans-serif" }}
  >
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-28 animate-pulse rounded-full bg-stone-100" />
      <div className="h-8 w-52 animate-pulse rounded-lg bg-stone-100" />
    </div>
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-stone-100" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-stone-100" />
          <div className="h-3 w-36 animate-pulse rounded-full bg-stone-100" />
          <div className="h-3 w-64 animate-pulse rounded-full bg-stone-100" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm"
        >
          <div className="h-8 w-8 animate-pulse rounded-lg bg-stone-100" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-stone-100" />
          <div className="h-6 w-16 animate-pulse rounded-lg bg-stone-100" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="rounded-xl border border-stone-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-col gap-1.5">
            <div className="h-3 w-28 animate-pulse rounded-full bg-stone-100" />
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-stone-100" />
          </div>
          {[0, 1, 2, 3, 4].map(j => (
            <div
              key={j}
              className="flex justify-between border-b border-stone-100 py-2.5 last:border-0"
            >
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-stone-100" />
              <div className="h-2.5 w-32 animate-pulse rounded-full bg-stone-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-xl border border-stone-100 bg-white shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-4 border-b border-stone-100 px-5 py-4">
    <p
      className="text-base font-normal text-stone-700"
      style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
    >
      {title}
    </p>
    <p className="mt-0.5 text-[11px] font-normal tracking-wide text-stone-400">
      {subtitle}
    </p>
  </div>
);

const InfoRow = ({
  label,
  value,
  mono = false,
  valueColor,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
  icon?: React.ElementType;
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-2.5 last:border-0">
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-stone-400">
      {Icon && <Icon size={12} className="shrink-0 text-stone-300" />}
      {label}
    </span>
    <span
      className={`max-w-[58%] truncate text-right text-xs font-medium text-stone-700 ${mono ? "font-mono" : ""}`}
      style={valueColor ? { color: valueColor } : undefined}
    >
      {value}
    </span>
  </div>
);

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-amber-50 text-amber-800 border border-amber-200",
  mod: "bg-rose-50 text-rose-800 border border-rose-200",
  user: "bg-slate-50 text-slate-600 border border-slate-200",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-wide ${
        ROLE_STYLES[role] ?? ROLE_STYLES.user
      }`}
    >
      {role}
    </span>
  );
}

function StatusPill({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-medium tracking-wide ${
        positive
          ? "border border-teal-200 bg-teal-50 text-teal-700"
          : "border border-stone-200 bg-stone-50 text-stone-500"
      }`}
    >
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
          {label}
        </p>
        <p
          className="mt-0.5 text-2xl font-normal leading-none text-stone-800"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {value}
          {sub && (
            <span
              className="ml-1.5 text-xs font-normal text-amber-600"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {sub}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────────────

function BaseModal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-stone-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p
              className="text-base font-normal text-stone-800"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-stone-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function MessageModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: Admin;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const pal = avatarPalette(user.name ?? "");
  const initials = getInitials(user.name ?? "??");
  const { mutateAsync: sendMail, isPending } = useSendAdminMail();

  const handleSend = async () => {
    if (user.isGuest) {
      return toast.error("You can't send message to a guest");
      onClose();
    }
    if (!subject.trim() || !message.trim() || !user.email) return;

    try {
      await sendMail({
        email: user.email,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setSubject("");
        setMessage("");
        onClose();
      }, 1400);
    } catch (error: unknown) {
      toast.error("Failed to send mail");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Message User"
      subtitle={`Send a message to ${user.name}`}
    >
      {sent ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <CheckCircle2 className="h-12 w-12 text-teal-500" />
          <p
            className="text-lg font-normal text-teal-700"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Message sent successfully
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${pal.bg} ${pal.ring}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ring-1 ${pal.bg} ${pal.text} ${pal.ring}`}
            >
              {initials}
            </span>
            <div>
              <p className="text-sm font-medium text-stone-800">{user.name}</p>
              <p className="text-xs text-stone-400">{user.email}</p>
            </div>
          </div>

          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 placeholder:text-stone-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
          />

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Write your message…"
            className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 placeholder:text-stone-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50"
            >
              Cancel
            </Button>
            <Button
              disabled={!subject.trim() || !message.trim() || !!user.isGuest}
              onClick={handleSend}
            >
              <Mail className="mr-1.5 h-3 w-3" />
              Send message
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

function SubscriptionModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: Admin;
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Subscription Details"
      subtitle="Billing and plan information"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-teal-500">
              Status
            </p>
            <p
              className="text-2xl font-normal text-teal-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {user.isPaid ? "Paid" : "Free"}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-amber-500">
              Cycle
            </p>
            <p
              className="text-2xl font-normal text-amber-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {cap(user.billingCycle)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-100">
          <InfoRow
            label="Stripe Customer ID"
            value={user.stripeCustomerId ?? "—"}
            mono
            icon={CreditCard}
          />
          <InfoRow
            label="Subscription ID"
            value={user.stripeSubscriptionId ?? "—"}
            mono
            icon={RefreshCw}
          />
          <InfoRow
            label="Period End"
            value={
              user.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : "—"
            }
            icon={Calendar}
          />
        </div>
      </div>
    </BaseModal>
  );
}

function ActivityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Activity Reports"
      subtitle="Usage and event history"
    >
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-stone-400">
        <FileBarChart2 className="h-8 w-8 text-stone-200" />
        <p className="text-sm">Activity reports coming soon</p>
      </div>
    </BaseModal>
  );
}

function DeleteModal({
  user,
  open,
  onConfirm,
  onClose,
  isLoading,
}: {
  user: Admin;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
          <Trash2 className="h-5 w-5 text-rose-500" />
        </div>
        <h3
          className="mt-4 text-lg font-normal text-stone-800"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Remove <em className="italic text-rose-500">{user.name}</em>?
        </h3>
        <p className="mt-1.5 text-sm text-stone-400">
          This will permanently revoke all access for{" "}
          <span className="font-medium text-stone-600">{user.email}</span>. This
          action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-8 rounded-lg bg-rose-500 text-xs text-white shadow-none hover:bg-rose-600 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3 w-3" />
            )}
            Remove user
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const Page = () => {
  const { id } = useParams();
  const { data: userResponse, isLoading, error } = useUserDetails(id as string);
  const user = useMemo(() => userResponse?.data || null, [userResponse]);

  const [modal, setModal] = useState<string | null>(null);
  const openModal = (name: string) => setModal(name);
  const closeModal = () => setModal(null);

  const { mutateAsync: deleteUser, isPending } = useDeleteUser();
  const router = useRouter();

  async function handleDeleteConfirm() {
    if (!user) return;
    try {
      await deleteUser(user.id);
      closeModal();
      router.replace("/dashboard/users");
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoading) return <SkeletonLoader />;

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p
            className="text-xl font-normal text-rose-500"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Failed to load user data
          </p>
          <p className="mt-1 text-sm text-stone-400">Please try again later</p>
        </div>
      </div>
    );
  }

  const pal = avatarPalette(user.name ?? "");
  const initials = getInitials(user.name ?? "??");

  const statCards = [
    {
      icon: CheckCircle2,
      label: "Account status",
      value: cap(user.status),
      accent: "bg-teal-50 text-teal-600",
    },
    {
      icon: RefreshCw,
      label: "Billing cycle",
      value: cap(user.billingCycle),
      accent: "bg-amber-50 text-amber-600",
    },
    {
      icon: BadgeCheck,
      label: "Subscription",
      value: user.isPaid ? "Paid" : "Free",
      sub: user.isPaid ? "active" : undefined,
      accent: "bg-violet-50 text-violet-600",
    },
    {
      icon: ShieldCheck,
      label: "Role",
      value: cap(user.role),
      accent: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div
      className="flex flex-col gap-5 pb-10 pt-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Heading ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Platform Console
          </p>
          <h1
            className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            User <em className="italic text-amber-600">Details</em>
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      {/* ── Profile card ── */}
      <Card>
        <div className="flex items-center gap-4 p-5">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-medium ring-1 overflow-hidden ${pal.bg} ${pal.text} ${pal.ring}`}
          >
            {user.profilePictureURL ? (
              <Image
                src={user.profilePictureURL}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-xl font-normal text-stone-800"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {user.name}
              </h2>
              <RoleBadge role={user.role} />
              {user.isOtpVerified && (
                <StatusPill label="OTP Verified" positive />
              )}
              {user.isResetRequest && (
                <StatusPill label="Reset Pending" positive={false} />
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-stone-400">
              <Mail className="h-3 w-3 text-stone-300" />
              {user.email}
            </p>
            <p className="font-mono text-[10px] text-stone-300">{user.id}</p>
          </div>
        </div>
      </Card>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── Info 2×2 grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <SectionHeader title="Account Info" subtitle="Core identity fields" />
          <InfoRow label="Name" value={user.name} icon={User} />
          <InfoRow label="Email" value={user.email} icon={Mail} />
          <InfoRow
            label="Auth Provider"
            value={cap(user.authProvider)}
            icon={Cpu}
          />
          <InfoRow
            label="OTP Verified"
            value={user.isOtpVerified ? "Yes" : "No"}
            valueColor={user.isOtpVerified ? "#0d9488" : "#ef4444"}
            icon={ShieldCheck}
          />
          <InfoRow
            label="Terms Accepted"
            value={user.termsAndConditions ? "Yes" : "No"}
            valueColor={user.termsAndConditions ? "#0d9488" : "#ef4444"}
            icon={BadgeCheck}
          />
        </Card>

        <Card>
          <SectionHeader title="Subscription" subtitle="Billing & plan" />
          <InfoRow
            label="Is Paid"
            value={user.isPaid ? "Yes" : "No"}
            valueColor={user.isPaid ? "#0d9488" : "#78716c"}
            icon={CreditCard}
          />
          <InfoRow
            label="Billing Cycle"
            value={cap(user.billingCycle)}
            icon={RefreshCw}
          />
          <InfoRow
            label="Period End"
            value={
              user.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : "—"
            }
            icon={Calendar}
          />
          <InfoRow
            label="Stripe Customer ID"
            value={user.stripeCustomerId ?? "—"}
            mono
            icon={CreditCard}
          />
          <InfoRow
            label="Subscription ID"
            value={user.stripeSubscriptionId ?? "—"}
            mono
            icon={RefreshCw}
          />
        </Card>

        <Card>
          <SectionHeader title="Guest Info" subtitle="Temporary session data" />
          <InfoRow
            label="Is Guest"
            value={user.isGuest ? "Yes" : "No"}
            icon={User}
          />
          <InfoRow
            label="Guest Expires"
            value={user.guestExpiresAt ? formatDate(user.guestExpiresAt) : "—"}
            icon={Clock}
          />
          <InfoRow
            label="Guest IP"
            value={user.guestIp ?? "—"}
            mono
            icon={Globe}
          />
          <InfoRow
            label="Device ID"
            value={user.guestDeviceId ?? "—"}
            mono
            icon={Cpu}
          />
        </Card>

        <Card>
          <SectionHeader title="Timestamps" subtitle="Activity timeline" />
          <InfoRow
            label="Created At"
            value={formatDate(user.createdAt)}
            icon={Calendar}
          />
          <InfoRow
            label="Updated At"
            value={formatDate(user.updatedAt)}
            icon={Clock}
          />
          <InfoRow
            label="Blocked Until"
            value={
              user.blockedUntil ? formatDate(user.blockedUntil) : "Not blocked"
            }
            valueColor={user.blockedUntil ? "#ef4444" : "#0d9488"}
            icon={ShieldCheck}
          />
        </Card>
      </div>

      {/* ── Actions ── */}
      <Card>
        <SectionHeader title="Actions" subtitle="Manage this account" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-2">
          <button
            onClick={() => openModal("message")}
            className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-left text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Mail className="h-4 w-4" />
            </span>
            Message User
          </button>

          <button
            onClick={() => openModal("subscription")}
            className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3.5 text-left text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <CreditCard className="h-4 w-4" />
            </span>
            View Subscription
          </button>

          <button
            onClick={() => openModal("activity")}
            className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3.5 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <FileBarChart2 className="h-4 w-4" />
            </span>
            Activity Reports
          </button>

          <button
            onClick={() => openModal("delete")}
            className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500">
              <Trash2 className="h-4 w-4" />
            </span>
            Delete User
          </button>
        </div>
      </Card>

      {/* ── Modals ── */}
      <MessageModal
        open={modal === "message"}
        onClose={closeModal}
        user={user}
      />
      <SubscriptionModal
        open={modal === "subscription"}
        onClose={closeModal}
        user={user}
      />
      <ActivityModal open={modal === "activity"} onClose={closeModal} />
      <DeleteModal
        user={user}
        open={modal === "delete"}
        onConfirm={handleDeleteConfirm}
        onClose={closeModal}
        isLoading={isPending}
      />
    </div>
  );
};

export default Page;
