import { KeyVal, TableInfo, ValueOf } from '../../types'
import { Utils } from '../../utils'
import { DialectKind } from '../base'
import { ReadAliasDialect } from '../base/readAlias'

export class JoinMapper<T, TDb, Q = KeyVal<TDb>> {
  protected tableInfo: TableInfo<T>
  protected sqlClause: string
  protected tables: KeyVal

  constructor(tableInfo: TableInfo<T>, tables: KeyVal, sqlClause: string) {
    this.tableInfo = tableInfo
    this.tables = tables
    this.sqlClause = sqlClause
  }

  map<TResult>(
    fields: (
      column: { [key in keyof Q]: ValueOf<Q[key]> } & { self: T }
    ) => TResult
  ) {
    const descriptor = {}
    const aliases: KeyVal<TableInfo<any>> = {}

    // build descriptor and aliases
    for (const k of Object.keys(this.tables)) {
      const res = {}
      // @ts-ignore
      const info: TableInfo<any> = this.tables[k].info
      for (const d of Object.keys(info.descriptor)) {
        res[d] = k + '___' + info.descriptor[d]
      }

      descriptor[k] = res
      aliases[k] = info
    }

    // build selected fields for SELECT statement
    const selectedFields: string[] = []
    function getSelectedFields(m: {}) {
      for (const km of Object.keys(m)) {
        const r = m[km]
        if (typeof r === 'string') {
          const field = r.split('___')
          const toSelect = r.replace('___', '"."')

          const select = Utils.selectAs(
            aliases[field[0]].columns[field[1]],
            toSelect,
            r
          )

          if (selectedFields.indexOf(select) < 0) {
            selectedFields.push(select)
          }
        } else {
          getSelectedFields(r)
        }
      }
    }

    // build map results
    const map = fields(descriptor as any)

    // get all columns to select
    getSelectedFields(map)

    // combine select join clause sql
    const sql = `SELECT ${selectedFields.join(',')} ${this.sqlClause}`

    return new ReadAliasDialect<T, TResult[], Q>(
      this.tableInfo,
      sql,
      DialectKind.JOIN,
      aliases,
      map
    )
  }
}
