"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Moon, Scale, Save, ChevronDown, ChevronUp } from "lucide-react";

interface DailyRecord {
  date: string;
  steps: number | null;
  sleep_hours: number | null;
}

interface BodyRecord {
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
}

export default function DailyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState("");
  const [sleep, setSleep] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [bodyRecords, setBodyRecords] = useState<BodyRecord[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const [r1, r2] = await Promise.all([
      fetch('/api/mi-fitness/manual').then(r => r.json()),
      fetch('/api/body-metrics').then(r => r.json()),
    ]);
    if (Array.isArray(r1)) setRecords(r1.slice(0, 30));
    if (Array.isArray(r2)) setBodyRecords(r2.reverse().slice(0, 30));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const promises = [];

      if (steps || sleep) {
        promises.push(
          fetch('/api/mi-fitness/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              steps: steps ? parseInt(steps) : null,
              sleep_hours: sleep ? parseFloat(sleep) : null,
            }),
          })
        );
      }

      if (weight || bodyFat) {
        promises.push(
          fetch('/api/body-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              weight_kg: weight ? parseFloat(weight) : null,
              body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
            }),
          })
        );
      }

      if (promises.length === 0) {
        setMsg("⚠️ 何か入力してください");
        setSaving(false);
        return;
      }

      await Promise.all(promises);
      setMsg("✅ 保存しました！");
      setSteps(""); setSleep(""); setWeight(""); setBodyFat("");
      await loadHistory();
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("❌ 保存に失敗しました");
    }
    setSaving(false);
  }

  // Merge records by date for display
  const allDates = Array.from(new Set([
    ...records.map(r => r.date),
    ...bodyRecords.map(r => r.date),
  ])).sort((a, b) => b.localeCompare(a)).slice(0, 30);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">📅 日々の記録</h1>
      <p className="text-sm text-muted-foreground">Mi Fitnessで確認した数値を手入力できます</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">データ入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Steps & Sleep */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Footprints className="w-4 h-4 text-blue-400" /> 歩数
              </label>
              <input
                type="number"
                placeholder="例: 8500"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Moon className="w-4 h-4 text-pink-400" /> 睡眠（時間）
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="例: 7.5"
                value={sleep}
                onChange={e => setSleep(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Weight & Body Fat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Scale className="w-4 h-4 text-green-400" /> 体重（kg）
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="例: 70.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Scale className="w-4 h-4 text-yellow-400" /> 体脂肪率（%）
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="例: 18.5"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {msg && (
            <p className="text-sm text-center py-2 rounded bg-secondary">{msg}</p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存する"}
          </button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="text-base flex items-center justify-between">
            記録履歴（直近30日）
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {allDates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">まだ記録がありません</p>
            ) : (
              <div className="space-y-2">
                {allDates.map(d => {
                  const mi = records.find(r => r.date === d);
                  const bm = bodyRecords.find(r => r.date === d);
                  return (
                    <div key={d} className="rounded border border-border p-3 text-sm">
                      <div className="font-medium mb-1">{d}</div>
                      <div className="flex flex-wrap gap-3 text-muted-foreground">
                        {mi?.steps != null && (
                          <span className="flex items-center gap-1">
                            <Footprints className="w-3 h-3 text-blue-400" />
                            {mi.steps.toLocaleString()}歩
                          </span>
                        )}
                        {mi?.sleep_hours != null && (
                          <span className="flex items-center gap-1">
                            <Moon className="w-3 h-3 text-pink-400" />
                            {mi.sleep_hours}h
                          </span>
                        )}
                        {bm?.weight_kg != null && (
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-green-400" />
                            {bm.weight_kg}kg
                          </span>
                        )}
                        {bm?.body_fat_pct != null && (
                          <span className="flex items-center gap-1">
                            体脂肪 {bm.body_fat_pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
