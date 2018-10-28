import { Table } from '../../table'
import { KeyVal, TableInfo, ValueOf } from '../../types'
import { buildJoinSql } from './sql'
import { JoinStmt } from './types'

export type JoinObject = { [key in string]: JoinCondition<any, any> } & {
  sqls: JoinStmt[]
}

interface Result {
  sql: string
  tables: KeyVal<any>
}

export class JoinCondition<TRoot, T> {
  static buildSql<T, TDb, Q = KeyVal<TDb>>(
    tableInfo: TableInfo<T>,
    selector: (tbl: TDb) => Q,
    clause: (
      self: JoinCondition<TDb, T> & T,
      other: {
        [key in keyof Q]: JoinCondition<TDb, ValueOf<Q[key]>> & ValueOf<Q[key]>
      }
    ) => void
  ): Result {
    // get selected tables to be joined
    const tables = selector(tableInfo.db.tables as any)

    // prepare join conditions
    const condObj = this.buildConditionObject(tableInfo, tables)

    // invoke join clause against condition object
    clause(condObj.self as any, condObj as any)

    return {
      tables,
      sql: buildJoinSql(tables, condObj)
    }
  }

  static buildConditionObject(
    tableInfo: TableInfo<any>,
    tables: KeyVal<any>
  ): JoinObject {
    const obj = {}
    const stmts: JoinStmt[] = []

    const pushSql = (stmt: JoinStmt) => {
      stmts.push(stmt)
    }

    tables.self = {
      info: tableInfo
    }

    // tslint:disable-next-line:no-string-literal
    obj['self'] = new JoinCondition(tables, 'self', pushSql)

    for (const k of Object.keys(tables)) {
      obj[k] = new JoinCondition(tables, k, pushSql)
    }

    return { ...obj, sqls: stmts as any }
  }

  private __alias: string
  private __push: (sql: JoinStmt) => void

  constructor(
    root: { [x: string]: Table<any, any, TRoot> },
    name: string,
    push: (sql: JoinStmt) => void
  ) {
    // @ts-ignore
    const info = root[name].info

    for (const k of Object.keys(info.columns)) {
      this[k] = name + '.' + info.descriptor[k]
    }

    this.__alias = name
    this.__push = push
  }

  equal(p: { [key in keyof Partial<T>]: any }) {
    for (const k of Object.keys(p)) {
      const val = (p[k] as string).split('.')

      this.__push({
        left: {
          alias: this.__alias,
          column: k
        },
        right: {
          alias: val[0],
          column: val[1]
        }
      })
    }

    return this
  }
}
