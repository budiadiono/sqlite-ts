interface JoinField {
  alias: string
  column: string
}

export interface JoinStmt {
  left: JoinField
  right: JoinField
}
