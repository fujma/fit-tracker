"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkoutChart } from "@/components/charts/WorkoutChart";
import { format } from "date-fns";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Dumbbell, Pencil, X, Check, Settings } from "lucide-react";

const MACHINE_NUMBERS_KEY = "fittracker_machine_numbers";

interface Workout {
  id: number;
  date: string;
  exercise_name: string;
  weight_kg: number | null;
  sets: number | null;
  reps: number | null;
  notes: string | null;
}

// デフォルト種目プリセット
const DEFAULT_EXERCISES = [
  "チェストプレス", "ペクトラル", "ベンチプレス", "ショルダープレス",
  "ラットプルダウン", "シーテッドロウ", "スクワット", "レッグプレス",
  "レッグカール", "レッグエクステンション", "アームカール", "トライセプス",
];

interface QuickEntry {
  exercise_name: string;
  weight_kg: string;
  sets: string;
  reps: string;
}

function ExerciseCard({
  entry,
  onChange,
  onRemove,
  onSave,
  saved,
  machineNo,
}: {
  entry: QuickEntry;
  onChange: (e: QuickEntry) => void;
  onRemove: () => void;
  onSave: () => void;
  saved: boolean;
  machineNo?: number;
}) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 transition-colors ${saved ? "border-green-500/60 bg-green-500/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-4 h-4 text-primary shrink-0" />
          {machineNo != null && (
            <span className="text-xs font-bold text-muted-foreground bg-secondary rounded px-1.5 py-0.5 shrink-0">
              No.{machineNo}
            </span>
          )}
          <span className="font-semibold text-sm truncate">{entry.exercise_name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {saved && <span className="text-xs text-green-400">✓ 保存済</span>}
          <button onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">重量 (kg)</Label>
          <Input
            type="number"
            step="0.5"
            value={entry.weight_kg}
            onChange={(e) => onChange({ ...entry, weight_kg: e.target.value })}
            placeholder="60"
            className="h-9 text-center text-base font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">セット</Label>
          <Input
            type="number"
            value={entry.sets}
            onChange={(e) => onChange({ ...entry, sets: e.target.value })}
            placeholder="3"
            className="h-9 text-center"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">回数</Label>
          <Input
            type="number"
            value={entry.reps}
            onChange={(e) => onChange({ ...entry, reps: e.target.value })}
            placeholder="10"
            className="h-9 text-center"
          />
        </div>
      </div>
      <Button size="sm" className="w-full h-8" onClick={onSave} disabled={!entry.weight_kg && !entry.sets && !entry.reps}>
        <Save className="w-3.5 h-3.5 mr-1" />
        記録する
      </Button>
    </div>
  );
}

