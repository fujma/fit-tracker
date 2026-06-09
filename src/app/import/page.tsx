"use client";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  message: string;
  bodyMetricsInserted: number;
  miDataInserted: number;
  skipped: number;
  total: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/mi-fitness/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setResult(data);
    } else {
      setError(data.error ?? "インポートに失敗しました");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">mi Fitness CSVインポート</h1>
        <p className="text-muted-foreground text-sm mt-1">mi Band / XiaomiアプリからエクスポートしたCSVを読み込みます</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">対応データ</CardTitle>
          <CardDescription>以下の列名（日本語・英語）を自動検出します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ["体重", "体重(kg) / Weight(kg)"],
              ["体脂肪率", "体脂肪率(%) / Body Fat(%)"],
              ["歩数", "歩数 / Steps"],
              ["睡眠", "睡眠時間 / Sleep Duration"],
              ["日付", "日付 / Date (YYYY-MM-DD等)"],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-2 items-start">
                <span className="font-medium text-primary shrink-0">{label}</span>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <>
                <p className="font-medium">CSVファイルをドロップ、またはクリックして選択</p>
                <p className="text-xs text-muted-foreground mt-1">.csv ファイルのみ</p>
              </>
            )}
          </div>

          <div className="mt-4">
            <Button onClick={handleImport} disabled={!file || loading} className="w-full">
              {loading ? "インポート中..." : "インポート開始"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-500/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-green-400">{result.message}</p>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>総行数: {result.total}</p>
                  <p>体重・体脂肪データ: {result.bodyMetricsInserted} 件</p>
                  <p>歩数・睡眠データ: {result.miDataInserted} 件</p>
                  <p>スキップ: {result.skipped} 件</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
