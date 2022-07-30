declare namespace NodeJS {
    export interface ProcessEnv {
        PORT: number;
        DB_URL: string;
        DB_NAME: string;
    }
}
