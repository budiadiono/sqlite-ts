import { DialectBase, DialectKind, IDialectBase } from '.'
import { Condition } from '../../condition'
import { KeyVal, TableInfo, ValueOf } from '../../types'
import { Utils } from '../../utils'

export interface IDialectOrderByAlias<M, R, Q> extends IDialectBase<R> {
  orderBy(
    order: {
      [key in keyof Partial<Q>]: {
        [P in keyof Partial<ValueOf<Q[key]>>]: 'ASC' | 'DESC'
      }
    } & {
      self?: { [P in keyof M]?: 'ASC' | 'DESC' }
    }
  ): IDialectLimitAliasOffset<R>
}

export interface IDialectWhereAlias<M, R, Q> extends IDialectBase<R> {
  where<TResult>(
    fields: (
      left: { [key in keyof Q]: Condition<ValueOf<Q[key]>> } & {
        self: Condition<M>
      },
      right: { [key in keyof Q]: ValueOf<Q[key]> } & {
        self: M
      }
    ) => TResult
  ): IDialectOrderByAlias<M, R, Q> & IDialectLimitAliasOffset<R>
}

export interface IDialectLimitAliasOffset<R> extends IDialectBase<R> {
  limit(limit: number, offset?: number): IDialectBase<R>
}

export class ReadAliasDialect<M, R, Q> extends DialectBase<M, R>
  implements
    IDialectOrderByAlias<M, R, Q>,
    IDialectWhereAlias<M, R, Q>,
    IDialectLimitAliasOffset<R> {
  constructor(
    info: TableInfo<M>,
    sql: string,
    kind: DialectKind,
    aliases: KeyVal<TableInfo<any>>,
    map: any
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
    order: {
      [key in keyof Partial<Q>]: {
        [P in keyof Partial<ValueOf<Q[key]>>]: 'ASC' | 'DESC'
      }
    } & {
      self?: { [P in keyof M]?: 'ASC' | 'DESC' }
    }
  ): IDialectLimitAliasOffset<R> {
    if (!this.aliases) {
      throw new Error('Alias needed to build WHERE statement.')
    }

    let sql = ' ORDER BY'
    for (const k of Object.keys(order)) {
      const fOrder = order[k]
      for (const o of Object.keys(fOrder)) {
        sql += ` ${Utils.quote(k)}.${Utils.quote(o)} ${fOrder[o]}`
      }
    }

    this.sql += sql

    return this
  }

  public where<TResult>(
    fields: (
      left: { [key in keyof Q]: Condition<ValueOf<Q[key]>> } & {
        self: Condition<M>
      },
      right: { [key in keyof Q]: ValueOf<Q[key]> } & {
        self: M
      }
    ) => TResult
  ): IDialectOrderByAlias<M, R, Q> & IDialectLimitAliasOffset<R> {
    if (!this.aliases) {
      throw new Error('Alias needed to build WHERE statement.')
    }

    const rightDescriptor = {}
    const leftDescriptor: KeyVal<Condition<any>> = {}

    for (const k of Object.keys(this.aliases)) {
      const a = this.aliases[k]
      leftDescriptor[k] = new Condition(a.descriptor, a.columns, k)
      rightDescriptor[k] = {}
      for (const c of Object.keys(a.columns)) {
        rightDescriptor[k][c] = `field:${k}.${c}`
      }
    }

    fields(leftDescriptor as any, rightDescriptor as any)
    const sqls: string[] = []
    for (const k of Object.keys(leftDescriptor)) {
      sqls.push(leftDescriptor[k].sql())
    }

    this.sql += 'WHERE ' + sqls.filter(s => s.trim() !== '').join(' AND ')

    return this
  }
}
