import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-count', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.count().where(c => c.equals({ id: 1 }))

    expect(driver.sql).toEqual([
      'SELECT COUNT(*) as count FROM "Person" WHERE "id" = 1'
    ])

    done()
  })
})
