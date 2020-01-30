import { IMongoQuery, IHeader, IMongoUpdate, IApi } from './base'

export interface ISlidesSubHeader {
  [key: string]: any
  reveal?: {
    [key: string]: any
    shuffle?: boolean
    theme?: string
  }
}

export interface ISlidesHeader extends IHeader {
  date?: string | Date
  title?: string
  header?: ISlidesSubHeader
}

export interface ISlidesContent {
  [v: string]: {
    [h: string]: string
  }
}

export type ISlidesFull = ISlidesHeader & {
  content: ISlidesContent
}

export interface ISlidesApi extends IApi {
  '/api/slides': {
    GET: {
      query: {
        id: string
      }
      response: (ISlidesFull & {
        id: string
      }) | null
    }
    POST: {
      body: IMongoQuery
      response: {
        data: (Partial<ISlidesFull & {
          createdAt: string
          updatedAt: string
        }> & {
          id: string
        })[]
        count?: number
      }
    }
    PUT: {
      body: IMongoUpdate
    }
    DELETE: {
      query: {
        id?: string
      }
      body?: {
        q?: Record<string, any>
      }
    }
  }
  '/api/slides/create': {
    PUT: {
      body: ISlidesFull & {
        id?: string
      }
      response: {
        id: string
      }
    }
  }
}
