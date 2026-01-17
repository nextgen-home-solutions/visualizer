declare module "better-sqlite3" {
  export interface Statement {
    run(params?: unknown): void;
    all(params?: unknown): unknown[];
    get(params?: unknown): unknown;
  }

  export interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }

  export interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
