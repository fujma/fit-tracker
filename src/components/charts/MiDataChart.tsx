"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  steps: number | null;
  sleep_hours: number | null;
}

export function MiDataChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">データがありません</div>;
  }

  const formatted = data.map((d) => ({ ...d, date: d.date.slice(5) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis yAxisId="steps" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis yAxisId="sleep" orientation="right" domain={[0, 12]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="h" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
        <Bar yAxisId="steps" dataKey="steps" name="歩数" fill="#a78bfa" opacity={0.8} />
        <Line yAxisId="sleep" type="monotone" dataKey="sleep_hours" name="睡眠(h)" stroke="#f472b6" dot={false} strokeWidth={2} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
