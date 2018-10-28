import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-drop', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.drop()

    expect(driver.sql).toEqual(['DROP TABLE IF EXISTS "Person"'])

    done()
  })
})
