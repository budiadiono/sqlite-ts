import Sqlite3 = require('sqlite3')
import { SQLite3Driver } from '../../../src/drivers/sqlite3'

const sqlite = Sqlite3.verbose()

export class DataTestDriver extends SQLite3Driver {
  filename: string

  constructor(filename: string) {
    // @ts-ignore
    super(null)
    this.filename = filename
  }

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db = new sqlite.Database(this.filename, error => {
        if (error) {
          reject(error)
        } else {
          // @ts-ignore
          this.db.wait(resolve)
        }
      })
    })
  }
}
