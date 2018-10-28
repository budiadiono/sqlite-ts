import Sqlite3 from 'sqlite3'
import {
  DbDriver,
  ErrorCallback,
  QueryCallback,
  ResultSet,
  Transaction
} from '../types'

interface SQLite3ResultSet {
  changes: number
  lastID: number
  results: any[]
  rowCount: number
}

export class SQLite3Driver implements DbDriver {
  db: Sqlite3.Database

  constructor(db: Sqlite3.Database) {
    this.db = db
  }

  transaction(
    scope: (tx: Transaction) => void,
    error?: ((error: any) => void),
    success?: (() => void)
  ): void {
    this.db.serialize(() => {
      this.db.run('BEGIN TRANSACTION')

      scope({
        execSql: (sql, args, resolve, reject) => {
          this.db
            .prepare(sql)
            .run(args, function(err) {
              if (err) {
                if (reject) {
                  reject(err)
                }

                return
              }

              if (resolve) {
                const result: SQLite3ResultSet = {
                  changes: this.changes,
                  lastID: this.lastID,
                  results: [],
                  rowCount: 0
                }

                resolve(result)
              }
            })
            .finalize()
        }
      })

      this.db.run('COMMIT TRANSACTION', [], err => {
        if (err) {
          if (error) {
            error(err)
          }
          return
        }

        if (success) {
          success()
        }
      })
    })
  }

  query(
    sql: string,
    args: any[],
    error: ErrorCallback,
    success: QueryCallback
  ): void {
    this.db.all(sql, args, (err, rows) => {
      if (err) {
        // @ts-ignore
        error(null, err)
        return
      }
      const result: SQLite3ResultSet = {
        changes: 0,
        lastID: 0,
        results: rows,
        rowCount: rows.length
      }

      success(result)
    })
  }

  getQueryResult(result: SQLite3ResultSet): ResultSet {
    return {
      insertId: result.lastID,
      rows: {
        item: index => result.results[index],
        items: () => result.results,
        length: result.rowCount
      },
      rowsAffected: result.changes
    }
  }

  close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.close(error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
