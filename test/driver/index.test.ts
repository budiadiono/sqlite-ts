import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('driver-insert', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.insert({ id: 1, name: 'Foo' })
    expect(driver.sql).toEqual([
      'BEGIN',
      `INSERT INTO "Person" ("id","name") VALUES (1,'Foo')`,
      'COMMIT'
    ])
    done()
  })
})

test('driver-transaction', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ transaction }) => {
    driver.reset()

    await transaction(({ tables, exec }) => {
      exec(tables.Person.insert({ id: 1, name: 'Foo' }))
      exec(tables.Person.insert({ id: 1, name: 'Bar' }))
      exec(tables.Person.insert({ id: 1, name: 'Meh' }))
    })

    expect(driver.sql).toEqual([
      'BEGIN',
      `INSERT INTO "Person" ("id","name") VALUES (1,'Foo')`,
      `INSERT INTO "Person" ("id","name") VALUES (1,'Bar')`,
      `INSERT INTO "Person" ("id","name") VALUES (1,'Meh')`,
      'COMMIT'
    ])
    done()
  })
})

test('driver-read', done => {
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

