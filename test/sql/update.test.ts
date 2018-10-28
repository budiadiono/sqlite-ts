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
    await tables.Person.update({ id: 1, name: 'Foo' })
    expect(driver.sql).toEqual([`UPDATE "Person" SET "id" = 1, "name" = 'Foo'`])

    driver.reset()
    await tables.Person.update({ id: 1, name: 'Foo' }).where(c =>
      c.equals({ age: 28 })
    )
    expect(driver.sql).toEqual([
      'UPDATE "Person" SET "id" = 1, "name" = \'Foo\' WHERE "age" = 28'
    ])

    done()
  })
})
