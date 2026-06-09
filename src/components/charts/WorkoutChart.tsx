"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  max_weight: number | null;
}

export function WorkoutChart({ data, exerciseName }: { data: DataPoint[]; exerciseName: string }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">データがありません</div>;
  }

  const formatted = data.map((d) => ({ ...d, date: d.date.slice(5) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="kg" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
          formatter={(v: number) => [`${v}kg`, "最大重量"]}
        />
        <Line type="monotone" dataKey="max_weight" name={exerciseName} stroke="#f97316" dot={{ r: 3 }} strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