export default function WorkoutsPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  // クイック入力
  const [date, setDate] = useState(today);
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  // マシン番号管理
  const [machineNumbers, setMachineNumbers] = useState<Record<string, number>>({});
  const [showMachineSettings, setShowMachineSettings] = useState(false);
  const [editingNumbers, setEditingNumbers] = useState<Record<string, string>>({});

  // 一覧・グラフ
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chartExercise, setChartExercise] = useState("");
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [chartData, setChartData] = useState<{ date: string; max_weight: number | null }[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Workout>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data: Workout[] = await fetch("/api/workouts").then((r) => r.json());
    setWorkouts(data);
    const names = Array.from(new Set(data.map((w) => w.exercise_name)));
    setExerciseNames(names);
    if (!chartExercise && names.length > 0) setChartExercise(names[0]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  // マシン番号をlocalStorageから読み込む
  useEffect(() => {
    const saved = localStorage.getItem(MACHINE_NUMBERS_KEY);
    if (saved) setMachineNumbers(JSON.parse(saved));
  }, []);

  function saveMachineNumbers() {
    const result: Record<string, number> = {};
    Object.entries(editingNumbers).forEach(([name, val]) => {
      const n = parseInt(val);
      if (!isNaN(n)) result[name] = n;
    });
    setMachineNumbers(result);
    localStorage.setItem(MACHINE_NUMBERS_KEY, JSON.stringify(result));
    setShowMachineSettings(false);
  }

  function openMachineSettings() {
    const allNames = Array.from(new Set([...DEFAULT_EXERCISES, ...exerciseNames]));
    const init: Record<string, string> = {};
    allNames.forEach(n => { init[n] = machineNumbers[n] != null ? String(machineNumbers[n]) : ""; });
    setEditingNumbers(init);
    setShowMachineSettings(true);
  }

  useEffect(() => {
    if (!chartExercise) return;
    const grouped: Record<string, number> = {};
    workouts
      .filter((w) => w.exercise_name === chartExercise && w.weight_kg != null)
      .forEach((w) => {
        grouped[w.date] = Math.max(grouped[w.date] ?? 0, w.weight_kg!);
      });
    setChartData(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, max_weight]) => ({ date, max_weight }))
    );
  }, [chartExercise, workouts]);

  function addExercise(name: string) {
    const trimmed = name.trim();
    if (!trimmed || quickEntries.some((e) => e.exercise_name === trimmed)) return;
    setQuickEntries((prev) => [...prev, { exercise_name: trimmed, weight_kg: "", sets: "3", reps: "10" }]);
    setNewExerciseName("");
    setSelectedPreset("");
    setShowAddExercise(false);
  }

  async function saveEntry(idx: number) {
    const entry = quickEntries[idx];
    setSubmitting(idx);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        exercise_name: entry.exercise_name,
        weight_kg: entry.weight_kg ? parseFloat(entry.weight_kg) : null,
        sets: entry.sets ? parseInt(entry.sets) : null,
        reps: entry.reps ? parseInt(entry.reps) : null,
      }),
    });
    if (res.ok) {
      setSavedIds((prev) => { const next = new Set(Array.from(prev)); next.add(idx); return next; });
      setMsg(`「${entry.exercise_name}」を記録しました！`);
      load();
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(null);
  }

  async function deleteWorkout(id: number) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    load();
  }

  async function updateWorkout(id: number) {
    await fetch(`/api/workouts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
        sets: editForm.sets ? Number(editForm.sets) : null,
        reps: editForm.reps ? Number(editForm.reps) : null,
      }),
    });
    setEditingId(null);
    load();
  }

  async function saveAll() {
    const unsaved = quickEntries.filter((_, i) => !savedIds.has(i) && (quickEntries[i].weight_kg || quickEntries[i].sets));
    for (let i = 0; i < quickEntries.length; i++) {
      if (!savedIds.has(i)) await saveEntry(i);
    }
  }

  const unusedPresets = DEFAULT_EXERCISES
    .filter((n) => !quickEntries.some((e) => e.exercise_name === n))
    .sort((a, b) => {
      const na = machineNumbers[a] ?? 9999;
      const nb = machineNumbers[b] ?? 9999;
      return na - nb;
    });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">筋トレ記録</h1>
        <Input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setSavedIds(new Set()); }}
          className="w-full sm:w-44 h-9"
        />
      </div>

      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-md px-4 py-2 text-sm text-green-400">
          {msg}
        </div>
      )}

      {/* 種目カード一覧 */}
      {quickEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickEntries.map((entry, idx) => (
            <ExerciseCard
              key={entry.exercise_name}
              entry={entry}
              onChange={(e) => {
                setQuickEntries((prev) => prev.map((x, i) => i === idx ? e : x));
                setSavedIds((prev) => { const s = new Set(prev); s.delete(idx); return s; });
              }}
              onRemove={() => setQuickEntries((prev) => prev.filter((_, i) => i !== idx))}
              onSave={() => saveEntry(idx)}
              saved={savedIds.has(idx)}
              machineNo={machineNumbers[entry.exercise_name]}
            />
          ))}
        </div>
      )}

      {/* 種目追加パネル */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          {quickEntries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center pb-1">種目を追加して記録を始めましょう</p>
          )}
          {/* プリセットから選択 */}
          <div className="flex flex-wrap gap-2 items-center">
            {unusedPresets.slice(0, 8).map((name) => (
              <button
                key={name}
                onClick={() => addExercise(name)}
                className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
              >
                {machineNumbers[name] != null && (
                  <span className="text-muted-foreground font-bold">{machineNumbers[name]}.</span>
                )}
                + {name}
              </button>
            ))}
            {unusedPresets.length > 8 && (
              <button
                onClick={() => setShowAddExercise(!showAddExercise)}
                className="px-3 py-1.5 text-xs rounded-full border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
              >
                もっと見る
              </button>
            )}
            <button
              onClick={openMachineSettings}
              className="ml-auto p-1.5 rounded-full border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
              title="マシン番号を設定"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* マシン番号設定パネル */}
          {showMachineSettings && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">マシン番号を設定</p>
                <button onClick={() => setShowMachineSettings(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">ジムのマシン番号を入力してください。番号順に並び替えられます。</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from(new Set([...DEFAULT_EXERCISES, ...exerciseNames])).map(name => (
                  <div key={name} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingNumbers[name] ?? ""}
                      onChange={e => setEditingNumbers(prev => ({ ...prev, [name]: e.target.value }))}
                      placeholder="番号"
                      className="w-14 rounded border border-border bg-background px-2 py-1 text-xs text-center"
                    />
                    <span className="text-xs truncate">{name}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={saveMachineNumbers} className="w-full">
                <Check className="w-3.5 h-3.5 mr-1" /> 保存
              </Button>
            </div>
          )}

          {/* カスタム種目入力 */}
          <div className="flex gap-2">
            <Input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise(newExerciseName)}
              placeholder="種目名を直接入力..."
              className="h-9"
              list="exercise-datalist"
            />
            <datalist id="exercise-datalist">
              {DEFAULT_EXERCISES.map((n) => <option key={n} value={n} />)}
              {exerciseNames.map((n) => <option key={n} value={n} />)}
            </datalist>
            <Button size="sm" onClick={() => addExercise(newExerciseName)} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {quickEntries.length > 1 && (
            <Button className="w-full" onClick={saveAll}>
              <Save className="w-4 h-4 mr-2" />
              すべて記録する
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 重量推移グラフ */}
      {exerciseNames.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-base">重量推移グラフ</CardTitle>
              <Select value={chartExercise} onValueChange={setChartExercise}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exerciseNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <WorkoutChart data={chartData} exerciseName={chartExercise} />
          </CardContent>
        </Card>
      )}

      {/* 履歴一覧 */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">記録履歴</CardTitle>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">読み込み中...</p>
            ) : workouts.length === 0 ? (
              <p className="text-muted-foreground text-sm">記録がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-3">日付</th>
                      <th className="text-left py-2 pr-3">種目</th>
                      <th className="text-right py-2 pr-3">重量</th>
                      <th className="text-right py-2 pr-3">セット</th>
                      <th className="text-right py-2 pr-3">回数</th>
                      <th className="py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.map((w) => editingId === w.id ? (
                      <tr key={w.id} className="border-b border-primary/30 bg-primary/5">
                        <td className="py-1 pr-2"><input type="date" value={editForm.date ?? ""} onChange={e => setEditForm(f => ({...f, date: e.target.value}))} className="w-32 rounded border border-border bg-background px-1 py-0.5 text-xs" /></td>
                        <td className="py-1 pr-2"><input type="text" value={editForm.exercise_name ?? ""} onChange={e => setEditForm(f => ({...f, exercise_name: e.target.value}))} className="w-28 rounded border border-border bg-background px-1 py-0.5 text-xs" /></td>
                        <td className="py-1 pr-2 text-right"><input type="number" step="0.5" value={editForm.weight_kg ?? ""} onChange={e => setEditForm(f => ({...f, weight_kg: e.target.value as unknown as number}))} className="w-16 rounded border border-border bg-background px-1 py-0.5 text-xs text-right" /></td>
                        <td className="py-1 pr-2 text-right"><input type="number" value={editForm.sets ?? ""} onChange={e => setEditForm(f => ({...f, sets: e.target.value as unknown as number}))} className="w-12 rounded border border-border bg-background px-1 py-0.5 text-xs text-right" /></td>
                        <td className="py-1 pr-2 text-right"><input type="number" value={editForm.reps ?? ""} onChange={e => setEditForm(f => ({...f, reps: e.target.value as unknown as number}))} className="w-12 rounded border border-border bg-background px-1 py-0.5 text-xs text-right" /></td>
                        <td className="py-1">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => updateWorkout(w.id)} className="p-1 text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={w.id} className="border-b border-border/50 hover:bg-accent/50">
                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground text-xs">{w.date}</td>
                        <td className="py-2 pr-3 font-medium">{w.exercise_name}</td>
                        <td className="py-2 pr-3 text-right font-bold text-primary">{w.weight_kg != null ? `${w.weight_kg}kg` : "-"}</td>
                        <td className="py-2 pr-3 text-right">{w.sets ?? "-"}</td>
                        <td className="py-2 pr-3 text-right">{w.reps ?? "-"}</td>
                        <td className="py-2">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditingId(w.id); setEditForm({...w}); }} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteWorkout(w.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
