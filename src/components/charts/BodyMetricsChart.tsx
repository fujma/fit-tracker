"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
}

export function BodyMetricsChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">データがありません</div>;
  }

  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis yAxisId="weight" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="kg" />
        <YAxis yAxisId="fat" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
        <Line yAxisId="weight" type="monotone" dataKey="weight_kg" name="体重(kg)" stroke="#4ade80" dot={false} strokeWidth={2} connectNulls />
        <Line yAxisId="fat" type="monotone" dataKey="body_fat_pct" name="体脂肪率(%)" stroke="#60a5fa" dot={false} strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
