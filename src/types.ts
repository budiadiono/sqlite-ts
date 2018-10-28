import { Db } from './db'

export type KeyVal<V = string> = { [key: string]: V }
export type ValueOf<T> = T[keyof T]

export type PrimaryKeyTypes = 'INTEGER' | 'NVARCHAR' | 'CHAR'
export type ColumnTypes =
  | PrimaryKeyTypes
  | 'BOOLEAN'
  | 'DECIMAL'
  | 'DATETIME'
  | 'MONEY'

export interface ConstructorClass<T> extends Function {
  new (): T
}

export interface TableInfo<T> {
  db: Db<T>
  name: string
  columns: { [key: string]: { primary: boolean } & ColumnInfo }
  descriptor: {}
}

export interface ColumnInfo {
  type: ColumnTypes
  size: number
}

export type QueryCallback = (result: any) => void
export type TransactionCallback = (
  transaction: Transaction,
  resultSet: any
) => void
export type SuccessCallback = (resultSet?: any) => any
export type ErrorCallback = (error: any) => any

export interface Transaction {
  execSql(
    sql: string,
    args?: any[],
    success?: SuccessCallback,
    error?: ErrorCallback
  ): void
}

export interface ResultSet {
  insertId: number
  rowsAffected: number
  rows: {
    length: number
    item(index: number): any
    items(): any[]
  }
}

export interface DbDriver {
  init?: () => Promise<void>
  close: () => Promise<void>

  transaction(
    scope: (tx: Transaction) => void,
    error?: (error: any) => void,
    success?: () => void
  ): void

  query(
    sql: string,
    args: any[],
    error: ErrorCallback,
    success: QueryCallback
  ): void

  getQueryResult(resultSet: any): ResultSet
}
