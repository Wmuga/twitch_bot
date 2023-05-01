export type DBResultPointsCount = {
  count: number
} | undefined

export type DBEntry = {
  nickname:string,
  count:number
}

export type DBResultPointsTop  = Array<DBEntry>;