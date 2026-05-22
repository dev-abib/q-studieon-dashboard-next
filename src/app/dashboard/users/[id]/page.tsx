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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useUserDetails } from "@/features/admin/hooks/use-get-user-details";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Admin } from "@/features/admin/types/admin.types";

interface UserData {
  id: string;
  name: string;
  email: string;
  profilePictureURL: string | null;
  isPaid: boolean;
  isGuest: boolean | null;
  isOtpVerified: boolean;
  guestExpiresAt: string | null;
  authProvider: string;
  billingCycle: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  termsAndConditions: boolean;
  blockedUntil: string | null;
  guestIp: string | null;
  guestDeviceId: string | null;
  isResetRequest: boolean;
}

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

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — matches dashboard shimmer style
// ─────────────────────────────────────────────────────────────────────────────

const ShimmerStyle = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .sk {
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .dark .sk {
      background: linear-gradient(90deg, #1e293b 25%, #273348 50%, #1e293b 75%);
      background-size: 600px 100%;
    }
  `}</style>
);

const Sk = ({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <div className={`sk ${className}`} style={style} />;

const SkeletonLoader = () => {
  const statBgs = ["#ECFDF5", "#FFFBEB", "#F0EFFE", "#EFF6FF"];
  return (
    <section className="w-full flex flex-col gap-6 min-h-screen">
      <ShimmerStyle />

      {/* heading */}
      <div className="flex flex-col gap-2">
        <Sk className="h-7 w-40 rounded-lg" />
        <Sk className="h-4 w-52 rounded-full" />
      </div>

      {/* profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Sk className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5">
            <Sk className="h-7 w-56 rounded-lg" />
            <Sk className="h-4 w-44 rounded-full" />
            <Sk className="h-3 w-72 rounded-full" />
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statBgs.map((bg, i) => (
          <div
            key={i}
            className="rounded-2xl shadow-sm p-5 flex flex-col gap-3"
            style={{ background: bg }}
          >
            <div className="flex justify-between items-center">
              <Sk className="h-3 w-24 rounded-full" />
              <Sk className="h-5 w-5 rounded-full" />
            </div>
            <Sk className="h-9 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* info cards 2×2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <div className="flex flex-col gap-1.5 mb-4">
              <Sk className="h-3.5 w-32 rounded-full" />
              <Sk className="h-3 w-44 rounded-full" />
            </div>
            {[0, 1, 2, 3, 4].map(j => (
              <div
                key={j}
                className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <Sk className="h-3 w-28 rounded-full" />
                <Sk className="h-3 w-32 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* actions card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <div className="flex flex-col gap-1.5 mb-4">
          <Sk className="h-3.5 w-24 rounded-full" />
          <Sk className="h-3 w-40 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <Sk key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-4">
    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
      {title}
    </p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
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
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-4">
    <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 shrink-0">
      {Icon && <Icon size={12} className="shrink-0" />}
      {label}
    </span>
    <span
      className={`text-xs font-medium text-right truncate max-w-[58%] ${mono ? "font-mono" : ""}`}
      style={{ color: valueColor }}
    >
      {value}
    </span>
  </div>
);

const Badge = ({
  label,
  accent,
  lightBg,
}: {
  label: string;
  accent: string;
  lightBg: string;
}) => (
  <span
    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
    style={{ background: lightBg, color: accent }}
  >
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Modal primitives
// ─────────────────────────────────────────────────────────────────────────────

const Modal = ({
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
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Action modals
// ─────────────────────────────────────────────────────────────────────────────

const MessageModal = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserData;
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject("");
      setMessage("");
      onClose();
    }, 1400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Message User"
      subtitle={`To ${user.name}`}
    >
      {sent ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <CheckCircle2 size={52} className="text-emerald-500" />
          <p className="text-lg font-semibold text-emerald-600">
            Message Sent Successfully
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: "#F0EFFE" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: "#6C63FF20", color: "#6C63FF" }}
            >
              {getInitials(user.name)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#6C63FF] outline-none text-sm"
          />

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#6C63FF] outline-none resize-none text-sm"
          />

          <button
            onClick={handleSend}
            disabled={!subject.trim() || !message.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#6C63FF" }}
          >
            <Mail size={16} /> Send Message
          </button>
        </div>
      )}
    </Modal>
  );
};

const SubscriptionModal = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserData;
}) => (
  <Modal open={open} onClose={onClose} title="Subscription Details">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl" style={{ background: "#ECFDF5" }}>
          <p className="text-xs" style={{ color: "#10B981" }}>
            Status
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#10B981" }}>
            {user.isPaid ? "Paid" : "Free"}
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#FFFBEB" }}>
          <p className="text-xs" style={{ color: "#F59E0B" }}>
            Cycle
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#F59E0B" }}>
            {cap(user.billingCycle)}
          </p>
        </div>
      </div>

      <div className="border p-3 border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
        <InfoRow
          label="Stripe Customer ID"
          value={user.stripeCustomerId}
          mono
          icon={CreditCard}
        />
        <InfoRow
          label="Subscription ID"
          value={user.stripeSubscriptionId}
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
  </Modal>
);

const ActivityModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <Modal open={open} onClose={onClose} title="Activity Reports">
    <div className="text-center py-12 text-gray-400 text-sm">
      Activity reports coming soon
    </div>
  </Modal>
);

function DeleteModal({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: Admin;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
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
            onClick={onCancel}
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

  if (isLoading) return <SkeletonLoader />;

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl font-semibold">
            Failed to load user data
          </p>
          <p className="text-gray-400 text-sm mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  const topStats = [
    {
      label: "Account status",
      value: cap(user.status),
      accent: "#10B981",
      lightBg: "#ECFDF5",
      icon: CheckCircle2,
    },
    {
      label: "Billing cycle",
      value: cap(user.billingCycle),
      accent: "#F59E0B",
      lightBg: "#FFFBEB",
      icon: RefreshCw,
    },
    {
      label: "Subscription",
      value: user.isPaid ? "Paid" : "Free",
      accent: "#6C63FF",
      lightBg: "#F0EFFE",
      icon: BadgeCheck,
    },
    {
      label: "Role",
      value: cap(user.role),
      accent: "#3B82F6",
      lightBg: "#EFF6FF",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6 min-h-screen pb-10">
      {/* ── heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          User Details
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Profile and account information
        </p>
      </div>

      {/* ── profile card ── */}
      <Card>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden"
            style={{ background: "#F0EFFE", color: "#6C63FF" }}
          >
            {user.profilePictureURL ? (
              <img
                src={user.profilePictureURL}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user.name}
              </h2>
              {user.isOtpVerified && (
                <Badge
                  label="OTP Verified"
                  accent="#10B981"
                  lightBg="#ECFDF5"
                />
              )}
              {user.isResetRequest && (
                <Badge
                  label="Reset Pending"
                  accent="#F59E0B"
                  lightBg="#FFFBEB"
                />
              )}
            </div>
            <p className="text-gray-500 mt-1 text-sm">{user.email}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{user.id}</p>
          </div>
        </div>
      </Card>

      {/* ── top stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topStats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl shadow-md p-5 flex flex-col gap-2"
            style={{ background: stat.lightBg }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <stat.icon size={18} style={{ color: stat.accent }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: stat.accent }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── info 2×2 grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Account Info" subtitle="Core identity fields" />
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
            valueColor={user.isOtpVerified ? "#10B981" : "#EF4444"}
            icon={ShieldCheck}
          />
          <InfoRow
            label="Terms Accepted"
            value={user.termsAndConditions ? "Yes" : "No"}
            valueColor={user.termsAndConditions ? "#10B981" : "#EF4444"}
            icon={BadgeCheck}
          />
        </Card>

        <Card>
          <CardHeader title="Subscription" subtitle="Billing & Plan" />
          <InfoRow
            label="Is Paid"
            value={user.isPaid ? "Yes" : "No"}
            valueColor={user.isPaid ? "#10B981" : "#6B7280"}
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
            value={user.stripeCustomerId}
            mono
            icon={CreditCard}
          />
          <InfoRow
            label="Subscription ID"
            value={user.stripeSubscriptionId}
            mono
            icon={RefreshCw}
          />
        </Card>

        <Card>
          <CardHeader title="Guest Info" subtitle="Temporary session data" />
          <InfoRow
            label="Is Guest"
            value={user.isGuest === null ? "No" : user.isGuest ? "Yes" : "No"}
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
          <CardHeader title="Timestamps" subtitle="Activity timeline" />
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
            valueColor={user.blockedUntil ? "#EF4444" : "#10B981"}
            icon={ShieldCheck}
          />
        </Card>
      </div>

      {/* ── actions ── */}
      <Card>
        <CardHeader title="Actions" subtitle="Manage this account" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => openModal("message")}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left text-sm font-medium"
            style={{ background: "#F0EFFE", color: "#6C63FF" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e5e0fd")}
            onMouseLeave={e => (e.currentTarget.style.background = "#F0EFFE")}
          >
            <Mail size={18} /> Message User
          </button>
          <button
            onClick={() => openModal("subscription")}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left text-sm font-medium"
            style={{ background: "#ECFDF5", color: "#10B981" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d1fae5")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ECFDF5")}
          >
            <CreditCard size={18} /> View Subscription
          </button>
          <button
            onClick={() => openModal("activity")}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left text-sm font-medium"
            style={{ background: "#FFFBEB", color: "#F59E0B" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fef3c7")}
            onMouseLeave={e => (e.currentTarget.style.background = "#FFFBEB")}
          >
            <FileBarChart2 size={18} /> Activity Reports
          </button>
          <button
            onClick={() => openModal("delete")}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left text-sm font-medium"
            style={{ background: "#FEF2F2", color: "#EF4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={e => (e.currentTarget.style.background = "#FEF2F2")}
          >
            <Trash2 size={18} /> Delete User
          </button>
        </div>
      </Card>

      {/* ── modals ── */}
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
        open={modal === "subscription"}
        onClose={closeModal}
        user={user}
      />
    </section>
  );
};

export default Page;
