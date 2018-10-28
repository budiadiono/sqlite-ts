import { Column, Primary } from '../../../src'

export class Person {
  @Primary()
  id: number = 0

  @Column('NVARCHAR')
  name: string = ''

  @Column('DATETIME')
  dob: Date = new Date()

  @Column('INTEGER')
  age: number = 0

  @Column('BOOLEAN')
  married: boolean = false

  @Column('MONEY')
  salary: number = 0
}
