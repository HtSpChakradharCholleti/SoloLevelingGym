declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_OTA_URL: string;
    EXPO_PUBLIC_CHANNEL: string;
    EXPO_PUBLIC_S3_BUCKET: string;
  }
}
