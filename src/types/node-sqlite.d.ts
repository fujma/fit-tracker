declare module 'node:sqlite' {
  interface StatementResultingChanges {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface StatementSync {
    all(params?: Record<string, unknown>): unknown[];
    get(params?: Record<string, unknown>): unknown;
    run(params?: Record<string, unknown>): StatementResultingChanges;
  }

  class DatabaseSync {
    constructor(path: string, options?: { open?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
