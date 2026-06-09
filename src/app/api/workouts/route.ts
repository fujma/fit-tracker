import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const exercise = searchParams.get('exercise');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = 'SELECT * FROM workouts WHERE 1=1';
    const args: (string | number | null)[] = [];

    if (exercise) { query += ' AND exercise_name = ?'; args.push(exercise); }
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
    const { date, exercise_name, weight_kg, sets, reps, notes } = body;

    if (!date || !exercise_name) {
      return NextResponse.json({ error: '日付と種目名は必須です' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO workouts (date, exercise_name, weight_kg, sets, reps, notes) VALUES (?, ?, ?, ?, ?, ?)',
      args: [date, exercise_name, weight_kg ?? null, sets ?? null, reps ?? null, notes ?? null],
    });

    const row = await db.execute({
      sql: 'SELECT * FROM workouts WHERE id = ?',
      args: [result.lastInsertRowid],
    });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
