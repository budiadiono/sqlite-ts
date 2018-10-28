import { ColumnInfo, ColumnTypes } from './types'

export class Utils {
  static quote(str: string): string {
    return `"${str}"`
  }

  static getRealColumnType(name: string, info: ColumnInfo) {
    const colSize = info.size ? `(${info.size})` : ``

    switch (info.type) {
      case 'BOOLEAN':
        return `BOOLEAN NOT NULL CHECK (${name} IN (0,1))`
      case 'MONEY':
      case 'DATETIME':
        return `INTEGER`
      default:
        return `${info.type}${colSize}`
    }
  }

  static asResult(colType: ColumnTypes, v: any) {
    switch (colType) {
      case 'DATETIME':
        return this.dateParse(v)
      case 'BOOLEAN':
        return v === 0 ? false : true
      case 'MONEY':
        return v / 100
    }

    return v
  }

  static asValue(colType: ColumnTypes, v: any) {
    
    // TODO:  This is not good idea to use 'field:' prefix
    //        use function might be good!
    if (typeof v === 'string' && v.startsWith('field:')) {
      return v.substr(6)
    }

    switch (colType) {
      case 'DATETIME':
        return this.strftime(v)
      case 'MONEY':
        return Math.round(v * 100)
    }

    switch (typeof v) {
      case 'string':
        return `'${v.replace(/\'/g, "''")}'`

      case 'undefined':
        return 'null'

      case 'boolean':
        return v === true ? '1' : '0'
    }

    if (v === null) {
      return 'null'
    }

    return v
  }

  static asRawValue(colType: ColumnTypes, v: any) {
    if (v === null) {
      return 'NULL'
    }

    switch (colType) {
      case 'DATETIME':
      case 'INTEGER':
      case 'BOOLEAN':
      case 'DECIMAL':
        return v
    }

    return `'${v}'`
  }

  static timeStamp(date: Date) {
    return date
      .toISOString()
      .slice(0, 19)
      .replace(/\-/g, '')
      .replace(/\:/g, '')
      .replace('T', '-')
  }

  static strftime(date: Date) {
    return `strftime('%s', '${this.formatSimpleISODate(date)}')`
  }

  static formatSimpleISODate(date: Date) {
    return `${date.getFullYear()}-${this.padStart(
      date.getMonth() + 1,
      2
    )}-${this.padStart(date.getDate(), 2)} ${this.padStart(
      date.getHours(),
      2
    )}:${this.padStart(date.getMinutes(), 2)}:${this.padStart(
      date.getSeconds(),
      2
    )}`
  }

  static padStart(
    str: any,
    targetLength: number,
    padString: string = '0'
  ): string {
    str = str.toString()
    padString = String(typeof padString !== 'undefined' ? padString : ' ')
    if (str.length > targetLength) {
      return str
    } else {
      targetLength = targetLength - str.length
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length)
      }
      return padString.slice(0, targetLength) + str
    }
  }

  static dateParse(str: string): Date {
    const parts = str.split(' ')
    const dates = parts[0].split('-').map(d => parseInt(d, 0))
    const times = parts[1].split(':').map(d => parseInt(d, 0))

    return new Date(
      dates[0],
      dates[1] - 1,
      dates[2],
      times[0],
      times[1],
      times[2]
    )
  }

  static selectAs(info: ColumnInfo, fieldname: string, as?: string) {
    const field = Utils.quote(fieldname)
    if (info.type === 'DATETIME') {
      return Utils.selectAsDate(field, as)
    }

    if (as) {
      return `${field} AS ${Utils.quote(as)}`
    }

    return field
  }

  static selectAsDate(field: string, asField: string = field) {
    return `datetime(${field},'unixepoch') AS ${asField}`
  }
}
