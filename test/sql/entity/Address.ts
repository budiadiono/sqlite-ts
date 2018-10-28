import { Column, Primary } from '../../../src'

export class Address {
  @Primary()
  id: number = 0

  @Column('INTEGER')
  person: number = 0

  @Column('NVARCHAR')
  address: string = ''
}
