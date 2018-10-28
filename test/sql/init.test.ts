import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

test('sql-init', done => {
  const driver = new TestDriver()
  Db.init({
    driver,
    entities
  }).then(db => {
    expect(db.tables.Person).toBeTruthy()
    expect(db.tables.Person).toHaveProperty('info')
    // tslint:disable-next-line:no-string-literal
    expect(db.tables.Person['info']).toMatchObject({
      name: 'Person',
      columns: {
        id: { primary: true, type: 'INTEGER', size: undefined },
        name: { primary: false, type: 'NVARCHAR', size: undefined },
        dob: { primary: false, type: 'DATETIME', size: undefined },
        age: { primary: false, type: 'INTEGER', size: undefined },
        married: { primary: false, type: 'BOOLEAN', size: undefined },
        salary: { primary: false, type: 'MONEY', size: undefined }
      }
    })

    expect(driver.sql).toEqual([
      'CREATE TABLE IF NOT EXISTS "Person" ("id" INTEGER PRIMARY KEY, "name" NVARCHAR, "dob" INTEGER, "age" INTEGER, "married" BOOLEAN NOT NULL CHECK (married IN (0,1)), "salary" INTEGER)',
      'CREATE TABLE IF NOT EXISTS "Address" ("id" INTEGER PRIMARY KEY, "person" INTEGER, "address" NVARCHAR)',
      'CREATE TABLE IF NOT EXISTS "Role" ("id" INTEGER PRIMARY KEY, "user" INTEGER, "role" NVARCHAR)'
    ])

    done()
  })
})
