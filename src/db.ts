import { Scope, TransactionScope } from './scope'
import { Table } from './table'
import { ConstructorClass, DbDriver, KeyVal, ResultSet, ValueOf } from './types'

export interface DbConfig<TModels> {
  driver: DbDriver
  entities: TModels
  createTables?: boolean
}

export type Tables<T> = {
  [P in keyof T]: Table<ValueOf<T[P]>, ConstructorClass<ValueOf<T[P]>>, T>
}

export class Db<T> {
  /**
   * Create new database instance.
   * @param config Database Configuration
   */
  static async init<TModels>(config: DbConfig<TModels>): Promise<Db<TModels>> {
    const _db = new Db<TModels>()

    if (config.driver.init) {
      await config.driver.init()
    }

    _db.config = config
    _db.driver = config.driver

    try {
      _db.tables = _db.buildTables()
      if (config.createTables || config.createTables === undefined) {
        await _db.createAllTables()
      }
      return _db
    } catch (error) {
      throw new Error(error)
    }
  }

  config!: DbConfig<T>
  driver!: DbDriver
  tables!: Tables<T>

  constructor() {
    this.transaction = this.transaction.bind(this)
  }

  async close(): Promise<void> {
    return this.config.driver.close()
  }

  buildTables(): Tables<T> {
    const tables: KeyVal<any> = {}
    const cls = this.config.entities as any

    for (const key of Object.keys(cls)) {
      const table = new Table(cls[key] as any, key, this)
      tables[key] = table
    }

    return tables as any
  }

  transaction(
    scope: (transacionScope: TransactionScope<T>) => void
  ): Promise<ResultSet[]> {
    return new Promise<ResultSet[]>((resolve, reject) => {
      const resultSets: ResultSet[] = []
      this.driver.transaction(
        tx => {
          const { tables, exec } = new Scope(this, tx)
          scope({ tables, exec })
        },
        reject,
        () => {
          resolve(resultSets)
        }
      )
    })
  }

  exec(sql: string, args?: any[]): Promise<ResultSet> {
    return new Promise<ResultSet>((resolve, reject) => {
      this.driver.transaction(tx => {
        tx.execSql(
          sql,
          args,
          res => {
            resolve(this.driver.getQueryResult(res))
          },
          reject
        )
      })
    })
  }

  query<TResult = any>(sql: string, args?: any[]): Promise<TResult[]> {
    return new Promise<TResult[]>((resolve, reject) => {
      this.driver.query(sql, args || [], reject, res => {
        resolve(this.driver.getQueryResult(res).rows.items())
      })
    })
  }

  single<TResult = any>(sql: string, args?: any[]): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      this.driver.query(sql, args || [], reject, res => {
        resolve(this.driver.getQueryResult(res).rows.item(0))
      })
    })
  }

  async dropAllTables() {
    return this.transaction(({ tables, exec }) => {
      for (const key of Object.keys(tables)) {
        exec(tables[key].drop())
      }
    })
  }

  async createAllTables() {
    return this.transaction(({ tables, exec }) => {
      for (const key of Object.keys(tables)) {
        exec(tables[key].create())
      }
    })
  }

  async generateBackupSql() {
    const sqlCreates: string[] = []
    const sqlInserts: string[] = []

    for (const key of Object.keys(this.tables)) {
      const tbl = this.tables[key]
      tbl.create()
      sqlCreates.push(tbl.sql)
      sqlInserts.push(await tbl.buildBackupSql())
    }
    return (
      sqlCreates.join('\r\n') +
      '\r\n' +
      sqlInserts.filter(s => s !== '').join('\r\n')
    )
  }

  async restoreFromSql(sql: string, recreate?: boolean) {
    if (recreate) {
      await this.dropAllTables()
    }

    await this.transaction(({ exec }) => {
      const sqls = sql.split('\r\n')
      for (const s of sqls) {
        if (s.startsWith('CREATE')) {
          if (recreate) {
            exec(s)
          }
        } else if (s.startsWith('INSERT')) {
          exec(s)
        }
      }
    })
  }
}
