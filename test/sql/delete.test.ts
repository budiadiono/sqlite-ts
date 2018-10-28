import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-delete', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.delete()
    await tables.Person.delete().where(c => c.equals({ age: 28 }))

    expect(driver.sql).toEqual([
      'DELETE FROM "Person"',
      'DELETE FROM "Person" WHERE "age" = 28'
    ])

    done()
  })
})
