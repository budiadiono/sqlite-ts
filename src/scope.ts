import { Db, Tables } from './db'
import { ResultSet, Transaction } from './types'

export class Scope<T> implements TransactionScope<T> {
  db: Db<T>
  transaction: Transaction
  tables: Tables<T>

  constructor(db: Db<T>, transaction: Transaction) {
    this.db = db
    this.transaction = transaction
    this.exec = this.exec.bind(this)
    this.tables = db.tables
  }

  exec(sql: any, args?: any[]): Promise<ResultSet>
  exec(dialect: SqlDialect): Promise<ResultSet>
  exec(param: string | SqlDialect, args?: any[]): Promise<ResultSet> {
    const sql = typeof param === 'string' ? param : param.sql
    return new Promise<ResultSet>((resolve, reject) => {
      this.transaction.execSql(
        sql,
        args,
        res => {
          resolve(this.db.driver.getQueryResult(res))
        },
        reject
      )
    })
  }
}

interface SqlDialect {
  sql: string
}

export interface TransactionScope<T> {
  tables: Tables<T>
  exec(sql: string, args?: any[]): Promise<ResultSet>
  exec(dialect: SqlDialect): Promise<ResultSet>
}
