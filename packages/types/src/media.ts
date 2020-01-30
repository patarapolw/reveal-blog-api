import { IMongoQuery, IHeader, IMongoUpdate, IApi } from './base'

export interface IMediaFull extends IHeader {
  type?: string
  url: string
}

export interface IMediaApi extends IApi {
  '/api/media': {
    POST: {
      body: IMongoQuery
      response: {
        data: (Partial<IMediaFull & {
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
        filename?: string
      }
      body?: {
        q: Record<string, any>
      }
    }
  }
  '/api/media/create': {
    POST: {
      files: {
        file: File
      }
      response: {
        filename: string
        url?: string
      }
    }
    PUT: {
      body: IMediaFull & {
        id?: string
      }
      response: {
        id: string
      }
    }
  }
  '/api/media/:filename': {
    GET: {
      params: {
        filename: string
      }
    }
  }
}
