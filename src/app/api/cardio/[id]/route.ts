import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initSchema();
    const db = getDb();
    const body = await req.json();
    const { date, type, duration_min, distance_km, calories, speed_kmh, incline_pct, notes } = body;
    await db.execute({
      sql: 'UPDATE cardio SET date=?, type=?, duration_min=?, distance_km=?, calories=?, speed_kmh=?, incline_pct=?, notes=? WHERE id=?',
      args: [date, type, duration_min ?? null, distance_km ?? null, calories ?? null, speed_kmh ?? null, incline_pct ?? null, notes ?? null, Number(params.id)],
    });
    const row = await db.execute({ sql: 'SELECT * FROM cardio WHERE id=?', args: [Number(params.id)] });
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
    await db.execute({ sql: 'DELETE FROM cardio WHERE id=?', args: [Number(params.id)] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
