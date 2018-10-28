import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-transaction', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(async ({ transaction }) => {
    driver.reset()

    await transaction(({ tables, exec }) => {
      exec('DELETE Foo')
      exec(tables.Person.update({ id: 1, name: 'Foo' }))
      exec(
        tables.Person.update({ id: 1, name: 'Foo' }).where(c =>
          c.equals({ age: 28 })
        )
      )
      exec(tables.Person.insert({ id: 1, name: 'Foo' }))
      exec(tables.Person.upsert({ id: 1, name: 'Foo' }))
      exec(
        tables.Person.insert([
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
          { id: 3, name: 'Meh' }
        ])
      )
      exec(tables.Person.delete())
      exec(tables.Person.delete().where(c => c.equals({ age: 28 })))
    })

    expect(driver.sql).toEqual([
      'DELETE Foo',
      `UPDATE "Person" SET "id" = 1, "name" = 'Foo'`,
      'UPDATE "Person" SET "id" = 1, "name" = \'Foo\' WHERE "age" = 28',
      `INSERT INTO "Person" ("id","name") VALUES (1,'Foo')`,
      `INSERT OR REPLACE INTO "Person" ("id","name") VALUES (1,'Foo')`,
      'INSERT INTO "Person" ("id","name") SELECT 1 AS "id",\'Foo\' AS "name" UNION ALL SELECT 2,\'Bar\' UNION ALL SELECT 3,\'Meh\'',
      'DELETE FROM "Person"',
      'DELETE FROM "Person" WHERE "age" = 28'
    ])

    done()
  })
})
