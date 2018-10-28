import { Column, Primary } from '../../../src'

export class Role {
  @Primary()
  id: number = 0

  @Column('INTEGER')
  user: number = 0

  @Column('NVARCHAR')
  role: string = ''
}
