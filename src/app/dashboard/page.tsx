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
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
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
            className="absolute rounded-full bg-white dark:bg-gray-900"
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
          className="rounded-xl p-4 shadow-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col gap-2"
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
              className="rounded-xl p-4 shadow-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col gap-2"
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
  monthly: { label: "Monthly", color: "#6C63FF" },
  yearly: { label: "Yearly", color: "#10B981" },
};

const userConfig = {
  registered: { label: "Registered", color: "#6C63FF" },
  guests: { label: "Guests", color: "#10B981" },
};

const reportsConfig = {
  count: { label: "Reports", color: "#10B981" },
};

const monthlyRevenueConfig = {
  revenue: { label: "Revenue", color: "#6C63FF" },
};

const roleUsersConfig = {
  count: { label: "Users", color: "#6C63FF" },
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
  "#6C63FF",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#EC4899",
  "#22C55E",
  "#EAB308",
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
      color: "#F59E0B",
    },
    {
      label: "Yearly",
      count: data?.data?.subscriptionPlans?.yearly?.count,
      pct: data?.data?.subscriptionPlans?.yearly?.percent,
      color: "#6C63FF",
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
  const topRoles = roleData.slice(0, 4);

  const roleTrendData: Record<string, number | string>[] =
    data?.data?.charts?.userRoleTrendChart ?? [];
  const roleTrendSeries = roleTrendData.length
    ? (Object.keys(roleTrendData[0]) as string[]).filter(k => k !== "month")
    : [];
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
      {/* ── Executive Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800/80 p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xl shadow-inner">
              {(userData?.data?.name || "A")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Live Executive Dashboard
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {userData?.data?.name || "Admin"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
              <span className="text-amber-400 font-medium">Role:</span>
              <span className="capitalize">{userData?.data?.role?.replace("_", " ") || "Admin"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── top stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStats.map((stat, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-60 group-hover:opacity-100"
              style={{ background: stat.accent }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {stat.label}
              </p>
              <span
                className="text-lg p-2.5 rounded-xl transition-transform group-hover:scale-110"
                style={{ background: stat.lightBg }}
              >
                {stat.icon}
              </span>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white" style={{ color: stat.accent }}>
                {stat.value}
              </p>
              <p
                className={`text-xs font-bold mt-1 ${
                  stat.positive === true
                    ? "text-emerald-500"
                    : "text-slate-400"
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
                strokeWidth={5.5}
                dot={{ r: 5, fill: "#10B981" }}
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
                      <div className="rounded-lg border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 px-3 py-2 text-xs shadow-md">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {item.label}
                        </p>
                        <p className="text-gray-400">
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
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {plan.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{plan.count}</span>
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
        <div className="flex flex-col gap-1 mb-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Users by role
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Distribution across profile roles
          </p>
        </div>

        {roleData.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No role data available yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {topRoles.map(role => (
                <div
                  key={role.role}
                  className="rounded-xl p-4 shadow-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col gap-1"
                >
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {role.label}
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#6C63FF" }}
                  >
                    {role.count}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {role.percent}% of role users
                  </p>
                </div>
              ))}
            </div>

            <ChartContainer
              config={roleUsersConfig}
              className="h-[320px] w-full"
            >
              <BarChart
                data={roleData}
                layout="vertical"
                margin={{ left: 4, right: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ChartContainer>

            <div className="mt-8 mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Monthly trend
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                New users by role · last 6 months
              </p>
            </div>

            {roleTrendSeries.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
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
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Revenue breakdown
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Monthly vs yearly subscriptions · full year
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {demoStats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl p-4 shadow-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col gap-1"
              >
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
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
