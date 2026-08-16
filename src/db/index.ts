import { open } from '@op-engineering/op-sqlite';
import { storage } from '../store/storage';
import {
  getMigrationStatus,
  markMigrationAttempted,
  markMigrationSucceeded,
  markMigrationFailed,
} from './migrationStatus';

const DB_NAME = 'sololevelinggym.db';
const MIGRATION_FLAG_KEY = '@solo_leveling_gym_history_migrated_to_sql';

export { getMigrationStatus } from './migrationStatus';

export const db = open({
  name: DB_NAME,
});

export type WorkoutSession = {
  id: string;
  startedAt: number;
  completedAt: number | null;
  durationSeconds: number;
  totalXP: number;
  exercisesJson: string;
};

export type WeightEntry = {
  id: string;
  recordedAt: number;
  weightKg: number;
  notes: string | null;
};

export async function migrateDatabase(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      total_xp INTEGER NOT NULL DEFAULT 0,
      exercises_json TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at
    ON workout_sessions(started_at DESC);
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY NOT NULL,
      recorded_at INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      notes TEXT
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_weight_entries_recorded_at
    ON weight_entries(recorded_at DESC);
  `);
}

type LegacyWeightEntry = {
  date: string;
  weight: number;
  unit?: string;
};

type LegacyWorkoutEntry = {
  id?: string;
  date?: string;
  completedAt?: string | number;
  startedAt?: string | number;
  duration?: number;
  durationSeconds?: number;
  totalXP?: number;
  exercises?: unknown[];
};

function parseISODateToTimestamp(dateString: string | undefined): number {
  if (!dateString) return Date.now();
  const parsed = Date.parse(dateString);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function kgFromEntry(entry: LegacyWeightEntry): number {
  const weight = Number(entry.weight);
  if (Number.isNaN(weight)) return 0;
  return entry.unit === 'lb' ? weight * 0.45359237 : weight;
}

export async function migrateHistoryFromMMKV(): Promise<boolean> {
  if (storage.getBoolean(MIGRATION_FLAG_KEY)) {
    return false;
  }

  markMigrationAttempted();

  const saved = storage.getString('@solo_leveling_gym');
  if (!saved) {
    markMigrationSucceeded(0, 0);
    storage.set(MIGRATION_FLAG_KEY, true);
    return false;
  }

  let state: Record<string, unknown>;
  try {
    state = JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to parse existing MMKV state for migration', e);
    markMigrationFailed(e);
    storage.set(MIGRATION_FLAG_KEY, true);
    return false;
  }

  const weightHistory = Array.isArray(state.weightHistory) ? state.weightHistory as LegacyWeightEntry[] : [];
  const workoutHistory = Array.isArray(state.workoutHistory) ? state.workoutHistory as LegacyWorkoutEntry[] : [];

  if (weightHistory.length === 0 && workoutHistory.length === 0) {
    markMigrationSucceeded(0, 0);
    storage.set(MIGRATION_FLAG_KEY, true);
    return false;
  }

  await db.execute('BEGIN TRANSACTION');

  try {
    for (const entry of weightHistory) {
      await db.execute(
        `
          INSERT OR IGNORE INTO weight_entries (id, recorded_at, weight_kg, notes)
          VALUES (?, ?, ?, ?)
        `,
        [
          `${entry.date || Date.now()}`,
          parseISODateToTimestamp(entry.date),
          kgFromEntry(entry),
          null,
        ],
      );
    }

    for (const entry of workoutHistory) {
      const id = entry.id || `${entry.date || Date.now()}`;
      const startedAt = typeof entry.startedAt === 'number'
        ? entry.startedAt
        : parseISODateToTimestamp(entry.startedAt || entry.date);
      const completedAt = typeof entry.completedAt === 'number'
        ? entry.completedAt
        : entry.completedAt
          ? parseISODateToTimestamp(entry.completedAt)
          : null;
      const durationSeconds = typeof entry.durationSeconds === 'number'
        ? entry.durationSeconds
        : typeof entry.duration === 'number'
          ? entry.duration
          : 0;
      const totalXP = typeof entry.totalXP === 'number' ? entry.totalXP : 0;

      await db.execute(
        `
          INSERT OR IGNORE INTO workout_sessions (id, started_at, completed_at, duration_seconds, total_xp, exercises_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          startedAt,
          completedAt,
          durationSeconds,
          totalXP,
          JSON.stringify(Array.isArray(entry.exercises) ? entry.exercises : []),
        ],
      );
    }

    await db.execute('COMMIT');
    markMigrationSucceeded(weightHistory.length, workoutHistory.length);
    storage.set(MIGRATION_FLAG_KEY, true);
    return true;
  } catch (e) {
    await db.execute('ROLLBACK').catch(() => {});
    markMigrationFailed(e);
    console.error('History migration failed', e);
    throw e;
  }
}

export function insertWorkoutSession(session: WorkoutSession): Promise<void> {
  return db.execute(
    `
      INSERT INTO workout_sessions (id, started_at, completed_at, duration_seconds, total_xp, exercises_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      session.id,
      session.startedAt,
      session.completedAt,
      session.durationSeconds,
      session.totalXP,
      session.exercisesJson,
    ],
  ).then(() => undefined);
}

export async function getWorkoutSessions(options: { limit?: number; offset?: number } = {}): Promise<WorkoutSession[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const result = await db.execute(
    `
      SELECT id, started_at, completed_at, duration_seconds, total_xp, exercises_json
      FROM workout_sessions
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `,
    [limit, offset],
  );

  return ((result.rows as unknown as { _array?: Record<string, unknown>[] })?._array ?? []).map((row) => ({
    id: String(row.id),
    startedAt: Number(row.started_at),
    completedAt: row.completed_at == null ? null : Number(row.completed_at),
    durationSeconds: Number(row.duration_seconds),
    totalXP: Number(row.total_xp),
    exercisesJson: String(row.exercises_json),
  }));
}

export function insertWeightEntry(entry: WeightEntry): Promise<void> {
  return db.execute(
    `
      INSERT INTO weight_entries (id, recorded_at, weight_kg, notes)
      VALUES (?, ?, ?, ?)
    `,
    [entry.id, entry.recordedAt, entry.weightKg, entry.notes],
  ).then(() => undefined);
}

export async function getWeightEntries(options: { limit?: number; offset?: number } = {}): Promise<WeightEntry[]> {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  const result = await db.execute(
    `
      SELECT id, recorded_at, weight_kg, notes
      FROM weight_entries
      ORDER BY recorded_at DESC
      LIMIT ? OFFSET ?
    `,
    [limit, offset],
  );

  return ((result.rows as unknown as { _array?: Record<string, unknown>[] })?._array ?? []).map((row) => ({
    id: String(row.id),
    recordedAt: Number(row.recorded_at),
    weightKg: Number(row.weight_kg),
    notes: row.notes == null ? null : String(row.notes),
  }));
}

export function deleteWeightEntry(id: string): Promise<void> {
  return db.execute('DELETE FROM weight_entries WHERE id = ?', [id]).then(() => undefined);
}

export function deleteWorkoutSession(id: string): Promise<void> {
  return db.execute('DELETE FROM workout_sessions WHERE id = ?', [id]).then(() => undefined);
}
