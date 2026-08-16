import { storage } from '../store/storage';

const MIGRATION_STATUS_KEY = '@solo_leveling_gym_migration_status';

export type MigrationStatus = {
  /** Whether the migration has ever been attempted. */
  attempted: boolean;
  /** ISO timestamp of the last attempt, or null if never attempted. */
  lastAttemptedAt: string | null;
  /** Whether the last attempt succeeded. */
  succeeded: boolean;
  /** ISO timestamp of the last successful migration, or null if never succeeded. */
  succeededAt: string | null;
  /** Error message from the last failed attempt, or null if never failed. */
  errorMessage: string | null;
  /** Number of weight entries migrated in the last successful run. */
  weightEntriesMigrated: number;
  /** Number of workout sessions migrated in the last successful run. */
  workoutSessionsMigrated: number;
};

const defaultStatus: MigrationStatus = {
  attempted: false,
  lastAttemptedAt: null,
  succeeded: false,
  succeededAt: null,
  errorMessage: null,
  weightEntriesMigrated: 0,
  workoutSessionsMigrated: 0,
};

export function getMigrationStatus(): MigrationStatus {
  const raw = storage.getString(MIGRATION_STATUS_KEY);
  if (!raw) return { ...defaultStatus };

  try {
    const parsed = JSON.parse(raw) as Partial<MigrationStatus>;
    return { ...defaultStatus, ...parsed };
  } catch {
    return { ...defaultStatus };
  }
}

function saveMigrationStatus(status: MigrationStatus): void {
  storage.set(MIGRATION_STATUS_KEY, JSON.stringify(status));
}

export function markMigrationAttempted(): void {
  const current = getMigrationStatus();
  saveMigrationStatus({
    ...current,
    attempted: true,
    lastAttemptedAt: new Date().toISOString(),
    errorMessage: null,
  });
}

export function markMigrationSucceeded(weightEntries: number, workoutSessions: number): void {
  const now = new Date().toISOString();
  saveMigrationStatus({
    attempted: true,
    lastAttemptedAt: now,
    succeeded: true,
    succeededAt: now,
    errorMessage: null,
    weightEntriesMigrated: weightEntries,
    workoutSessionsMigrated: workoutSessions,
  });
}

export function markMigrationFailed(error: unknown): void {
  const current = getMigrationStatus();
  const message = error instanceof Error ? error.message : String(error);
  saveMigrationStatus({
    ...current,
    attempted: true,
    lastAttemptedAt: new Date().toISOString(),
    succeeded: false,
    errorMessage: message,
  });
}

export function resetMigrationStatus(): void {
  storage.remove(MIGRATION_STATUS_KEY);
}
