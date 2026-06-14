"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Plus, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Cardio {
  id: number;
  date: string;
  type: string;
  duration_min: number | null;
  distance_km: number | null;
  calories: number | null;
  speed_kmh: number | null;
  incline_pct: number | null;
  notes: string | null;
}

const CARDIO_TYPES = ["ランニング", "ウォーキング", "自転車", "水泳", "エリプティカル", "縄跳び", "その他"];

// 体重（カロリー計算用デフォルト70kg）
const DEFAULT_WEIGHT_KG = 70;

function calcDistanceAndCalories(
  duration_min: number,
  speed_kmh: number,
  incline_pct: number
): { distance_km: number; calories: number } {
  // 距離 = スピード(km/h) × 時間(h)
  const distance_km = parseFloat((speed_kmh * (duration_min / 60)).toFixed(2));

  // カロリー計算（トレッドミル公式 ACSM）
  // VO2 (ml/kg/min) = 0.1×speed(m/min) + 1.8×speed(m/min)×grade + 3.5
  const speed_m_min = speed_kmh * 1000 / 60;
  const grade = incline_pct / 100;
  const vo2 = 0.1 * speed_m_min + 1.8 * speed_m_min * grade + 3.5;
  // カロリー/min = VO2 × 体重 × 5 / 1000
  const cal_per_min = vo2 * DEFAULT_WEIGHT_KG * 5 / 1000;
  const calories = Math.round(cal_per_min * duration_min);

  return { distance_km, calories };
}

export default function CardioPage() {
  const [records, setRecords] = useState<Cardio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    date: today,
    type: "ランニング",
    duration_min: "",
    speed_kmh: "",
    incline_pct: "0",
    distance_km: "",
    calories: "",
    notes: "",
  });

  // スピード・角度・時間が入力されたら自動計算
  function autoCalc(updated: typeof form) {
    const dur = parseFloat(updated.duration_min);
    const spd = parseFloat(updated.speed_kmh);
    const inc = parseFloat(updated.incline_pct) || 0;
    if (dur > 0 && spd > 0) {
      const { distance_km, calories } = calcDistanceAndCalories(dur, spd, inc);
      return { ...updated, distance_km: String(distance_km), calories: String(calories) };
    }
    return updated;
  }

  function setField(field: keyof typeof form, value: string) {
    const updated = { ...form, [field]: value };
    const recalcFields = ["duration_min", "speed_kmh", "incline_pct"];
    if (recalcFields.includes(field)) {
      setForm(autoCalc(updated));
    } else {
      setForm(updated);
    }
  }

  async function load() {
    setLoading(true);
    const data = await fetch("/api/cardio").then((r) => r.json());
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    const res = await fetch("/api/cardio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        type: form.type,
        duration_min: form.duration_min ? parseFloat(form.duration_min) : null,
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        calories: form.calories ? parseFloat(form.calories) : null,
        speed_kmh: form.speed_kmh ? parseFloat(form.speed_kmh) : null,
        incline_pct: form.incline_pct ? parseFloat(form.incline_pct) : null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      setMsg("記録しました！");
      setForm({ date: today, type: "ランニング", duration_min: "", speed_kmh: "", incline_pct: "0", distance_km: "", calories: "", notes: "" });
      setShowForm(false);
      load();
    } else {
      const err = await res.json();
      setMsg(err.error ?? "エラーが発生しました");
    }
    setSubmitting(false);
  }

  const chartData = records
    .slice(0, 30)
    .reverse()
    .map((r) => ({ date: r.date.slice(5), calories: r.calories ?? 0, duration: r.duration_min ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">有酸素運動記録</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          追加
        </Button>
      </div>

      {msg && <p className="text-sm text-green-400">{msg}</p>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">新しい記録</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>日付</Label>
                  <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>種目</Label>
                  <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARDIO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>時間 (分)</Label>
                  <Input type="number" step="0.5" value={form.duration_min} onChange={(e) => setField("duration_min", e.target.value)} placeholder="30" />
                </div>
              </div>

              {/* スピード・角度 */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-xs text-primary font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> スピード・角度を入力すると距離とカロリーが自動計算されます
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>スピード (km/h)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.speed_kmh}
                      onChange={(e) => setField("speed_kmh", e.target.value)}
                      placeholder="例: 8.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>角度 / 傾斜 (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.incline_pct}
                      onChange={(e) => setField("incline_pct", e.target.value)}
                      placeholder="例: 1.0"
                    />
                  </div>
                </div>
              </div>

              {/* 距離・カロリー（自動計算または手動） */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>
                    距離 (km)
                    {form.speed_kmh && form.duration_min && (
                      <span className="ml-2 text-xs text-primary">← 自動計算</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.distance_km}
                    onChange={(e) => setField("distance_km", e.target.value)}
                    placeholder="5.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    カロリー (kcal)
                    {form.speed_kmh && form.duration_min && (
                      <span className="ml-2 text-xs text-primary">← 自動計算</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setField("calories", e.target.value)}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>メモ</Label>
                <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? "保存中..." : "保存"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">カロリー消費推移</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="kcal" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                <Bar dataKey="calories" name="カロリー(kcal)" fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">記録一覧</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground text-sm">記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3">日付</th>
                    <th className="text-left py-2 pr-3">種目</th>
                    <th className="text-right py-2 pr-3">時間</th>
                    <th className="text-right py-2 pr-3">速度</th>
                    <th className="text-right py-2 pr-3">角度</th>
                    <th className="text-right py-2 pr-3">距離</th>
                    <th className="text-right py-2 pr-3">カロリー</th>
                    <th className="text-left py-2">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 pr-3 whitespace-nowrap">{r.date}</td>
                      <td className="py-2 pr-3 font-medium">{r.type}</td>
                      <td className="py-2 pr-3 text-right">{r.duration_min != null ? `${r.duration_min}分` : "-"}</td>
                      <td className="py-2 pr-3 text-right">{r.speed_kmh != null ? `${r.speed_kmh}km/h` : "-"}</td>
                      <td className="py-2 pr-3 text-right">{r.incline_pct != null ? `${r.incline_pct}%` : "-"}</td>
                      <td className="py-2 pr-3 text-right">{r.distance_km != null ? `${r.distance_km}km` : "-"}</td>
                      <td className="py-2 pr-3 text-right">{r.calories != null ? `${r.calories}kcal` : "-"}</td>
                      <td className="py-2 text-muted-foreground">{r.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
