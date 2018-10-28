import { Db } from '../../src'
import { DataTestDriver } from './driver'
import * as entities from './entity'

describe('crud', () => {
  let db: Db<typeof entities>

  beforeAll(async done => {
    db = await Db.init({
      driver: new DataTestDriver(':memory:'),
      entities,
      createTables: false
    })

    done()
  })

  afterAll(done => {
    db.close().then(done)
  })

  test('data-crud', async done => {
    const { tables, transaction } = db

    const person = {
      name: 'Joey',
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    }

    await transaction(({ exec }) => {
      exec(tables.Person.create())
      exec(tables.Person.insert(person))
    })

    const count = await tables.Person.count()
    const data = await tables.Person.single()
    const list = await tables.Person.select()
    const exists = await tables.Person.any()

    const personMatch = { id: 1, ...person }

    expect(count).toEqual(1)
    expect(data).toMatchObject(personMatch)
    expect(list.length).toEqual(1)
    expect(list[0]).toMatchObject(personMatch)
    expect(exists).toEqual(true)

    await tables.Person.update({ name: 'John' }).where(c => c.equals({ id: 1 }))

    const data3 = await tables.Person.single()
    expect(data3.name).toEqual('John')

    await tables.Person.delete()

    const count2 = await tables.Person.count()
    const data2 = await tables.Person.single()
    const list2 = await tables.Person.select()
    const exists2 = await tables.Person.any()

    expect(count2).toEqual(0)
    expect(data2).toBeUndefined()
    expect(list2.length).toEqual(0)
    expect(exists2).toEqual(false)

    done()
  })
})
