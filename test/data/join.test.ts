import { Db } from '../../src'
import { DataTestDriver } from './driver'
import * as entities from './entity'

describe('data-join', () => {
  let db: Db<typeof entities>

  beforeAll(async done => {
    db = await Db.init({
      driver: new DataTestDriver(':memory:'),
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
    db.transaction(({ exec, tables }) => {
      exec(tables.Person.delete())
      exec(tables.Address.delete())
      exec(tables.Role.delete())
    }).then(() => {
      done()
    })
  })

  test('data-join', async done => {
    const { tables } = db

    const person = await tables.Person.insert({
      name: 'Joey',
      married: false,
      dob: new Date(2000, 1, 1, 0, 0, 0),
      age: 1,
      salary: 100
    })

    await tables.Address.insert({
      person: person.insertId,
      address: 'Nowhere'
    })

    await tables.Role.insert({
      role: 'Admin',
      user: person.insertId
    })

    const result = await tables.Person.join(
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
      profile: {
        name: f.self.name,
        birth: f.self.dob
      },
      attr: {
        address: f.addr.address,
        role: f.role.role
      }
    }))

    const expected = [
      {
        id: 1,
        profile: { name: 'Joey', birth: new Date(2000, 1, 1, 0, 0, 0) },
        attr: { address: 'Nowhere', role: 'Admin' }
      }
    ]

    expect(result).toEqual(expected)

    done()
  })

  test('data-join-where', async done => {
    const { tables } = db

    await tables.Person.insert([
      {
        name: 'Joey',
        married: false,
        dob: new Date(2000, 1, 1, 0, 0, 0),
        age: 1,
        salary: 100
      },
      {
        name: 'Mary',
        married: false,
        dob: new Date(2000, 2, 2, 0, 0, 0),
        age: 2,
        salary: 50
      }
    ])

    await tables.Address.insert([
      {
        person: 1,
        address: 'Nowhere'
      },
      {
        person: 2,
        address: 'Here'
      }
    ])

    await tables.Role.insert([
      {
        role: 'Admin',
        user: 1
      },
      {
        role: 'Mary',
        user: 2
      }
    ])

    const result = await tables.Person.join(
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
    )
      .map(f => ({
        id: f.self.id,
        profile: {
          name: f.self.name,
          birth: f.self.dob
        },
        attr: {
          address: f.addr.address,
          role: f.role.role
        }
      }))
      .where((f, r) => [
        f.self.equals({ id: 2 }).endsWith({ name: 'ry' }),
        f.role.equals({ role: r.self.name })
      ])

    expect(result).toEqual([
      {
        id: 2,
        profile: { name: 'Mary', birth: new Date(2000, 2, 2, 0, 0, 0) },
        attr: { address: 'Here', role: 'Mary' }
      }
    ])

    done()
  })

  test('data-join-where-order', async done => {
    const { tables } = db

    await tables.Person.insert([
      {
        name: 'Joey',
        married: false,
        dob: new Date(2000, 1, 1, 0, 0, 0),
        age: 1,
        salary: 100
      },
      {
        name: 'Mary',
        married: false,
        dob: new Date(2000, 2, 2, 0, 0, 0),
        age: 2,
        salary: 50
      }
    ])

    await tables.Address.insert([
      {
        person: 1,
        address: 'Nowhere'
      },
      {
        person: 2,
        address: 'Here'
      }
    ])

    await tables.Role.insert([
      {
        role: 'Admin',
        user: 1
      },
      {
        role: 'Mary',
        user: 2
      }
    ])

    const result = await tables.Person.join(
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
    )
      .map(f => ({
        id: f.self.id,
        name: f.self.name,
        address: f.addr.address,
        role: f.role.role,
        dateOfBirth: f.self.dob
      }))
      .where(f => [f.self.notEquals({ married: true })])
      .orderBy({ self: { id: 'DESC' } })

    expect(result).toEqual([
      {
        id: 2,
        name: 'Mary',
        address: 'Here',
        role: 'Mary',
        dateOfBirth: new Date(2000, 2, 2, 0, 0, 0)
      },
      {
        id: 1,
        name: 'Joey',
        address: 'Nowhere',
        role: 'Admin',
        dateOfBirth: new Date(2000, 1, 1, 0, 0, 0)
      }
    ])

    done()
  })

  test('data-join-where-order-limit', async done => {
    const { tables } = db

    await tables.Person.insert([
      {
        name: 'Joey',
        married: false,
        dob: new Date(2000, 1, 1, 0, 0, 0),
        age: 1,
        salary: 100
      },
      {
        name: 'Mary',
        married: false,
        dob: new Date(2000, 2, 2, 0, 0, 0),
        age: 2,
        salary: 50
      }
    ])

    await tables.Address.insert([
      {
        person: 1,
        address: 'Nowhere'
      },
      {
        person: 2,
        address: 'Here'
      }
    ])

    await tables.Role.insert([
      {
        role: 'Admin',
        user: 1
      },
      {
        role: 'Mary',
        user: 2
      }
    ])

    const result = await tables.Person.join(
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
    )
      .map(f => ({
        id: f.self.id,
        name: f.self.name,
        address: f.addr.address,
        role: f.role.role,
        dateOfBirth: f.self.dob
      }))
      .where(f => [f.self.notEquals({ married: true })])
      .orderBy({ self: { id: 'DESC' } })
      .limit(1)

    expect(result).toEqual([
      {
        id: 2,
        name: 'Mary',
        address: 'Here',
        role: 'Mary',
        dateOfBirth: new Date(2000, 2, 2, 0, 0, 0)
      }
    ])

    done()
  })
})
