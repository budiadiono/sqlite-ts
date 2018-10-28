import { KeyVal, ResultSet, TableInfo, ValueOf } from '../types'
import { Utils } from '../utils'
import { DialectBase, DialectKind, IDialectBase } from './base'
import { IDialectWhere, ReadDialect } from './base/read'
import { WhereDialect } from './base/where'
import { JoinCondition, JoinMapper } from './join'

export class Dialect<T, TDb> extends DialectBase<T, any> {
  constructor(info: TableInfo<T>) {
    super(info)
    this.update = this.update.bind(this)
  }

  create(): IDialectBase<ResultSet> {
    const { name, columns } = this.info

    const cols = Object.keys(columns).map(key => {
      const column = columns[key]
      const colType = Utils.getRealColumnType(key, column)
      const colPrimary = column.primary ? ' PRIMARY KEY' : ''
      return `${Utils.quote(key)} ${colType}${colPrimary}`
    })

    this.sql = `CREATE TABLE IF NOT EXISTS ${Utils.quote(name)} (${cols.join(
      ', '
    )})`

    this.kind = DialectKind.WRITE

    return this
  }

  drop(): IDialectBase<ResultSet> {
    this.sql = `DROP TABLE IF EXISTS ${Utils.quote(this.info.name)}`
    this.kind = DialectKind.WRITE
    return this
  }

  select(fields?: ((k: T) => void) | '*'): ReadDialect<T, T[]> {
    this.kind = DialectKind.READ
    return this.__select<T[]>(fields)
  }

  single(fields?: ((k: T) => void) | '*'): ReadDialect<T, T> {
    this.kind = DialectKind.SINGLE
    return this.__select<T>(fields)
  }

  join<Q = KeyVal<TDb>>(
    selector: (tbl: TDb) => Q,
    clause: (
      self: JoinCondition<TDb, T> & T,
      other: {
        [key in keyof Q]: JoinCondition<TDb, ValueOf<Q[key]>> & ValueOf<Q[key]>
      }
    ) => void
  ): JoinMapper<T, TDb, Q> {
    const result = JoinCondition.buildSql(this.info, selector, clause)
    return new JoinMapper<T, TDb, Q>(this.info, result.tables, result.sql)
  }

  count(): IDialectWhere<T, number> {
    this.sql = `SELECT COUNT(*) as count FROM ${Utils.quote(this.info.name)}`
    return new ReadDialect(this.info, this.sql, DialectKind.COUNT)
  }

  any(): IDialectWhere<T, boolean> {
    this.sql = `SELECT COUNT(*) as count FROM ${Utils.quote(this.info.name)}`
    return new ReadDialect(this.info, this.sql, DialectKind.ANY)
  }

  insert(set: Partial<T>, upsert?: boolean): IDialectBase<ResultSet>
  insert(sets: Array<Partial<T>>): IDialectBase<ResultSet>
  insert(
    set: Partial<T> | Array<Partial<T>>,
    upsert?: boolean
  ): IDialectBase<ResultSet> {
    this.kind = DialectKind.WRITE
    if (set instanceof Array) {
      return this.__insertMany(set)
    }

    return this.__insert(set, upsert)
  }

  upsert(set: Partial<T>): IDialectBase<ResultSet> {
    return this.insert(set, true)
  }

  update(set: Partial<T>): WhereDialect<T, ResultSet> {
    const sql = `UPDATE ${Utils.quote(this.info.name)} SET ${Object.keys(set)
      .map(
        k =>
          `${Utils.quote(k)} = ${Utils.asValue(
            this.info.columns[k].type,
            (set as any)[k]
          )}`
      )
      .join(', ')}`

    this.sql = sql
    return new WhereDialect(this.info, this.sql, DialectKind.WRITE)
  }

  delete(): WhereDialect<T, ResultSet> {
    this.sql = `DELETE FROM ${Utils.quote(this.info.name)}`
    return new WhereDialect(this.info, this.sql, DialectKind.WRITE)
  }

  protected __select<R>(fields?: ((k: T) => void) | '*'): ReadDialect<T, R> {
    let sql: string
    if (!fields || fields === '*') {
      sql = this._buildSelectFields(Object.keys(this.info.columns))
    } else {
      sql = this._select(fields)
    }

    this.sql = `SELECT ${sql} FROM ${Utils.quote(this.info.name)}`

    return new ReadDialect(this.info, this.sql, this.kind)
  }

  protected __insert(
    set: Partial<T> | Array<Partial<T>>,
    upsert?: boolean
  ): IDialectBase<ResultSet> {
    const fields = []
    const values = []

    for (const key of Object.keys(set)) {
      fields.push(key)

      values.push(
        Utils.asValue(this.info.columns[key].type, (set as any)[key] as string)
      )
    }

    const sqlUpsert = upsert ? ' OR REPLACE' : ''
    const sql = `INSERT${sqlUpsert} INTO ${Utils.quote(
      this.info.name
    )} (${fields.map(Utils.quote)}) VALUES (${values})`

    this.sql = sql
    return this
  }

  protected __insertMany(sets: Array<Partial<T>>): IDialectBase<ResultSet> {
    if (!sets.length) {
      throw new Error('No insert data defined.')
    }

    const fields: string[] = []
    const set: any = sets.shift()
    const selectVal = []
    for (const key of Object.keys(set)) {
      fields.push(key)
      selectVal.push(
        Utils.asValue(this.info.columns[key].type, (set as any)[
          key
        ] as string) +
          ' AS ' +
          Utils.quote(key)
      )
    }

    const unions = sets.map(s => {
      return `UNION ALL SELECT ${fields.map(k =>
        Utils.asValue(this.info.columns[k].type, s[k])
      )}`
    })

    const sql = `INSERT INTO ${Utils.quote(this.info.name)} (${fields.map(
      Utils.quote
    )}) SELECT ${selectVal} ${unions.join(' ')}`

    this.sql = sql
    return this
  }
}
