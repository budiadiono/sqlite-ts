import { Db } from '../../src'
import { DataTestDriver } from './driver'
import * as entities from './entity'

describe('data-insert', () => {
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
    db.tables.Person.delete().then(() => {
      done()
    })
  })

  test('insert-direct', async done => {
    const person = {
      name: 'Joey',
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    }

    const insertResult = await db.tables.Person.insert(person)
    const selectResults = await db.tables.Person.select()

    expect(insertResult.rowsAffected).toEqual(1)
    expect(insertResult.insertId).toEqual(1)
    expect(insertResult.rows.length).toEqual(0)

    const personMatch = { id: 1, ...person }
    expect(selectResults.length).toEqual(1)
    expect(selectResults[0]).toMatchObject(personMatch)

    done()
  })

  test('insert-with-transaction', async done => {
    const person = {
      name: 'Joey',
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    }

    await db.transaction(({ tables, exec }) => {
      exec(tables.Person.insert(person))
    })

    const results = await db.tables.Person.select()

    const personMatch = { id: 1, ...person }

    expect(results.length).toEqual(1)
    expect(results[0]).toMatchObject(personMatch)

    done()
  })

  test('insert-string-with-quote', async done => {
    const person = {
      name: `Joey's Nephew`,
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    }

    await db.transaction(({ tables, exec }) => {
      exec(tables.Person.insert(person))
    })

    const results = await db.tables.Person.select()
    const personMatch = { id: 1, ...person }

    expect(results.length).toEqual(1)
    expect(results[0]).toMatchObject(personMatch)

    done()
  })

  test('insert-string-with-double-quote', async done => {
    const person = {
      name: `Joey"s Nephew`,
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    }

    await db.transaction(({ tables, exec }) => {
      exec(tables.Person.insert(person))
    })

    const results = await db.tables.Person.select()
    const personMatch = { id: 1, ...person }

    expect(results.length).toEqual(1)
    expect(results[0]).toMatchObject(personMatch)

    done()
  })
})
