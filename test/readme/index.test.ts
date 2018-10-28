import Sqlite3 = require('sqlite3')
import { Column, Db, Primary, SQLite3Driver } from '../../src'

const sqlite = Sqlite3.verbose()

test('readme', async done => {
  //
  // Define Entities
  //

  class Person {
    @Primary()
    id: number = 0

    @Column('NVARCHAR')
    name: string = ''

    @Column('DATETIME')
    dob: Date = new Date()

    @Column('INTEGER')
    age: number = 0

    @Column('BOOLEAN')
    married: boolean = false

    @Column('MONEY')
    salary: number = 0
  }

  // tslint:disable-next-line:max-classes-per-file
  class Address {
    @Primary()
    id: number = 0

    @Column('INTEGER')
    person: number = 0

    @Column('NVARCHAR')
    address: string = ''
  }

  //
  // Connect to Database
  //

  // define entities object
  const entities = {
    Person,
    Address
  }

  // make a connection using SQLite3.
  // you can use other available drivers
  // or create your own
  const sqlite3Db = new sqlite.Database(':memory:')
  const db = await Db.init({
    // set the driver
    driver: new SQLite3Driver(sqlite3Db),

    // set your entities here
    entities,

    // set `true` so all tables in entities will automatically created for you
    // if it does not exists yet in database
    createTables: false
  })

  // create all tables
  await db.createAllTables()

  // or create table one by one
  await db.tables.Person.create()
  await db.tables.Address.create()

  // insert single data
  const result = await db.tables.Person.insert({
    name: 'Joey',
    married: true,
    dob: new Date(2000, 1, 1, 0, 0, 0),
    age: 18,
    salary: 100
  })

  expect(result.insertId).toEqual(1)
  expect(result.rowsAffected).toEqual(1)

  // insert multiple data at once
  const results = await db.tables.Person.insert([
    {
      name: 'Hanna',
      married: false,
      dob: new Date(2001, 2, 2, 0, 0, 0),
      age: 17,
      salary: 100
    },
    {
      name: 'Mary',
      married: false,
      dob: new Date(2002, 3, 3, 0, 0, 0),
      age: 26,
      salary: 50
    }
  ])

  expect(results.insertId).toEqual(3)
  expect(results.rowsAffected).toEqual(2)

  let address1: any
  let address2: any
  let address3: any
  await db.transaction(({ exec, tables }) => {
    exec(
      tables.Address.insert({
        person: 1,
        address: `Joy's Home`
      })
    ).then(r => {
      address1 = r
    })

    exec(
      tables.Address.insert({
        person: 2,
        address: `Hanna's Home`
      })
    ).then(r => {
      address2 = r
    })

    exec(
      tables.Address.insert({
        person: 3,
        address: `Marry's Home`
      })
    ).then(r => {
      address3 = r
    })
  })

  expect(address1.insertId).toEqual(1)
  expect(address1.rowsAffected).toEqual(1)
  expect(address2.insertId).toEqual(2)
  expect(address2.rowsAffected).toEqual(1)
  expect(address3.insertId).toEqual(3)
  expect(address3.rowsAffected).toEqual(1)

  // select all
  const people = await db.tables.Person.select()
  expect(people).toEqual([
    {
      id: 1,
      name: 'Joey',
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 18,
      married: true,
      salary: 100
    },
    {
      id: 2,
      name: 'Hanna',
      dob: new Date(2001, 2, 2, 0, 0, 0),
      age: 17,
      married: false,
      salary: 100
    },
    {
      id: 3,
      name: 'Mary',
      dob: new Date(2002, 3, 3, 0, 0, 0),
      age: 26,
      married: false,
      salary: 50
    }
  ])

  // select columns
  const people2 = await db.tables.Person.select(c => [c.id, c.name, c.salary])
  expect(people2).toEqual([
    { id: 1, name: 'Joey', salary: 100 },
    { id: 2, name: 'Hanna', salary: 100 },
    { id: 3, name: 'Mary', salary: 50 }
  ])

  // select with limit
  const people3 = await db.tables.Person.select(c => [
    c.id,
    c.name,
    c.salary
  ]).limit(1)
  expect(people3).toEqual([{ id: 1, name: 'Joey', salary: 100 }])

  // select with condition
  const people4 = await db.tables.Person.select(c => [c.id, c.name]).where(c =>
    c.greaterThanOrEqual({ salary: 100 })
  )
  expect(people4).toEqual([{ id: 1, name: 'Joey' }, { id: 2, name: 'Hanna' }])

  // select with order
  const people5 = await db.tables.Person.select(c => [c.id, c.name])
    .where(c => c.notEquals({ married: true }))
    .orderBy({ name: 'DESC' })

  expect(people5).toEqual([{ id: 3, name: 'Mary' }, { id: 2, name: 'Hanna' }])

  // select single data
  const person = await db.tables.Person.single(c => [c.id, c.name])
  expect(person).toEqual({ id: 1, name: 'Joey' })

  // update

  // let's prove that she's not married yet

  let hanna = await db.tables.Person.single(c => [
    c.id,
    c.name,
    c.married
  ]).where(c => c.equals({ id: 2 }))

  // hanna is not married yet = { id: 2, name: 'Hanna', married: false }
  expect(hanna).toEqual({ id: 2, name: 'Hanna', married: false })

  // let's marry her
  await db.tables.Person.update({ married: true }).where(c =>
    c.equals({ id: 2 })
  )

  hanna = await db.tables.Person.single(c => [c.id, c.name, c.married]).where(
    c => c.equals({ id: 2 })
  )

  // hanna is now married = { id: 2, name: 'Hanna', married: true }
  expect(hanna).toEqual({ id: 2, name: 'Hanna', married: true })

  const people6 = await db.tables.Person.join(
    t => ({
      // FROM Person AS self JOIN Address AS address
      address: t.Address
    }),
    (p, { address }) => {
      // ON self.id = address.person
      p.equal({ id: address.person })
    }
  ).map(f => ({
    // SELECT self.id AS id, self.name AS name, address.address AS address
    id: f.self.id,
    name: f.self.name,
    address: f.address.address
  }))

  expect(people6).toEqual([
    { id: 1, name: 'Joey', address: "Joy's Home" },
    { id: 2, name: 'Hanna', address: "Hanna's Home" },
    { id: 3, name: 'Mary', address: "Marry's Home" }
  ])

  // join where order and limit
  const people7 = await db.tables.Person.join(
    t => ({
      // FROM Person AS self JOIN Address AS address
      address: t.Address
    }),
    (p, { address }) => {
      // ON self.id = address.person
      p.equal({ id: address.person })
    }
  )
    .map(f => ({
      // SELECT self.id AS id, self.name AS name, address.address AS address
      id: f.self.id,
      name: f.self.name,
      address: f.address.address
    }))
    // WHERE self.married = 1
    .where(p => p.self.equals({ married: true }))
    // ORDER BY address.address ASC
    .orderBy({ address: { address: 'ASC' } })
    // LIMIT 1
    .limit(1)

  expect(people7).toEqual([{ id: 2, name: 'Hanna', address: "Hanna's Home" }])

  // delete
  const delResult = await db.tables.Person.delete().where(c =>
    c.equals({ id: 3 })
  )

  expect(delResult.insertId).toEqual(3)
  expect(delResult.rowsAffected).toEqual(1)

  // drop
  await db.tables.Address.drop()

  // or drop inside transaction
  await db.transaction(({ exec, tables }) => {
    exec(tables.Address.drop())
    exec(tables.Person.drop())
  })

  // or drop all tables
  await db.dropAllTables()

  done()
})
