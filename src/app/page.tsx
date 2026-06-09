"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyMetricsChart } from "@/components/charts/BodyMetricsChart";
import { MiDataChart } from "@/components/charts/MiDataChart";
import { Activity, Dumbbell, Scale, Moon } from "lucide-react";

interface DashboardData {
  bodyMetrics: { date: string; weight_kg: number | null; body_fat_pct: number | null }[];
  miData: { date: string; steps: number | null; sleep_hours: number | null }[];
  workoutSummary: { date: string; exercise_name: string; max_weight: number | null }[];
  cardioSummary: { date: string; type: string; duration_min: number | null; calories: number | null }[];
}

const PERIODS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "全期間", value: 0 },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [days]);

  const latestWeight = data?.bodyMetrics.at(-1)?.weight_kg;
  const latestBodyFat = data?.bodyMetrics.at(-1)?.body_fat_pct;
  const avgSteps = data?.miData.length
    ? Math.round(data.miData.reduce((s, d) => s + (d.steps ?? 0), 0) / data.miData.length)
    : null;
  const avgSleep = data?.miData.length
    ? (data.miData.reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / data.miData.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                days === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">最新体重</p>
                <p className="text-2xl font-bold">{latestWeight != null ? `${latestWeight}kg` : "---"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">最新体脂肪率</p>
                <p className="text-2xl font-bold">{latestBodyFat != null ? `${latestBodyFat}%` : "---"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">平均歩数</p>
                <p className="text-2xl font-bold">{avgSteps != null ? avgSteps.toLocaleString() : "---"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Moon className="w-8 h-8 text-pink-400" />
              <div>
                <p className="text-xs text-muted-foreground">平均睡眠</p>
                <p className="text-2xl font-bold">{avgSleep != null ? `${avgSleep}h` : "---"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">体重・体脂肪率の推移</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMetricsChart data={data?.bodyMetrics ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">歩数・睡眠時間の推移</CardTitle>
            </CardHeader>
            <CardContent>
              <MiDataChart data={data?.miData ?? []} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
