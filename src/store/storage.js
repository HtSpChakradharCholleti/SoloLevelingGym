import { createMMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = createMMKV({ id: 'solo-leveling-gym' });

const MIGRATION_KEY = '__mmkv_migrated__';

/**
 * One-time migration from AsyncStorage to MMKV.
 * Reads all keys from AsyncStorage, writes them to MMKV,
 * then marks migration as complete so it never runs again.
 */
export async function migrateFromAsyncStorage() {
  // Already migrated — skip
  if (storage.getBoolean(MIGRATION_KEY)) {
    return false;
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length === 0) {
      // Nothing to migrate
      storage.set(MIGRATION_KEY, true);
      return false;
    }

    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (value != null) {
        storage.set(key, value);
      }
    }

    // Clean up AsyncStorage after successful migration
    await AsyncStorage.multiRemove(keys);
    storage.set(MIGRATION_KEY, true);
    console.log(`[MMKV] Migrated ${entries.length} key(s) from AsyncStorage`);
    return true;
  } catch (e) {
    console.error('[MMKV] Migration from AsyncStorage failed:', e);
    // Don't mark as migrated so it retries next launch
    return false;
  }
}
