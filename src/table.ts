import 'reflect-metadata'
import { COLUMN_META_KEY } from './column'
import { Db } from './db'
import { Dialect } from './dialects'
import { PRIMARY_META_KEY } from './primary'
import { ColumnInfo, ConstructorClass, TableInfo } from './types'
import { Utils } from './utils'

export class Table<M, T extends ConstructorClass<M>, TDb> extends Dialect<
  M,
  TDb
> {
  static buildTableInfo<M, T extends ConstructorClass<M>>(
    db: Db<any>,
    entity: T,
    name: string
  ): TableInfo<M> {
    const table = new entity()

    const properties = Object.getOwnPropertyNames(table)
    const descriptor = {}
    const columns: { [key: string]: { primary: boolean } & ColumnInfo } = {}

    for (const key of properties) {
      ;(descriptor as any)[key] = key

      let primary = false
      let column = Reflect.getMetadata(
        COLUMN_META_KEY,
        table,
        key
      ) as ColumnInfo

      if (!column) {
        column = Reflect.getMetadata(PRIMARY_META_KEY, table, key) as ColumnInfo
        primary = true
      }

      if (column) {
        columns[key] = {
          primary,
          ...column
        }
      }
    }

    return {
      db,
      name,
      columns,
      descriptor
    }
  }

  constructor(entity: T, name: string, db: Db<T>) {
    super(Table.buildTableInfo(db, entity, name))
    this._mapResult = this._mapResult.bind(this)
  }

  async buildBackupSql() {
    const { db, name, columns } = this.info

    const cols = Object.keys(columns).join(', ')
    const tbl = Utils.quote(name)

    // get data values
    const values = await db.query(`SELECT ${cols} FROM ${tbl}`)
    if (!values || !values.length) {
      return ''
    }

    // build insert values sql
    const sql = `INSERT INTO ${tbl} (${cols}) VALUES ${values
      .map(value => {
        return (
          '(' +
          Object.keys(value)
            .map(col =>
              Utils.asRawValue(this.info.columns[col].type, value[col])
            )
            .join(',') +
          ')'
        )
      })
      .join(',')}`
    return sql + ';'
  }
}
