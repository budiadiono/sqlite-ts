import { Condition, ConditionFunction } from '../../condition'
import { KeyVal, ResultSet, TableInfo } from '../../types'
import { Utils } from '../../utils'

export enum DialectKind {
  READ = 0,
  SINGLE = 1,
  COUNT = 2,
  ANY = 3,
  WRITE = 4,
  JOIN = 5
}

export interface IDialectBase<R> extends Promise<R> {
  sql: string
}

export class DialectBase<
  M,
  R = M[] | M | ResultSet | undefined | number | boolean
> implements IDialectBase<R> {
  public sql: string;

  [Symbol.toStringTag]: 'Promise'

  protected info: TableInfo<M>
  protected kind: DialectKind = DialectKind.READ
  protected aliases?: KeyVal<TableInfo<any>>
  protected map?: any

  private res: ((value?: R | PromiseLike<R>) => void) | undefined
  private rej: ((reason?: any) => void) | undefined
  private readonly promise: Promise<R>

  constructor(info: TableInfo<M>) {
    this.promise = new Promise((resolve, reject) => {
      this.res = resolve
      this.rej = reject
    })

    this.sql = ''
    this.info = info
  }
  public then<TResult1 = R, TResult2 = never>(
    resolve?:
      | ((value: R) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    reject?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined
  ): Promise<TResult1> {
    switch (this.kind) {
      case DialectKind.READ:
        return this._query(this.sql).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any

      case DialectKind.JOIN:
        if (!this.aliases || !this.map) {
          throw new Error('Join statement needs column alias and map object')
        }

        return this._query(this.sql, this.aliases, this.map).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any

      case DialectKind.SINGLE:
        if (!this.sql.endsWith('LIMIT 1')) {
          this.sql += ' LIMIT 1'
        }
        return this._single(this.sql).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any

      case DialectKind.COUNT:
        return this._count(this.sql).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any

      case DialectKind.ANY:
        return this._any(this.sql).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any

      case DialectKind.WRITE:
        return this._exec(this.sql).then(results => {
          if (resolve) {
            resolve(results as any)
          }
        }, reject) as any
    }

    throw new Error('Dialect not resolved')
  }

  public catch<TResult = never>(
    onRejected?: (reason: any) => PromiseLike<TResult>
  ): Promise<R | TResult> {
    return this.promise.catch(onRejected)
  }

  public resolve(value?: R | PromiseLike<R>): void {
    if (this.res) {
      return this.res(value)
    }
  }

  reject(reason?: any): void {
    if (this.rej) {
      return this.rej(reason)
    }
  }

  /**
   * Build SELECT sql from function.
   * @param fn Fields selection function. eg: p => p.foo or p => [ p.foo, p.bar ].
   */
  protected _select(fn: (k: M) => void) {
    const result = fn.call(this, this.info.descriptor)
    const fields: string[] =
      result instanceof Array ? result : result.split(',')
    return this._buildSelectFields(fields)
  }

  /**
   * Build selected fields for SELECT statement.
   * @param fields selected fields.
   */
  protected _buildSelectFields(fields: string[]) {
    const selected: string[] = []

    fields.forEach(k => {
      selected.push(Utils.selectAs(this.info.columns[k], k))
    })
    return selected.join(',')
  }

  /**
   * Build SQL statement from condition function.
   * @param fn Condition function.
   */
  protected _condSql<TEntity = M>(fn: ConditionFunction<TEntity>) {
    return fn(new Condition(this.info.descriptor, this.info.columns)).sql()
  }

  /**
   * Map raw entity result to actual entity type.
   * @param raw Raw entity result (from query result).
   */
  protected _mapResult<T = M>(raw: T): T | undefined {
    if (!raw) {
      return undefined
    }

    const { columns } = this.info

    const obj = {}
    Object.keys(raw).forEach(k => {
      if (columns[k]) {
        obj[k] = Utils.asResult(columns[k].type, raw[k] as any)
      } else {
        obj[k] = raw[k]
      }
    })
    return obj as T
  }

  protected _mapResultWithAlias<T = M>(
    raw: T,
    aliases: KeyVal<TableInfo<any>>
  ): T | undefined {
    if (!raw) {
      return undefined
    }

    const obj = {}
    Object.keys(raw).forEach(k => {
      const key = k.split('___')
      const { columns } = aliases[key[0]]

      if (columns[key[1]]) {
        obj[k] = Utils.asResult(columns[key[1]].type, raw[k] as any)
      } else {
        obj[k] = raw[k]
      }
    })

    return obj as T
  }

  /**
   * Execute SQL statement.
   * @param sql SQL statement.
   */
  protected _exec(sql: string): Promise<ResultSet> {
    return this.info.db.exec(sql)
  }

  /**
   * Execute SQL statement as single query that returns single entity object.
   * @param sql SQL statement.
   */
  protected async _single<TResult = M>(
    sql: string
  ): Promise<TResult | undefined> {
    return this._mapResult(await this.info.db.single<TResult>(sql))
  }

  /**
   * Execute SQL statement as normal query that returns list of entity object.
   * @param sql SQL statement.
   */
  protected async _query<TResult = M>(
    sql: string,
    aliases?: KeyVal<TableInfo<any>>,
    map?: TResult
  ): Promise<TResult[]> {
    const data = await this.info.db.query<TResult>(sql)

    if (aliases) {
      if (!map) {
        throw new Error('Alias needs map')
      }

      // build results as match with map object
      const translate = (o: {} & TResult, dict: {}) => {
        const res = { ...(o as {}) }
        for (const k of Object.keys(o)) {
          const val = o[k]

          if (typeof val === 'string') {
            // val is alias?
            res[k] = dict[val]
          } else {
            // val is nested object
            res[k] = translate(val, dict)
          }
        }
        return res as TResult
      }

      return data.map(d =>
        translate(map, this._mapResultWithAlias(d, aliases) as TResult)
      )
    }

    // return flat entity
    return data.map(d => this._mapResult(d) as TResult)
  }

  /**
   * Execute SQL statement as count query that returns the number data.
   * @param sql SQL statement.
   */
  protected async _count(sql: string): Promise<number> {
    return (await this._single<any>(sql)).count
  }

  /**
   * Execute SQL statement as count query and returns true if data number is found otherwise false.
   * @param sql SQL statement.
   */
  protected async _any(sql: string): Promise<boolean> {
    return (await this._count(sql)) > 0
  }
}
