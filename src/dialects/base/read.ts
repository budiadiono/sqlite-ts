import { ConditionFunction } from '../../condition'
import { KeyVal, TableInfo } from '../../types'
import { Utils } from '../../utils'
import { DialectBase, DialectKind, IDialectBase } from './'

export interface IDialectLimitOffset<R> {
  limit(limit: number, offset?: number): IDialectBase<R>
}

export interface IDialectOrderBy<M, R> {
  orderBy(
    order?: { [P in keyof M]?: 'ASC' | 'DESC' }
  ): IDialectLimitOffset<R> & IDialectBase<R>
}

export interface IDialectWhere<M, R> {
  where(
    condition?: ConditionFunction<M>
  ): IDialectBase<R> & IDialectOrderBy<M, R>
}

export class ReadDialect<M, R> extends DialectBase<M, R> {
  constructor(
    info: TableInfo<M>,
    sql: string,
    kind: DialectKind,
    aliases?: KeyVal<TableInfo<any>>,
    map?: any
  ) {
    super(info)
    this.kind = kind
    this.sql = sql
    this.aliases = aliases
    this.map = map
  }

  public limit(limit: number, offset?: number): IDialectBase<R> {
    this.sql += ` LIMIT ${limit}`
    if (offset !== undefined) {
      this.sql += ` OFFSET ${offset}`
    }

    return this
  }

  public orderBy(
    order?: { [P in keyof M]?: 'ASC' | 'DESC' }
  ): IDialectLimitOffset<R> & IDialectBase<R> {
    if (order) {
      this.sql +=
        ' ORDER BY ' +
        Object.keys(order)
          .map(k => `${Utils.quote(k)} ${(order as any)[k]}`)
          .join(' ')
    }

    return this
  }

  public where(
    condition?: ConditionFunction<M>
  ): IDialectOrderBy<M, R> & IDialectLimitOffset<R> & IDialectBase<R> {
    if (condition) {
      this.sql += ` WHERE ${this._condSql(condition)}`
    }

    return this
  }
}
