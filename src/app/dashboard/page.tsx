"use client";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboardAnalytics } from "@/features/admin/hooks/user-dashboard-analytics";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton helpers
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

const SkCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
    {children}
  </div>
);

const StatCardSkeleton = ({ lightBg }: { lightBg: string }) => (
  <div
    className="rounded-2xl shadow-md p-5 flex flex-col gap-3"
    style={{ background: lightBg }}
  >
    <div className="flex items-center justify-between">
      <Sk className="h-3 w-24 rounded-full" />
      <Sk className="h-6 w-6 rounded-full" />
    </div>
    <Sk className="h-9 w-20 rounded-lg" />
    <Sk className="h-3 w-28 rounded-full" />
  </div>
);

const ChartCardSkeleton = ({
  chartHeight = 200,
  children,
}: {
  chartHeight?: number;
  children?: React.ReactNode;
}) => (
  <SkCard>
    <div className="mb-4 flex flex-col gap-1.5">
      <Sk className="h-3.5 w-36 rounded-full" />
      <Sk className="h-3 w-48 rounded-full" />
    </div>
    {children ?? (
      <div
        className="w-full flex items-end gap-2 px-1"
        style={{ height: chartHeight }}
      >
        {[65, 80, 55, 90, 70, 85, 60, 95, 75, 88, 50, 78].map((h, i) => (
          <Sk
            key={i}
            className="flex-1 rounded-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    )}
  </SkCard>
);

const PieChartSkeleton = () => (
  <SkCard>
    <div className="mb-4 flex flex-col gap-1.5">
      <Sk className="h-3.5 w-40 rounded-full" />
      <Sk className="h-3 w-52 rounded-full" />
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex justify-center items-center" style={{ height: 160 }}>
        <div className="relative w-[160px] h-[160px]">
          <Sk className="w-full h-full rounded-full" />
          <div
            className="absolute rounded-full bg-white dark:bg-slate-900"
            style={{
              width: 90,
              height: 90,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sk className="w-3 h-3 rounded-full" />
              <Sk className="h-3 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Sk className="h-3 w-10 rounded-full" />
              <Sk className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </SkCard>
);

const RevenueBreakdownSkeleton = () => (
  <SkCard>
    <div className="flex flex-col gap-1 mb-5">
      <Sk className="h-3.5 w-40 rounded-full" />
      <Sk className="h-3 w-60 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="rounded-xl p-4 shadow-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-2"
        >
          <Sk className="h-3 w-24 rounded-full" />
          <Sk className="h-8 w-32 rounded-lg" />
          <Sk className="h-3 w-20 rounded-full" />
        </div>
      ))}
    </div>
    <div className="w-full flex items-end gap-3 px-1" style={{ height: 260 }}>
      {[70, 55, 85, 60, 90, 75, 80, 65, 95, 50, 88, 72].map((h, i) => (
        <Sk key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  </SkCard>
);

const DashboardSkeleton = () => {
  const statBgs = ["#F0EFFE", "#ECFDF5", "#FFFBEB", "#EFF6FF", "#F5F3FF"];
  return (
    <section className="w-full flex flex-col gap-6 min-h-screen">
      <ShimmerStyle />

      {/* heading */}
      <div className="flex flex-col gap-2">
        <Sk className="h-7 w-36 rounded-lg" />
        <Sk className="h-4 w-48 rounded-full" />
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statBgs.map((bg, i) => (
          <StatCardSkeleton key={i} lightBg={bg} />
        ))}
      </div>

      {/* 2×2 chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCardSkeleton chartHeight={200} />

        <ChartCardSkeleton chartHeight={200}>
          <div
            className="w-full flex items-end gap-0 px-1"
            style={{ height: 200 }}
          >
            {[55, 65, 60, 75, 85, 60, 55, 90, 95, 80, 100, 105, 110, 115].map(
              (h, i) => (
                <Sk
                  key={i}
                  className="flex-1"
                  style={{ height: `${h * 0.8}%`, borderRadius: "4px 4px 0 0" }}
                />
              ),
            )}
          </div>
        </ChartCardSkeleton>

        <ChartCardSkeleton chartHeight={200} />
        <PieChartSkeleton />
      </div>

      {/* users by role */}
      <SkCard>
        <div className="mb-4 flex flex-col gap-1.5">
          <Sk className="h-3.5 w-32 rounded-full" />
          <Sk className="h-3 w-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-xl p-4 shadow-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-2"
            >
              <Sk className="h-3 w-20 rounded-full" />
              <Sk className="h-8 w-12 rounded-lg" />
              <Sk className="h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="w-full flex flex-col gap-3 px-1" style={{ height: 300 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Sk
              key={i}
              className="h-6 rounded-md"
              style={{ width: `${85 - i * 9}%` }}
            />
          ))}
        </div>

        <div className="mt-8 mb-4 flex flex-col gap-1.5">
          <Sk className="h-3.5 w-28 rounded-full" />
          <Sk className="h-3 w-44 rounded-full" />
        </div>
        <div
          className="w-full flex items-end gap-2 px-1"
          style={{ height: 220 }}
        >
          {[60, 80, 55, 75, 90, 65].map((h, i) => (
            <Sk
              key={i}
              className="flex-1 rounded-md"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </SkCard>

      {/* revenue breakdown */}
      <RevenueBreakdownSkeleton />
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart configs
// ─────────────────────────────────────────────────────────────────────────────

const revenueConfig = {
  monthly: { label: "Monthly", color: "#f59e0b" },
  yearly: { label: "Yearly", color: "#64748b" },
};

const userConfig = {
  registered: { label: "Registered", color: "var(--primary)" },
  guests: { label: "Guests", color: "#64748b" },
};

const reportsConfig = {
  count: { label: "Reports", color: "var(--primary)" },
};

const monthlyRevenueConfig = {
  revenue: { label: "Revenue", color: "var(--primary)" },
};

const roleUsersConfig = {
  count: { label: "Users", color: "var(--primary)" },
};

const USER_ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer",
  seller: "Seller",
  renter: "Renter",
  real_estate_agent: "Real Estate Agent",
  brokerage: "Brokerage",
  practitioner: "Practitioner",
  home_explorer: "Home Explorer",
  homeowner: "Homeowner",
  investor: "Investor",
  interior_designer: "Interior Designer",
  architect: "Architect",
};

const ROLE_TREND_COLORS = [
  "#3B82F6", // Blue - Buyer
  "#10B981", // Emerald - Seller
  "#8B5CF6", // Violet - Renter
  "#F59E0B", // Amber - Real Estate Agent
  "#EC4899", // Pink - Brokerage
  "#06B6D4", // Cyan - Practitioner
  "#F97316", // Orange - Home Explorer
  "#6366F1", // Indigo - Homeowner
  "#14B8A6", // Teal - Investor
  "#A855F7", // Purple - Interior Designer
  "#64748B", // Slate - Architect
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 ${className}`}
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
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
      {title}
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
      {subtitle}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const Page = () => {
  const { data, isLoading } = useDashboardAnalytics();
  const { data: userData } = useCurrentUser();
  const isSuperAdmin =
    userData?.data?.role === "super_admin" ||
    userData?.data?.role === "finance";

  if (isLoading) return <DashboardSkeleton />;

  const getGrowthData = (growth: number = 0, suffix: string) => ({
    change: `${
      growth > 0 ? "↑" : growth < 0 ? "↓" : "→"
    } ${Math.abs(growth)}% ${suffix}`,
    positive: growth > 0 ? true : growth < 0 ? false : null,
  });

  const stats_data = data?.data?.cards;
  const reportsLast14Days =
    data?.data?.charts?.reportsChart?.reduce(
      (sum: number, item: { count?: number }) => sum + (item.count ?? 0),
      0,
    ) ?? 0;
  const topStats = [
    {
      label: "Total users",
      value: stats_data?.totalUsers?.count,
      ...getGrowthData(stats_data?.totalUsers?.growth, "this month"),
      accent: "#6C63FF",
      lightBg: "#F0EFFE",
      icon: "👥",
    },
    {
      label: "Active subscriptions",
      value: stats_data?.activeSubscriptions?.count,
      ...getGrowthData(stats_data?.activeSubscriptions?.growth, "this month"),
      accent: "#10B981",
      lightBg: "#ECFDF5",
      icon: "⭐",
    },
    {
      label: "Guest users",
      value: stats_data?.guestUsers?.count,
      change: `${stats_data?.guestUsers?.percentOfTotal}% of total`,
      positive: null,
      accent: "#F59E0B",
      lightBg: "#FFFBEB",
      icon: "👤",
    },
    {
      label: "Reports today",
      value: stats_data?.reportsToday?.count,
      ...getGrowthData(stats_data?.reportsToday?.growth, "vs yesterday"),
      accent: "#3B82F6",
      lightBg: "#EFF6FF",
      icon: "📄",
    },
    {
      label: "Reports (14 days)",
      value: reportsLast14Days,
      change: "last two weeks",
      positive: null,
      accent: "#8B5CF6",
      lightBg: "#F5F3FF",
      icon: "📊",
    },
  ];

  const plans = [
    {
      label: "Monthly",
      count: data?.data?.subscriptionPlans?.monthly?.count,
      pct: data?.data?.subscriptionPlans?.monthly?.percent,
      color: "var(--primary)",
    },
    {
      label: "Yearly",
      count: data?.data?.subscriptionPlans?.yearly?.count,
      pct: data?.data?.subscriptionPlans?.yearly?.percent,
      color: "#6366f1",
    },
  ];

  const roleDistribution: {
    role: string;
    count: number;
    percent: number;
  }[] = data?.data?.userRoles?.distribution ?? [];
  const roleData = roleDistribution.map(item => ({
    ...item,
    label: USER_ROLE_LABELS[item.role] ?? item.role,
  }));

  // ── Monthly trend — Include ALL 11 User Roles ──
  const rawTrendData: Record<string, number | string>[] =
    data?.data?.charts?.userRoleTrendChart ?? [];
  const allRoleKeys = Object.keys(USER_ROLE_LABELS);
  const rawTrendSeries = rawTrendData.length
    ? (Object.keys(rawTrendData[0]) as string[]).filter(k => k !== "month")
    : allRoleKeys;

  // Include ALL 11 roles directly
  const roleTrendSeries = rawTrendSeries.length > 0 ? rawTrendSeries : allRoleKeys;

  const roleTrendData = rawTrendData.map(m => {
    const point: Record<string, number | string> = { month: m.month };
    for (const role of roleTrendSeries) {
      point[role] = Number(m[role]) || 0;
    }
    return point;
  });

  const roleTrendConfig = Object.fromEntries(
    roleTrendSeries.map((role, i) => [
      role,
      {
        label: USER_ROLE_LABELS[role] ?? role,
        color: ROLE_TREND_COLORS[i % ROLE_TREND_COLORS.length],
      },
    ]),
  );

  const demoStats = [
    {
      label: "Total revenue",
      value: `${data?.data?.revenueBreakdown?.totalRevenue} usd`,
      sub: null,
      accent: "#6C63FF",
    },
    {
      label: "Monthly billing",
      value: `${data?.data?.revenueBreakdown?.monthlyBilling} usd`,
      sub: `${data?.data?.revenueBreakdown?.monthlyPercent} % of total`,
      accent: "#6C63FF",
    },
    {
      label: "Yearly billing",
      value: `${data?.data?.revenueBreakdown?.yearlyBilling} usd`,
      sub: `${data?.data?.revenueBreakdown?.yearlyPercent} % of total`,
      accent: "#10B981",
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6 min-h-screen">
      {/* ── Welcome Header ── */}
      <PageHeader
        kicker="Live Executive Dashboard"
        title={`Welcome back, ${userData?.data?.name || "Admin"}`}
        icon={Sparkles}
      >
        <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className="text-primary font-medium">Role:</span>
          <span className="capitalize">{userData?.data?.role?.replace("_", " ") || "Admin"}</span>
        </div>
      </PageHeader>

      {/* ── top stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm">
                {stat.icon}
              </span>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  stat.positive === true
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2×2 chart grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isSuperAdmin && data?.data?.revenueBreakdown && (
          <Card>
            <CardHeader title="Monthly revenue" subtitle="Last 6 months · USD" />
            <ChartContainer
              config={monthlyRevenueConfig}
              className="h-[200px] w-full"
            >
              <BarChart
                data={data?.data?.charts?.revenueChart}
                barCategoryGap="15%"
              >
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={v => `$${v / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={6}
                />
              </BarChart>
            </ChartContainer>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Reports generated"
            subtitle="Daily over last 2 weeks"
          />
          <ChartContainer config={reportsConfig} className="h-[200px] w-full">
            <LineChart data={data?.data?.charts?.reportsChart}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                interval={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "var(--primary)" }}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader
            title="User statistics"
            subtitle="Registered vs guest · last 6 months"
          />
          <ChartContainer config={userConfig} className="h-[200px] w-full">
            <BarChart
              data={data?.data?.charts?.userStatsChart}
              barCategoryGap="15%"
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={v => `${v / 1000}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="registered"
                fill="var(--color-registered)"
                radius={6}
              />
              <Bar dataKey="guests" fill="var(--color-guests)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader
            title="Subscription plans"
            subtitle="Active users by plan tier"
          />
          <div className="flex flex-col gap-4">
            <ChartContainer config={{}} className="h-[160px] w-full">
              <PieChart>
                <Pie
                  data={plans}
                  dataKey="pct"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {plans.map((plan, idx) => (
                    <Cell key={idx} fill={plan.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-xs shadow-md">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {item.label}
                        </p>
                        <p className="text-slate-400">
                          {item.count.toLocaleString()} users · {item.pct}%
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>

            <div className="flex flex-col gap-3">
              {plans.map(plan => (
                <div
                  key={plan.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: plan.color }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {plan.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{plan.count}</span>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: plan.color + "20",
                        color: plan.color,
                      }}
                    >
                      {plan.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── users by role ── */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Users Breakdown by Role
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active profile distribution across platform roles
            </p>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {roleData.reduce((acc, curr) => acc + curr.count, 0)} Total Role Accounts
          </span>
        </div>

        {roleData.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No role data available yet.
          </p>
        ) : (
          <>
            {/* Active Role Stat Progress Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {roleData.map(role => {
                const maxCount = Math.max(...roleData.map(r => r.count), 1);
                const progressPct = Math.round((role.count / maxCount) * 100);
                return (
                  <div
                    key={role.role}
                    className="rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-2.5 transition-all hover:border-primary/40"
                  >
                    <div>
                      <p
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate"
                        title={role.label}
                      >
                        {role.label}
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {role.count}
                        </span>
                        <span className="text-[11px] font-semibold text-primary">
                          {role.percent}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(progressPct, role.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Crisp Column Bar Chart for Active Roles */}
            {(() => {
              const activeRoles = roleData.filter(r => r.count > 0);
              const displayChartData = activeRoles.length > 0 ? activeRoles : roleData.slice(0, 6);
              return (
                <ChartContainer
                  config={roleUsersConfig}
                  className="h-[240px] w-full"
                >
                  <BarChart
                    data={displayChartData}
                    barCategoryGap="20%"
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ChartContainer>
              );
            })()}

            <div className="mt-8 mb-5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Monthly trend
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                New users by role · last 6 months
              </p>
            </div>

            {roleTrendSeries.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No trend data available yet.
              </p>
            ) : (
              <ChartContainer
                config={roleTrendConfig}
                className="h-[280px] w-full"
              >
                <BarChart data={roleTrendData}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {roleTrendSeries.map((role, i) => (
                    <Bar
                      key={role}
                      dataKey={role}
                      stackId="roles"
                      fill={`var(--color-${role})`}
                      radius={
                        i === roleTrendSeries.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                      barSize={32}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            )}
          </>
        )}
      </Card>

      {/* ── revenue breakdown (super admin only) ── */}
      {isSuperAdmin && data?.data?.revenueBreakdown && (
        <Card>
          <div className="flex flex-col gap-1 mb-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Revenue breakdown
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Monthly vs yearly subscriptions · full year
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {demoStats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl p-4 shadow-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-1"
              >
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {stat.label}
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {stat.sub}
                  </p>
                )}
              </div>
            ))}
          </div>

          <ChartContainer config={revenueConfig} className="h-[260px] w-full">
            <BarChart
              data={data?.data?.charts?.revenueBreakdownChart}
              barCategoryGap="15%"
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={v => `$${v / 1000}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="monthly" fill="var(--color-monthly)" radius={4} />
              <Bar dataKey="yearly" fill="var(--color-yearly)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Card>
      )}
    </section>
  );
};

export default Page;
