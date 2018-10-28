import {
  DbDriver,
  ErrorCallback,
  QueryCallback,
  ResultSet,
  Transaction
} from '../../../src/types'

export class TestDriver implements DbDriver {
  sql: string[] = []
  isQuery: boolean = false

  async init(): Promise<void> {
    await true
  }

  transaction(
    scope: (tx: Transaction) => void,
    _error: ((error: any) => void),
    success: (() => void)
  ): void {
    scope({
      execSql: (sql, _args, resolve) => {
        this.sql.push(sql)
        this.isQuery = false
        if (resolve) {
          resolve({})
        }

        if (success) {
          success()
        }
      }
    })
  }

  close(): Promise<void> {
    return new Promise(resolve => {
      resolve()
    })
  }

  query(
    sql: string,
    _args: any[],
    _error: ErrorCallback,
    success: QueryCallback
  ): void {
    this.sql.push(sql)
    this.isQuery = true

    if (sql.indexOf(' as count FROM ') > -1) {
      success([{ count: 1 }])
    } else {
      success([{}])
    }
  }

  getQueryResult(results: any[]): ResultSet {
    return {
      insertId: 1,
      rows: {
        item: index => results[index],
        items: () => results,
        length: results.length
      },
      rowsAffected: results.length
    }
  }

  reset() {
    this.sql = []
  }
}
