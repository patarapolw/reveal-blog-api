import { TypedRouter, ISlidesApi } from '@blog-reveal/types'

import { mongoConnect, SlidesModel, Slides } from '../db/mongo'
import { parseQ } from '../utils'

export default class PostsRouter {
  constructor (
    mongoUri: string,
  ) {
    mongoConnect(mongoUri)
  }

  findOne: TypedRouter<ISlidesApi, '/api/slides', 'GET'> = async (req) => {
    const r = await SlidesModel.findOne({ _id: req.query.id })
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

  query: TypedRouter<ISlidesApi, '/api/slides', 'POST'> = async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body
    const cond = typeof q === 'string' ? parseQ(q) : q || {}

    let r = SlidesModel.find(cond)

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
      rCount = await SlidesModel.find(cond).count()
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
  update: TypedRouter<ISlidesApi, '/api/slides', 'PUT'> = async (req) => {
    const { q, update, options } = req.body

    if (options && options.updateOne) {
      await SlidesModel.updateOne(q, update)
    } else {
      await SlidesModel.updateMany(q, update)
    }

    return true
  }

  create: TypedRouter<ISlidesApi, '/api/slides/create', 'PUT'> = async (req) => {
    const { date, id: slug, ...p } = req.body
    const { id } = await SlidesModel.create({
      ...p,
      _id: slug,
      date,
    } as Slides)

    return { id }
  }

  delete: TypedRouter<ISlidesApi, '/api/slides', 'DELETE'> = async (req) => {
    let isDeleted = false

    if (req.query.id) {
      const r = await SlidesModel.deleteOne({
        _id: req.query.id,
      })
      isDeleted = (!!r.deletedCount && r.deletedCount > 0)
    } else if (req.body && req.body.q) {
      const r = await SlidesModel.deleteMany(req.body.q)
      isDeleted = (!!r.deletedCount && r.deletedCount > 0)
    }

    return isDeleted
  }
}
