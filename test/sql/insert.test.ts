import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-insert', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ tables }) => {
    driver.reset()

    await tables.Person.insert({ id: 1, name: 'Foo' })
    expect(driver.sql).toEqual([
      `INSERT INTO "Person" ("id","name") VALUES (1,'Foo')`
    ])

    driver.reset()
    await tables.Person.upsert({ id: 1, name: 'Foo' })
    expect(driver.sql).toEqual([
      `INSERT OR REPLACE INTO "Person" ("id","name") VALUES (1,'Foo')`
    ])

    driver.reset()
    await tables.Person.insert([
      { id: 1, name: 'Foo' },
      { id: 2, name: 'Bar' },
      { id: 3, name: 'Meh' }
    ])

    expect(driver.sql).toEqual([
      'INSERT INTO "Person" ("id","name") SELECT 1 AS "id",\'Foo\' AS "name" UNION ALL SELECT 2,\'Bar\' UNION ALL SELECT 3,\'Meh\''
    ])

    done()
  })
})
