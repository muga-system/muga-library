export type RunResult = {
  changes: number
  lastInsertRowid: number
}

export type Statement = {
  run: (...params: unknown[]) => RunResult
  all: (...params: unknown[]) => unknown[]
  get: (...params: unknown[]) => unknown
  raw: () => Statement
}

export type Options = Record<string, unknown>

export type Database = {
  prepare: (sql: string) => Statement
  exec: (sql: string) => unknown
  pragma: (sql: string) => unknown
  transaction: (callback: (value: unknown) => unknown) => {
    deferred: () => unknown
    immediate: () => unknown
    exclusive: () => unknown
  }
}

export default class BetterSqlite3CompatibilityShim {
  constructor(..._args: unknown[])
}
