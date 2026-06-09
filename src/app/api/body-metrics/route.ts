import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = 'SELECT * FROM body_metrics WHERE 1=1';
    const args: (string | null)[] = [];

    if (from) { query += ' AND date >= ?'; args.push(from); }
    if (to) { query += ' AND date <= ?'; args.push(to); }
    query += ' ORDER BY date ASC';

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
    const { date, weight_kg, body_fat_pct } = body;

    if (!date) {
      return NextResponse.json({ error: '日付は必須です' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO body_metrics (date, weight_kg, body_fat_pct) VALUES (?, ?, ?)',
      args: [date, weight_kg ?? null, body_fat_pct ?? null],
    });

    const row = await db.execute({
      sql: 'SELECT * FROM body_metrics WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
