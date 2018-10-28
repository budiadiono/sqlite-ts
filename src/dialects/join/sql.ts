import { Utils } from '../../utils'
import { JoinObject } from './condition'
import { JoinStmt } from './types'

export function buildJoinSql<T>(tables: T, joins: JoinObject) {
  let sql = ''
  const _regs: string[] = []

  function tableName(name: string) {
    return tables[name].info.name
  }

  function registered(alias: string) {
    return _regs.indexOf(alias) > -1
  }

  function reg(alias: string) {
    if (registered(alias)) {
      return
    }

    _regs.push(alias)
  }

  let isLastJoin = false

  function sqlJoin(alias: string) {
    sql += ` JOIN  ${Utils.quote(tableName(alias))} AS ${Utils.quote(alias)}`
    reg(alias)
    isLastJoin = true
  }

  function sqlOn(join: JoinStmt) {
    sql += ` ${isLastJoin ? 'ON' : 'AND'} ${Utils.quote(
      join.left.alias
    )}.${Utils.quote(join.left.column)} = ${Utils.quote(
      join.right.alias
    )}.${Utils.quote(join.right.column)} `
  }

  for (const st of joins.sqls) {
    isLastJoin = false
    if (!_regs.length) {
      sql += ` FROM ${Utils.quote(tableName(st.left.alias))} AS ${Utils.quote(
        st.left.alias
      )}`
      reg(st.left.alias)

      sqlJoin(st.right.alias)
    } else {
      if (!registered(st.left.alias)) {
        sqlJoin(st.left.alias)
      }
      if (!registered(st.right.alias)) {
        sqlJoin(st.right.alias)
      }
    }
    sqlOn(st)
  }

  return sql
}
