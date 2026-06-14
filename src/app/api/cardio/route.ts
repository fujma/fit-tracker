import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = 'SELECT * FROM cardio WHERE 1=1';
    const args: (string | null)[] = [];

    if (from) { query += ' AND date >= ?'; args.push(from); }
    if (to) { query += ' AND date <= ?'; args.push(to); }
    query += ' ORDER BY date DESC, id DESC';

    const result = await db.execute({ sql: query, args });
    return NextResponse.json(result.rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const body = await req.json();
    const { date, type, duration_min, distance_km, calories, speed_kmh, incline_pct, notes } = body;

    if (!date || !type) {
      return NextResponse.json({ error: '日付と種目は必須です' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO cardio (date, type, duration_min, distance_km, calories, speed_kmh, incline_pct, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [date, type, duration_min ?? null, distance_km ?? null, calories ?? null, speed_kmh ?? null, incline_pct ?? null, notes ?? null],
    });

    const row = await db.execute({
      sql: 'SELECT * FROM cardio WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
