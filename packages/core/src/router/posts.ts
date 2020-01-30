import { TypedRouter, IPostsApi } from '@blog-reveal/types'

import { mongoConnect, PostsModel, Posts } from '../db/mongo'
import { parseQ } from '../utils'

export default class PostsRouter {
  constructor (
    mongoUri: string,
  ) {
    mongoConnect(mongoUri)
  }

  findOne: TypedRouter<IPostsApi, '/api/posts', 'GET'> = async (req) => {
    const r = await PostsModel.findOne({ _id: req.query.id })
    if (r) {
      const date = r.date

      return {
        ...r.toJSON(),
        id: r._id,
        date: date instanceof Date ? date.toISOString() : date,
      }
    }

    return null
  }

  query: TypedRouter<IPostsApi, '/api/posts', 'POST'> = async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body
    const cond = typeof q === 'string' ? parseQ(q) : q || {}

    let r = PostsModel.find(cond)

    if (projection) {
      r = r.select(projection)
    }

    if (sort) {
      r = r.sort(sort)
    }

    if (offset) {
      r = r.skip(offset)
    }

    if (limit) {
      r = r.limit(limit)
    }

    let rCount: number | undefined

    if (count) {
      rCount = await PostsModel.find(cond).count()
    }

    return {
      data: (await r).map((el) => {
        const date = el.date

        return {
          ...el.toJSON(),
          id: el._id,
          date: date instanceof Date ? date.toISOString() : date,
        }
      }),
      count: rCount,
    }
  }

  /**
   * Please use Mongo-style update, e.g. $set
   */
  update: TypedRouter<IPostsApi, '/api/posts', 'PUT'> = async (req) => {
    const { q, update, options } = req.body

    if (options && options.updateOne) {
      await PostsModel.updateOne(q, update)
    } else {
      await PostsModel.updateMany(q, update)
    }

    return true
  }

  create: TypedRouter<IPostsApi, '/api/posts/create', 'PUT'> = async (req) => {
    const { date, id: slug, ...p } = req.body
    const { id } = await PostsModel.create({
      ...p,
      _id: slug,
      date,
    } as Posts)

    return { id }
  }

  delete: TypedRouter<IPostsApi, '/api/posts', 'DELETE'> = async (req) => {
    let isDeleted = false

    if (req.query.id) {
      const r = await PostsModel.deleteOne({
        _id: req.query.id,
      })
      isDeleted = (!!r.deletedCount && r.deletedCount > 0)
    } else if (req.body && req.body.q) {
      const r = await PostsModel.deleteMany(req.body.q)
      isDeleted = (!!r.deletedCount && r.deletedCount > 0)
    }

    return isDeleted
  }
}
