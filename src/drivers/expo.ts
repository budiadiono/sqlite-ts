import { SQLite } from 'expo'
import {
  DbDriver,
  ErrorCallback,
  QueryCallback,
  ResultSet,
  Transaction
} from '../types'

export class ExpoSQLiteDriver implements DbDriver {
  db: SQLite.Database
  constructor(db: SQLite.Database) {
    this.db = db
  }

  transaction(
    scope: (trx: Transaction) => void,
    error?: (error: any) => void,
    success?: () => void
  ) {
    this.db.transaction(
      trx =>
        scope({
          execSql: (sql, args, resolve, reject) => {
            trx.executeSql(
              sql,
              args,
              (_, res) => {
                if (resolve) {
                  resolve(res)
                }
              },
              err => {
                if (reject) {
                  reject(err)
                }
              }
            )
          }
        }),
      error,
      success
    )
  }

  query(
    sql: string,
    args: any[],
    error: ErrorCallback,
    success: QueryCallback
  ) {
    this.db.transaction(trx => {
      trx.executeSql(
        sql,
        args,
        (_, r) => {
          success(r)
        },
        error
      )
    })
  }

  getQueryResult(result: SQLite.ResultSet): ResultSet {
    const {
      insertId,
      // @ts-ignore
      rowsAffected,
      rows: { _array, item, length }
    } = result
    return {
      insertId,
      rowsAffected,
      rows: {
        length,
        item,
        items: () => _array
      }
    }
  }

  close(): Promise<void> {
    return new Promise(resolve => resolve())
  }
}
