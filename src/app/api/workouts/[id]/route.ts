import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initSchema();
    const db = getDb();
    const body = await req.json();
    const { date, exercise_name, weight_kg, sets, reps, notes } = body;
    await db.execute({
      sql: 'UPDATE workouts SET date=?, exercise_name=?, weight_kg=?, sets=?, reps=?, notes=? WHERE id=?',
      args: [date, exercise_name, weight_kg ?? null, sets ?? null, reps ?? null, notes ?? null, Number(params.id)],
    });
    const row = await db.execute({ sql: 'SELECT * FROM workouts WHERE id=?', args: [Number(params.id)] });
    return NextResponse.json(row.rows[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initSchema();
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM workouts WHERE id=?', args: [Number(params.id)] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
