import {
  ResultSet as SQLiteResultSet,
  SQLiteDatabase
} from 'react-native-sqlite-storage'
import {
  DbDriver,
  ErrorCallback,
  QueryCallback,
  ResultSet,
  Transaction
} from '../types'

export class ReactNativeSQLiteStorageDriver implements DbDriver {
  db: SQLiteDatabase
  constructor(db: SQLiteDatabase) {
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
    this.db.executeSql(
      sql,
      args,
      r => {
        success(r)
      },
      error
    )
  }

  getQueryResult(result: SQLiteResultSet): ResultSet {
    const {
      insertId,
      rowsAffected,
      rows: {
        item,
        length,
        // @ts-ignore
        raw
      }
    } = result
    return {
      insertId,
      rowsAffected,
      rows: {
        item,
        length,
        items: raw
      }
    }
  }

  close(): Promise<void> {    
    return new Promise<void>((resolve, reject) => {
      this.db
        .close()
        .then(resolve)
        .catch(reject)
    })
  }
}
