import { DatabaseSync } from "node:sqlite"
import type { SQLInputValue } from "node:sqlite"

type SqliteParams = SQLInputValue[]

export class NodeSqliteDatabase {
  private readonly client: DatabaseSync

  constructor(path: string) {
    this.client = new DatabaseSync(path)
  }

  prepare(sql: string) {
    const statement = this.client.prepare(sql)

    return {
      run: (...params: SqliteParams) => {
        const result = statement.run(...params)
        return {
          changes: Number(result.changes),
          lastInsertRowid: Number(result.lastInsertRowid),
        }
      },
      all: (...params: SqliteParams) => statement.all(...params),
      get: (...params: SqliteParams) => statement.get(...params),
      raw: () => ({
        all: (...params: SqliteParams) => {
          statement.setReturnArrays(true)
          return statement.all(...params)
        },
        get: (...params: SqliteParams) => {
          statement.setReturnArrays(true)
          return statement.get(...params)
        },
      }),
    }
  }

  exec(sql: string) {
    return this.client.exec(sql)
  }

  pragma(sql: string) {
    return this.client.exec(`PRAGMA ${sql}`)
  }

  transaction<T>(callback: (transaction: unknown) => T) {
    const run = (mode: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE") => {
      this.client.exec(`BEGIN ${mode}`)
      try {
        const result = callback(this)
        this.client.exec("COMMIT")
        return result
      } catch (error) {
        this.client.exec("ROLLBACK")
        throw error
      }
    }

    return {
      deferred: () => run("DEFERRED"),
      immediate: () => run("IMMEDIATE"),
      exclusive: () => run("EXCLUSIVE"),
    }
  }

  close() {
    this.client.close()
  }
}
