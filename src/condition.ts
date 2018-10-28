import { ColumnInfo } from './types'
import { Utils } from './utils'

export class Condition<T> {
  _sql: string[] = []

  alias?: string
  descriptor: {}
  columns: { [key: string]: { primary: boolean } & ColumnInfo } = {}

  constructor(
    descriptor: {},
    columns: { [key: string]: { primary: boolean } & ColumnInfo },
    alias?: string
  ) {
    this.descriptor = descriptor
    this.columns = columns
    this.alias = alias
  }

  equals(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} = ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  notEquals(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} <> ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  greaterThan(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} > ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  greaterThanOrEqual(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} >= ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  lessThan(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} < ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  lessThanOrEqual(p: { [key in keyof Partial<T>]: any }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} <= ${Utils.asValue(
          this.columns[k].type,
          (p as any)[k]
        )}`
      )
    })
    return this
  }

  in(p: { [key in keyof Partial<T>]: any[] }) {
    Object.keys(p).map(k => {
      this._sql.push(
        `${this._thisField(k)} IN (${(p as any)[k]
          .map((v: any) => Utils.asValue(this.columns[k].type, v))
          .join(', ')})`
      )
    })
    return this
  }

  between(p: { [key in keyof Partial<T>]: any[] }) {
    Object.keys(p).map(k => {
      const val = (p as any)[k]
      const colType = this.columns[k].type
      this._sql.push(
        `${this._thisField(k)} BETWEEN ${Utils.asValue(
          colType,
          val[0]
        )} AND ${Utils.asValue(colType, val[1])}`
      )
    })
    return this
  }

  contains(p: { [key in keyof Partial<T>]: string }) {
    Object.keys(p).map(k => {
      this._sql.push(`${this._thisField(k)} LIKE '${(p as any)[k]}'`)
    })
    return this
  }

  startsWith(p: { [key in keyof Partial<T>]: string }) {
    Object.keys(p).map(k => {
      this._sql.push(`${this._thisField(k)} LIKE '${(p as any)[k]}%'`)
    })
    return this
  }

  endsWith(p: { [key in keyof Partial<T>]: string }) {
    Object.keys(p).map(k => {
      this._sql.push(`${this._thisField(k)} LIKE '%${(p as any)[k]}'`)
    })
    return this
  }

  get or() {
    this._sql.push('OR')
    return this
  }

  group(fn: (c: Condition<T>) => any) {
    this._sql.push('(')
    fn(this)
    this._sql.push(')')
    return this
  }

  field(fn: (k: T) => void) {
    return 'field:' + fn.apply(this, [this.descriptor])
  }

  sql() {
    const sql = []
    let idx = 0
    for (const s of this._sql) {
      sql.push(s)
      if (idx < this._sql.length - 1) {
        const next = this._sql[idx + 1]
        if (
          s !== 'OR' &&
          s !== '(' &&
          // s !== ')' &&
          (next !== ')' && next !== 'OR')
        ) {
          sql.push('AND')
        }
      }

      idx++
    }
    return sql.join(' ')
  }

  protected _thisField(field: string) {
    if (this.alias) {
      return `${Utils.quote(this.alias)}.${Utils.quote(field)}`
    }

    return Utils.quote(field)
  }
}

export type ConditionFunction<T> = (condition: Condition<T>) => Condition<T>
