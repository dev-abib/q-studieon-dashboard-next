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
  const statBgs = ["#F0EFFE", "#ECFDF5", "#FFFBEB", "#EFF6FF"];
  return (
    <section className="w-full flex flex-col gap-6 min-h-screen">
      <ShimmerStyle />

      {/* heading */}
      <div className="flex flex-col gap-2">
        <Sk className="h-7 w-36 rounded-lg" />
        <Sk className="h-4 w-48 rounded-full" />
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
  reports: { label: "Reports", color: "#10B981" },
};

const monthlyRevenueConfig = {
  revenue: { label: "Revenue", color: "#6C63FF" },
};

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

  if (isLoading) return <DashboardSkeleton />;

  const getGrowthData = (growth: number = 0, suffix: string) => ({
    change: `${
      growth > 0 ? "↑" : growth < 0 ? "↓" : "→"
    } ${Math.abs(growth)}% ${suffix}`,
    positive: growth > 0 ? true : growth < 0 ? false : null,
  });

  const stats_data = data?.data?.cards;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Welcome back, Admin
        </p>
      </div>

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
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: stat.accent }}>
              {stat.value}
            </p>
            <p
              className={`text-xs font-medium ${
                stat.positive === true ? "text-emerald-500" : "text-gray-400"
              }`}
            >
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* ── 2×2 chart grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader
            title="Reports generated"
            subtitle="Daily over last 2 weeks"
          />
          <ChartContainer config={reportsConfig} className="h-[200px] w-full">
            <LineChart data={data?.data?.charts?.reportsChart}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
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
                dataKey="reports"
                stroke="var(--color-reports)"
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

      {/* ── revenue breakdown ── */}
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
              <p className="text-2xl font-bold" style={{ color: stat.accent }}>
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
    </section>
  );
};

export default Page;
