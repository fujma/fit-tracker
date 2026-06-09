import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = 'SELECT * FROM mi_fitness_data WHERE 1=1';
    const args: (string | null)[] = [];
    if (from) { query += ' AND date >= ?'; args.push(from); }
    if (to) { query += ' AND date <= ?'; args.push(to); }
    query += ' ORDER BY date DESC';

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
    const { date, steps, sleep_hours } = body;

    if (!date) {
      return NextResponse.json({ error: '日付は必須です' }, { status: 400 });
    }

    await db.execute({
      sql: 'INSERT OR REPLACE INTO mi_fitness_data (date, steps, sleep_hours) VALUES (?, ?, ?)',
      args: [date, steps ?? null, sleep_hours ?? null],
    });

    const row = await db.execute({
      sql: 'SELECT * FROM mi_fitness_data WHERE date = ?',
      args: [date],
    });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
