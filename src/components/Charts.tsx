"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface WeeklyDatum {
  label: string;
  dateLabel: string;
  liters: number;
  goalLiters: number;
  goalMet: boolean;
}

export interface MonthlyDatum {
  label: string;
  liters: number;
}

interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string; payload?: Record<string, unknown> }[];
}

function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const liters = Number(payload[0]?.value ?? 0);
  return (
    <div className="glass-sm sheen px-3.5 py-2.5 text-sm">
      <p className="label !text-[10px]">{label}</p>
      <p className="num font-display text-base font-bold">
        {liters.toFixed(1)} <span className="text-gradient text-xs">L</span>
      </p>
      {payload[0]?.payload?.goalMet ? (
        <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>
          goal reached
        </p>
      ) : null}
    </div>
  );
}

const axisStyle = {
  fontSize: 12,
  fontFamily: "var(--font-body)",
  fill: "var(--ink-3)",
  fontWeight: 600,
} as const;

export function WeeklyBarChart({ data }: { data: WeeklyDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 12, right: 4, left: -18, bottom: 0 }} barCategoryGap="26%">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} dy={8} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}L`} />
        <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(120,180,255,0.08)" }} />
        <ReferenceLine
          y={data[0]?.goalLiters ?? 3}
          stroke="var(--accent-1)"
          strokeDasharray="5 6"
          strokeOpacity={0.55}
        />
        <Bar dataKey="liters" radius={[9, 9, 9, 9]} maxBarSize={44} animationDuration={900} animationEasing="ease-out">
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.goalMet ? "url(#barGrad)" : "color-mix(in srgb, var(--accent-2) 34%, transparent)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyAreaChart({ data }: { data: MonthlyDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(56,189,248,0.55)" />
            <stop offset="1" stopColor="rgba(56,189,248,0.02)" />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} dy={8} interval="preserveStartEnd" minTickGap={28} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}L`} />
        <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--line-strong)", strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="liters"
          stroke="#38bdf8"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          animationDuration={1100}
          dot={false}
          activeDot={{ r: 5, fill: "#38bdf8", stroke: "var(--bg-1)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
