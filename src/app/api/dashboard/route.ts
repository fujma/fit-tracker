import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema } from '@/lib/db';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    const from = days === 0
      ? '2000-01-01'
      : format(subDays(new Date(), days), 'yyyy-MM-dd');

    const [bodyMetrics, miData, workoutSummary, cardioSummary, exerciseNames] = await Promise.all([
      db.execute({ sql: 'SELECT date, weight_kg, body_fat_pct FROM body_metrics WHERE date >= ? ORDER BY date ASC', args: [from] }),
      db.execute({ sql: 'SELECT date, steps, sleep_hours FROM mi_fitness_data WHERE date >= ? ORDER BY date ASC', args: [from] }),
      db.execute({ sql: `SELECT date, exercise_name, MAX(weight_kg) as max_weight, SUM(sets) as total_sets FROM workouts WHERE date >= ? GROUP BY date, exercise_name ORDER BY date ASC`, args: [from] }),
      db.execute({ sql: 'SELECT date, type, duration_min, distance_km, calories FROM cardio WHERE date >= ? ORDER BY date ASC', args: [from] }),
      db.execute({ sql: 'SELECT DISTINCT exercise_name FROM workouts ORDER BY exercise_name', args: [] }),
    ]);

    return NextResponse.json({
      bodyMetrics: bodyMetrics.rows,
      miData: miData.rows,
      workoutSummary: workoutSummary.rows,
      cardioSummary: cardioSummary.rows,
      exerciseNames: exerciseNames.rows.map((r) => r.exercise_name as string),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
