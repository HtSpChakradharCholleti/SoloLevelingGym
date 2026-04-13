import { expo } from '@hot-updater/expo';
import { defineConfig } from 'hot-updater';
import type { Bundle } from '@hot-updater/core';
import type { DatabasePlugin, StoragePlugin } from '@hot-updater/plugin-core';
import fs from 'fs/promises';
import path from 'path';

// config({ path: '.env.hotupdater' });

// Custom plugin that outputs JSON
const jsonOutputDatabase = (): DatabasePlugin => {
  let pendingBundle: Bundle | null = null;

  return {
    name: 'json-output',

    async getChannels() {
      return [];
    },

    async getBundleById() {
      return null;
    },

    async getBundles() {
      return {
        data: [],
        pagination: {
          total: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: 1,
          totalPages: 0,
        },
      };
    },

    async updateBundle() {
      // No-op
    },

    async appendBundle(bundle: Bundle) {
      pendingBundle = bundle;
    },

    async commitBundle() {
      if (!pendingBundle) return;

      // Output to JSON file
      const outputPath = path.join(
        process.cwd(),
        `.hot-updater/output/bundle/${pendingBundle.platform}.json`,
      );
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(pendingBundle, null, 2));

      console.log(`\n✅ Bundle metadata written to: ${outputPath}`);
      pendingBundle = null;
    },

    async deleteBundle() {
      // No-op
    },
  };
};

// Dummy storage plugin (doesn't actually upload)
const localStorage = (): StoragePlugin => ({
  name: 'local',
  async upload(bundleId: string, bundlePath: string) {
    console.log(`Bundle ready at: ${bundlePath}`);
    return {
      storageUri: `file://${bundlePath}`,
    };
  },
  // @ts-ignore
  async onUnmount() {},
});

export default defineConfig({
  build: expo(),
  storage: localStorage,
  database: jsonOutputDatabase,
  updateStrategy: 'appVersion', // or "fingerprint"
  signing: { enabled: false, privateKeyPath: './keys/private-key.pem' },
});
