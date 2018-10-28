import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-single', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.single(c => [c.name, c.salary])
      .where(c => c.equals({ id: 1 }))
      .orderBy({ dob: 'ASC', id: 'ASC' })

    expect(driver.sql).toEqual([
      'SELECT "name","salary" FROM "Person" WHERE "id" = 1 ORDER BY "dob" ASC "id" ASC LIMIT 1'
    ])

    done()
  })
})
