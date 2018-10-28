import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-select', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.select(c => [c.name, c.salary])
      .where(c => c.equals({ id: 1 }))
      .orderBy({ dob: 'ASC', id: 'ASC' })
      .limit(1)

    expect(driver.sql).toEqual([
      'SELECT "name","salary" FROM "Person" WHERE "id" = 1 ORDER BY "dob" ASC "id" ASC LIMIT 1'
    ])

    done()
  })
})

test('sql-select-order-limit', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.select(c => [c.name, c.salary])
      .orderBy({ dob: 'ASC', id: 'ASC' })
      .limit(1)

    expect(driver.sql).toEqual([
      'SELECT "name","salary" FROM "Person" ORDER BY "dob" ASC "id" ASC LIMIT 1'
    ])

    done()
  })
})

test('sql-select-where-limit', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.select(c => [c.name, c.salary])
      .where(c => c.equals({ id: 1 }))
      .limit(1)

    expect(driver.sql).toEqual([
      'SELECT "name","salary" FROM "Person" WHERE "id" = 1 LIMIT 1'
    ])

    done()
  })
})

test('sql-select-limit', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.select(c => [c.name, c.salary]).limit(1)

    expect(driver.sql).toEqual(['SELECT "name","salary" FROM "Person" LIMIT 1'])

    done()
  })
})
