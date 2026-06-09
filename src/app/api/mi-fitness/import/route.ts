import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';
import Papa from 'papaparse';

const COLUMN_MAP = {
  date: ['日付', 'date', 'Date', '測定日'],
  weight_kg: ['体重(kg)', '体重 (kg)', 'Weight(kg)', 'weight_kg', 'Weight', '体重'],
  body_fat_pct: ['体脂肪率(%)', '体脂肪率 (%)', 'Body Fat(%)', 'body_fat_pct', 'Body Fat', '体脂肪率'],
  steps: ['歩数', 'Steps', 'steps', '歩数(歩)'],
  sleep_hours: ['睡眠時間', 'Sleep Duration', 'sleep_hours', '睡眠(時間)', 'Sleep(h)'],
};

function findColumn(row: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) if (k in row) return row[k];
  return undefined;
}

function parseFloat_(v: string | undefined): number | null {
  if (!v || v.trim() === '' || v === '-') return null;
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseInt_(v: string | undefined): number | null {
  if (!v || v.trim() === '' || v === '-') return null;
  const n = parseInt(v.replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

function normalizeDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) return s.slice(0, 10).replace(/\//g, '-');
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [m, d, y] = s.slice(0, 10).split('/');
    return `${y}-${m}-${d}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'CSVの解析に失敗しました' }, { status: 400 });
    }

    const db = getDb();
    let bodyMetricsInserted = 0;
    let miDataInserted = 0;
    let skipped = 0;

    for (const row of parsed.data) {
      const date = normalizeDate(findColumn(row, COLUMN_MAP.date));
      if (!date) { skipped++; continue; }

      const weight = parseFloat_(findColumn(row, COLUMN_MAP.weight_kg));
      const bodyFat = parseFloat_(findColumn(row, COLUMN_MAP.body_fat_pct));
      const steps = parseInt_(findColumn(row, COLUMN_MAP.steps));
      let sleep = parseFloat_(findColumn(row, COLUMN_MAP.sleep_hours));
      if (sleep !== null && sleep > 24) sleep = sleep / 60;

      if (weight !== null || bodyFat !== null) {
        await db.execute({
          sql: 'INSERT INTO body_metrics (date, weight_kg, body_fat_pct) VALUES (?, ?, ?)',
          args: [date, weight, bodyFat],
        });
        bodyMetricsInserted++;
      }
      if (steps !== null || sleep !== null) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO mi_fitness_data (date, steps, sleep_hours) VALUES (?, ?, ?)',
          args: [date, steps, sleep],
        });
        miDataInserted++;
      }
    }

    return NextResponse.json({ message: 'インポート完了', bodyMetricsInserted, miDataInserted, skipped, total: parsed.data.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'インポートに失敗しました' }, { status: 500 });
  }
}
