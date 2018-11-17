import { Db } from '../../src'
import { DataTestDriver } from './driver'
import * as entities from './entity'

describe('data-single', () => {
  let db: Db<typeof entities>

  beforeAll(async done => {
    db = await Db.init({
      driver: new DataTestDriver(':memory:'),
      entities
    })

    done()
  })

  afterAll(done => {
    db.close().then(() => {
      done()
    })
  })

  beforeEach(done => {
    db.transaction(({ exec, tables }) => {
      exec(tables.Person.delete())
      exec(tables.Address.delete())
      exec(tables.Role.delete())
    }).then(() => {
      done()
    })
  })

  test('single-test-no-data', async done => {
    const data = await db.tables.Person.single()
    expect(data).toBeUndefined()
    done()
  })

  test('single-test-no-data-with-condition', async done => {
    const data = await db.tables.Person.single().where(c => c.equals({ id: 1 }))
    expect(data).toBeUndefined()
    done()
  })

  test('single-test-no-data-with-order', async done => {
    const data = await db.tables.Person.single().orderBy({ id: 'ASC' })
    expect(data).toBeUndefined()
    done()
  })

  test('single-test-with-data', async done => {
    const now = new Date(1992, 2, 26)
    await db.tables.Person.insert({
      id: 1,
      name: 'Budi',
      married: false,
      age: 26,
      dob: now,
      salary: 20000
    })
    const data = await db.tables.Person.single()
    expect(data).toEqual({
      id: 1,
      name: 'Budi',
      married: false,
      age: 26,
      dob: now,
      salary: 20000
    })
    done()
  })

  test('single-test-with-data-condition', async done => {
    const now = new Date(1992, 2, 26)
    await db.tables.Person.insert([
      {
        id: 1,
        name: 'Budi',
        married: false,
        age: 26,
        dob: now,
        salary: 20000
      },
      {
        id: 2,
        name: 'Mark',
        married: true,
        age: 26,
        dob: now,
        salary: 10000
      }
    ])

    const data = await db.tables.Person.single().where(c => c.equals({ id: 2 }))

    expect(data).toEqual({
      id: 2,
      name: 'Mark',
      married: true,
      age: 26,
      dob: now,
      salary: 10000
    })
    done()
  })
})
