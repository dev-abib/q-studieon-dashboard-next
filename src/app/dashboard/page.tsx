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

const revenueData = [
  { month: "Jan", monthly: 3800, yearly: 2500 },
  { month: "Feb", monthly: 4700, yearly: 3100 },
  { month: "Mar", monthly: 5500, yearly: 3600 },
  { month: "Apr", monthly: 6600, yearly: 4800 },
  { month: "May", monthly: 6500, yearly: 2600 },
  { month: "Jun", monthly: 600, yearly: 800 },
  { month: "Jul", monthly: 5000, yearly: 2000 },
  { month: "Aug", monthly: 6200, yearly: 4100 },
  { month: "Sep", monthly: 5000, yearly: 300 },
  { month: "Oct", monthly: 1600, yearly: 4500 },
  { month: "Nov", monthly: 5100, yearly: 2600 },
  { month: "Dec", monthly: 3300, yearly: 1800 },
];

const revenueConfig = {
  monthly: { label: "Monthly", color: "#6C63FF" },
  yearly: { label: "Yearly", color: "#10B981" },
};

const usersData = [
  { month: "Nov", registered: 600, guest: 1800 },
  { month: "Dec", registered: 720, guest: 2100 },
  { month: "Jan", registered: 850, guest: 2500 },
  { month: "Feb", registered: 980, guest: 2900 },
  { month: "Mar", registered: 1100, guest: 3200 },
  { month: "Apr", registered: 1204, guest: 3617 },
];

const userConfig = {
  registered: { label: "Registered", color: "#6C63FF" },
  guest: { label: "Guest", color: "#10B981" },
};

const reportsData = [
  { day: "Apr 28", reports: 180 },
  { day: "Apr 29", reports: 210 },
  { day: "Apr 30", reports: 195 },
  { day: "May 1", reports: 240 },
  { day: "May 2", reports: 280 },
  { day: "May 3", reports: 190 },
  { day: "May 4", reports: 170 },
  { day: "May 5", reports: 310 },
  { day: "May 6", reports: 340 },
  { day: "May 7", reports: 290 },
  { day: "May 8", reports: 360 },
  { day: "May 9", reports: 380 },
  { day: "May 10", reports: 400 },
  { day: "May 11", reports: 420 },
];

const reportsConfig = {
  reports: { label: "Reports", color: "#10B981" },
};

const monthlyRevenueData = [
  { month: "Nov", revenue: 4200 },
  { month: "Dec", revenue: 5100 },
  { month: "Jan", revenue: 6300 },
  { month: "Feb", revenue: 7800 },
  { month: "Mar", revenue: 9100 },
  { month: "Apr", revenue: 11400 },
];

const monthlyRevenueConfig = {
  revenue: { label: "Revenue", color: "#6C63FF" },
};

const topStats = [
  {
    label: "Total users",
    value: "4,821",
    change: "↑ 12% this month",
    positive: true,
    accent: "#6C63FF",
    lightBg: "#F0EFFE",
    icon: "👥",
  },
  {
    label: "Active subscriptions",
    value: "1,204",
    change: "↑ 8% this month",
    positive: true,
    accent: "#10B981",
    lightBg: "#ECFDF5",
    icon: "⭐",
  },
  {
    label: "Guest users",
    value: "3,617",
    change: "75% of total",
    positive: null,
    accent: "#F59E0B",
    lightBg: "#FFFBEB",
    icon: "👤",
  },
  {
    label: "Reports today",
    value: "342",
    change: "↑ 5% vs yesterday",
    positive: true,
    accent: "#3B82F6",
    lightBg: "#EFF6FF",
    icon: "📄",
  },
];

const plans = [
  { label: "Free", count: 3034, pct: 63, color: "#94A3B8" },
  { label: "Basic", count: 867, pct: 18, color: "#F59E0B" },
  { label: "Pro", count: 920, pct: 19, color: "#6C63FF" },
];

const demoStats = [
  { label: "Total revenue", value: "$43,900", sub: null, accent: "#6C63FF" },
  {
    label: "Monthly billing",
    value: "$26,200",
    sub: "60% of total",
    accent: "#6C63FF",
  },
  {
    label: "Yearly billing",
    value: "$17,700",
    sub: "40% of total",
    accent: "#10B981",
  },
];

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

const Page = () => {
  return (
    <section className="w-full flex flex-col gap-6 min-h-screen ">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Welcome back, Admin
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Monthly revenue" subtitle="Last 6 months · USD" />
          <ChartContainer
            config={monthlyRevenueConfig}
            className="h-[200px] w-full"
          >
            <BarChart data={monthlyRevenueData} barCategoryGap="15%">
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
            <LineChart data={reportsData}>
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
            <BarChart data={usersData} barCategoryGap="15%" barGap={4}>
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
              <Bar dataKey="guest" fill="var(--color-guest)" radius={6} />
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
                    <span className="text-xs text-gray-400">
                      {plan.count.toLocaleString()}
                    </span>
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
          <BarChart data={revenueData} barCategoryGap="15%" barGap={4}>
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
