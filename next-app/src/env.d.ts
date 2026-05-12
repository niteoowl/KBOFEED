interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2?: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_SECRET: string;
}
