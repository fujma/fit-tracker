"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Cardio {
  id: number;
  date: string;
  type: string;
  duration_min: number | null;
  distance_km: number | null;
  calories: number | null;
  notes: string | null;
}

const CARDIO_TYPES = ["ランニング", "ウォーキング", "自転車", "水泳", "エリプティカル", "縄跳び", "その他"];

export default function CardioPage() {
  const [records, setRecords] = useState<Cardio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    date: today, type: "ランニング", duration_min: "", distance_km: "", calories: "", notes: "",
  });

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
        ...form,
        duration_min: form.duration_min ? parseFloat(form.duration_min) : null,
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        calories: form.calories ? parseFloat(form.calories) : null,
      }),
    });
    if (res.ok) {
      setMsg("記録しました！");
      setForm({ date: today, type: "ランニング", duration_min: "", distance_km: "", calories: "", notes: "" });
      setShowForm(false);
      load();
    } else {
      const err = await res.json();
      setMsg(err.error ?? "エラーが発生しました");
    }
    setSubmitting(false);
  }

  // Chart: calories per day (last 30 entries)
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
            <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>日付</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>種目</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARDIO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>時間 (分)</Label>
                <Input type="number" step="0.5" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} placeholder="30" />
              </div>
              <div className="space-y-1">
                <Label>距離 (km)</Label>
                <Input type="number" step="0.01" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} placeholder="5.0" />
              </div>
              <div className="space-y-1">
                <Label>カロリー (kcal)</Label>
                <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="300" />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-3">
                <Label>メモ</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="col-span-2 sm:col-span-3 flex gap-2">
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
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                />
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
                    <th className="text-left py-2 pr-4">日付</th>
                    <th className="text-left py-2 pr-4">種目</th>
                    <th className="text-right py-2 pr-4">時間</th>
                    <th className="text-right py-2 pr-4">距離</th>
                    <th className="text-right py-2 pr-4">カロリー</th>
                    <th className="text-left py-2">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 pr-4 whitespace-nowrap">{r.date}</td>
                      <td className="py-2 pr-4 font-medium">{r.type}</td>
                      <td className="py-2 pr-4 text-right">{r.duration_min != null ? `${r.duration_min}分` : "-"}</td>
                      <td className="py-2 pr-4 text-right">{r.distance_km != null ? `${r.distance_km}km` : "-"}</td>
                      <td className="py-2 pr-4 text-right">{r.calories != null ? `${r.calories}kcal` : "-"}</td>
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
