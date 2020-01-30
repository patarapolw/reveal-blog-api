export interface IMongoQuery {
  q?: Record<string, any> | string
  offset?: number
  limit: number | null
  sort?: Record<string, 1 | -1>
  projection?: Record<string, 0 | 1>
  count?: boolean
}

export interface IMongoUpdate {
  q: Record<string, any>
  update: Record<string, any>
  options?: {
    updateOne?: boolean
  }
}

export interface IHeader {
  source?: string
  md5?: string
  tag?: string[]
}

export interface IApiRequest {
  params?: Record<string, string | undefined> | string[]
  query?: Record<string, string | string[] | undefined>
  body?: Record<string, any>
  files?: Record<string, File | undefined>
}

export interface IApiResponse {
  response?: any
}

export interface IApi {
  [path: string]: {
    [method: string]: IApiRequest & IApiResponse
  }
}

export type TypedRouter<Api extends IApi, Path extends keyof Api, Method extends keyof Api[Path], T = boolean>
  = (req: Omit<Api[Path][Method], 'response'>)
    => Api[Path][Method] extends { response: any } ? Promise<Api[Path][Method]['response']> : Promise<T>
