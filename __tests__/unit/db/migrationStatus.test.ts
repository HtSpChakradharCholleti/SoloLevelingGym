import {
  getMigrationStatus,
  markMigrationAttempted,
  markMigrationSucceeded,
  markMigrationFailed,
  resetMigrationStatus,
  type MigrationStatus,
} from '../../../src/db/migrationStatus';
import { storage } from '../../../src/store/storage';

const MIGRATION_STATUS_KEY = '@solo_leveling_gym_migration_status';

describe('migrationStatus', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  afterAll(() => {
    storage.clearAll();
  });

  it('returns default status when nothing is stored', () => {
    expect(getMigrationStatus()).toEqual({
      attempted: false,
      lastAttemptedAt: null,
      succeeded: false,
      succeededAt: null,
      errorMessage: null,
      weightEntriesMigrated: 0,
      workoutSessionsMigrated: 0,
    });
  });

  it('returns defaults when stored JSON is corrupted', () => {
    storage.set(MIGRATION_STATUS_KEY, 'not-json');
    expect(getMigrationStatus()).toEqual({
      attempted: false,
      lastAttemptedAt: null,
      succeeded: false,
      succeededAt: null,
      errorMessage: null,
      weightEntriesMigrated: 0,
      workoutSessionsMigrated: 0,
    });
  });

  it('merges partial stored status with defaults', () => {
    storage.set(MIGRATION_STATUS_KEY, JSON.stringify({ attempted: true }));
    const status = getMigrationStatus();
    expect(status.attempted).toBe(true);
    expect(status.succeeded).toBe(false);
  });

  it('markMigrationAttempted records timestamp and clears errors', () => {
    markMigrationFailed(new Error('previous failure'));
    markMigrationAttempted();
    const status = getMigrationStatus();
    expect(status.attempted).toBe(true);
    expect(status.errorMessage).toBeNull();
    expect(status.lastAttemptedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('markMigrationSucceeded stores counts and success timestamp', () => {
    markMigrationSucceeded(3, 7);
    const status = getMigrationStatus();
    expect(status.attempted).toBe(true);
    expect(status.succeeded).toBe(true);
    expect(status.weightEntriesMigrated).toBe(3);
    expect(status.workoutSessionsMigrated).toBe(7);
    expect(status.succeededAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(status.errorMessage).toBeNull();
  });

  it('markMigrationFailed preserves existing success state', () => {
    markMigrationSucceeded(2, 4);
    markMigrationFailed(new Error('migration crashed'));
    const status = getMigrationStatus();
    expect(status.attempted).toBe(true);
    expect(status.succeeded).toBe(false);
    expect(status.errorMessage).toBe('migration crashed');
    // Previously successful counts are kept as historical record.
    expect(status.weightEntriesMigrated).toBe(2);
    expect(status.workoutSessionsMigrated).toBe(4);
  });

  it('markMigrationFailed handles non-Error values', () => {
    markMigrationFailed('string error');
    expect(getMigrationStatus().errorMessage).toBe('string error');
  });

  it('resetMigrationStatus removes the stored key', () => {
    markMigrationSucceeded(1, 1);
    resetMigrationStatus();
    expect(storage.contains(MIGRATION_STATUS_KEY)).toBe(false);
    expect(getMigrationStatus().succeeded).toBe(false);
  });
});
