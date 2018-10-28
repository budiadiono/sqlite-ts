import { Db } from '../../src'
import { TestDriver } from './driver'
import * as entities from './entity'

interface PersonAddress {
  id: number
  name: string
  address: string
}

describe('sql-join', () => {
  const driver = new TestDriver()
  let db: Db<typeof entities>

  beforeAll(async done => {
    db = await Db.init({
      driver,
      entities
    })
    done()
  })

  afterAll(done => {
    db.close().then(() => {
      done()
    })
  })

  beforeEach(done => {
    driver.reset()
    done()
  })

  test('sql-joins', async done => {
    const { tables } = db

    await tables.Person.join(
      o => ({
        addr: o.Address,
        role: o.Role
      }),
      (from, { addr, role }) => {
        from
          .equal({
            id: role.id
          })
          .equal({
            id: addr.id
          })
      }
    ).map(f => ({
      id: f.self.id,
      name: f.self.name,
      foo: {
        address: f.addr.address,
        role: f.role.role
      }
    }))

    await tables.Person.join(
      o => ({
        addr: o.Address,
        role: o.Role
      }),
      (from, { addr, role }) => {
        from.equal({
          id: role.id
        })
        role.equal({
          id: addr.id
        })
      }
    ).map<PersonAddress>(f => ({
      id: f.self.id,
      name: f.self.name,
      address: f.addr.address
    }))

    await tables.Person.join(
      o => ({
        addr: o.Address,
        role: o.Role
      }),
      (from, { addr, role }) => {
        from.equal({
          id: role.id,
          name: role.role
        })
        role.equal({
          id: addr.id
        })
      }
    ).map(f => ({
      id: f.self.id
    }))

    await tables.Person.join(
      o => ({
        addr: o.Address,
        role: o.Role
      }),
      (from, { addr, role }) => {
        from
          .equal({
            id: role.id
          })
          .equal({
            name: role.role
          })
        role.equal({
          id: addr.id
        })
      }
    ).map(f => ({
      id: f.self.id
    }))

    expect(driver.sql).toEqual([
      'SELECT "self"."id" AS "self___id","self"."name" AS "self___name","addr"."address" AS "addr___address","role"."role" AS "role___role"  FROM "Person" AS "self" JOIN  "Role" AS "role" ON "self"."id" = "role"."id"  JOIN  "Address" AS "addr" ON "self"."id" = "addr"."id" ',
      'SELECT "self"."id" AS "self___id","self"."name" AS "self___name","addr"."address" AS "addr___address"  FROM "Person" AS "self" JOIN  "Role" AS "role" ON "self"."id" = "role"."id"  JOIN  "Address" AS "addr" ON "role"."id" = "addr"."id" ',
      'SELECT "self"."id" AS "self___id"  FROM "Person" AS "self" JOIN  "Role" AS "role" ON "self"."id" = "role"."id"  AND "self"."name" = "role"."role"  JOIN  "Address" AS "addr" ON "role"."id" = "addr"."id" ',
      'SELECT "self"."id" AS "self___id"  FROM "Person" AS "self" JOIN  "Role" AS "role" ON "self"."id" = "role"."id"  AND "self"."name" = "role"."role"  JOIN  "Address" AS "addr" ON "role"."id" = "addr"."id" '
    ])

    done()
  })

  test('sql-join-where', async done => {
    const { tables } = db

    await tables.Address.join(
      p => ({ p: p.Person }),
      (a, other) => {
        a.equal({ id: other.p.id })
      }
    )
      .map(f => ({
        id: f.p.id,
        name: f.p.name,
        address: f.self.address
      }))
      .where(l => l.self.startsWith({ address: 'foo' }))

    expect(driver.sql).toEqual([
      'SELECT "p"."id" AS "p___id","p"."name" AS "p___name","self"."address" AS "self___address"  FROM "Address" AS "self" JOIN  "Person" AS "p" ON "self"."id" = "p"."id" WHERE "self"."address" LIKE \'foo%\''
    ])

    done()
  })

  test('sql-join-order', async done => {
    const { tables } = db

    await tables.Address.join(
      p => ({ p: p.Person }),
      (a, other) => {
        a.equal({ id: other.p.id })
      }
    )
      .map(f => ({
        id: f.p.id,
        name: f.p.name,
        address: f.self.address
      }))
      .orderBy({ p: { name: 'ASC', dob: 'DESC' }, self: { address: 'ASC' } })

    expect(driver.sql).toEqual([
      'SELECT "p"."id" AS "p___id","p"."name" AS "p___name","self"."address" AS "self___address"  FROM "Address" AS "self" JOIN  "Person" AS "p" ON "self"."id" = "p"."id"  ORDER BY "p"."name" ASC "p"."dob" DESC "self"."address" ASC'
    ])

    done()
  })

  test('sql-join-limit', async done => {
    const { tables } = db

    await tables.Address.join(
      p => ({ p: p.Person }),
      (a, other) => {
        a.equal({ id: other.p.id })
      }
    )
      .map(f => ({
        id: f.p.id,
        name: f.p.name,
        address: f.self.address
      }))
      .limit(10, 5)

    expect(driver.sql).toEqual([
      'SELECT "p"."id" AS "p___id","p"."name" AS "p___name","self"."address" AS "self___address"  FROM "Address" AS "self" JOIN  "Person" AS "p" ON "self"."id" = "p"."id"  LIMIT 10 OFFSET 5'
    ])

    done()
  })

  test('sql-join-order-limit', async done => {
    const { tables } = db

    await tables.Address.join(
      p => ({ p: p.Person }),
      (a, other) => {
        a.equal({ id: other.p.id })
      }
    )
      .map(f => ({
        id: f.p.id,
        name: f.p.name,
        address: f.self.address
      }))
      .orderBy({ p: { name: 'ASC', dob: 'DESC' }, self: { address: 'ASC' } })
      .limit(10, 5)

    expect(driver.sql).toEqual([
      'SELECT "p"."id" AS "p___id","p"."name" AS "p___name","self"."address" AS "self___address"  FROM "Address" AS "self" JOIN  "Person" AS "p" ON "self"."id" = "p"."id"  ORDER BY "p"."name" ASC "p"."dob" DESC "self"."address" ASC LIMIT 10 OFFSET 5'
    ])

    done()
  })

  test('sql-join-where-limit', async done => {
    const { tables } = db

    await tables.Address.join(
      p => ({ p: p.Person }),
      (a, other) => {
        a.equal({ id: other.p.id })
      }
    )
      .map(f => ({
        id: f.p.id,
        name: f.p.name,
        address: f.self.address
      }))
      .where(l => l.self.startsWith({ address: 'foo' }))
      .limit(10, 5)

    expect(driver.sql).toEqual([
      'SELECT "p"."id" AS "p___id","p"."name" AS "p___name","self"."address" AS "self___address"  FROM "Address" AS "self" JOIN  "Person" AS "p" ON "self"."id" = "p"."id" WHERE "self"."address" LIKE \'foo%\' LIMIT 10 OFFSET 5'
    ])

    done()
  })
})
