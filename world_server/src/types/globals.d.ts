declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STORJ_BUCKET: string;
      STORJ_ACCESS_KEY: string;
      STORJ_SECRET_KEY: string;
      STORJ_ENDPOINT: string;
    }
  }
}

export {};
