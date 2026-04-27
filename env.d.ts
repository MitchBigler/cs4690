declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_DB_URI: string;
    SESSION_SECRET: string;
    PORT?: string;
  }
}