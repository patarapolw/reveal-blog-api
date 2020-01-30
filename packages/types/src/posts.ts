import { IMongoQuery, IHeader, IMongoUpdate, IApi } from './base'

export interface IPostsHeader extends IHeader {
  date?: string | Date
  title: string
  header?: {
    [key: string]: any
  }
}

export type IPostsFull = IPostsHeader & {
  excerpt?: string
  content: string
}

export interface IPostsApi extends IApi {
  '/api/posts': {
    GET: {
      query: {
        id: string
      }
      response: (IPostsFull & {
        id: string
      }) | null
    }
    POST: {
      body: IMongoQuery
      response: {
        data: (Partial<IPostsFull & {
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
  '/api/posts/create': {
    PUT: {
      body: IPostsFull & {
        id?: string
      }
      response: {
        id: string
      }
    }
  }
}
