"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyMetricsChart } from "@/components/charts/BodyMetricsChart";
import { MiDataChart } from "@/components/charts/MiDataChart";
import { WorkoutChart } from "@/components/charts/WorkoutChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardData {
  bodyMetrics: { date: string; weight_kg: number | null; body_fat_pct: number | null }[];
  miData: { date: string; steps: number | null; sleep_hours: number | null }[];
  workoutSummary: { date: string; exercise_name: string; max_weight: number | null }[];
  exerciseNames: string[];
}

const PERIODS = [
  { label: "7日間", value: 7 },
  { label: "30日間", value: 30 },
  { label: "90日間", value: 90 },
  { label: "全期間", value: 0 },
];

export default function ProgressPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!selectedExercise && d.exerciseNames?.length > 0) {
          setSelectedExercise(d.exerciseNames[0]);
        }
        setLoading(false);
      });
  }, [days]);

  const workoutChartData = data?.workoutSummary
    .filter((w) => w.exercise_name === selectedExercise)
    .map((w) => ({ date: w.date, max_weight: w.max_weight })) ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">進捗グラフ</h1>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
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

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">体重・体脂肪率</CardTitle></CardHeader>
            <CardContent>
              <BodyMetricsChart data={data?.bodyMetrics ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">歩数・睡眠</CardTitle></CardHeader>
            <CardContent>
              <MiDataChart data={data?.miData ?? []} />
            </CardContent>
          </Card>

          {(data?.exerciseNames?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <CardTitle className="text-base">筋トレ重量推移</CardTitle>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="種目を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.exerciseNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <WorkoutChart data={workoutChartData} exerciseName={selectedExercise} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
