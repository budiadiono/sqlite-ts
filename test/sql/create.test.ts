import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-create', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.create()

    expect(driver.sql).toEqual([
      'CREATE TABLE IF NOT EXISTS "Person" ("id" INTEGER PRIMARY KEY, "name" NVARCHAR, "dob" INTEGER, "age" INTEGER, "married" BOOLEAN NOT NULL CHECK (married IN (0,1)), "salary" INTEGER)'
    ])

    done()
  })
})
