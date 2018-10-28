import { PrimaryKeyTypes } from './types'

export const PRIMARY_META_KEY = 'table:primary'

export function Primary(type: PrimaryKeyTypes = 'INTEGER', size?: number) {
  return Reflect.metadata(PRIMARY_META_KEY, { type, size })
}
