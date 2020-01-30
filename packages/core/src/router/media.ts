import path from 'path'
import fs from 'fs'

import { v2 as cloudinaryV2 } from 'cloudinary'
import moment from 'moment'
import nanoid from 'nanoid'
import dotProp from 'dot-prop'

import { IMediaApi, TypedRouter } from '@blog-reveal/types'

import { MediaModel, Media, mongoConnect } from '../db/mongo'
import { ICloudinaryConfig, cloudinaryConnect } from '../db/cloudinary'
import { parseQ } from '../utils'

export default class MediaRouter {
  constructor (
    mongoUri: string,
    private cloudinary?: ICloudinaryConfig,
  ) {
    mongoConnect(mongoUri)

    if (cloudinary) {
      cloudinary.prefix = cloudinary.prefix || ''
      cloudinaryConnect(cloudinary)
    }
  }

  query: TypedRouter<IMediaApi, '/api/media', 'POST'> = async (req) => {
    const { q, offset, limit, sort, projection, count } = req.body
    const cond = typeof q === 'string' ? parseQ(q) : q || {}

    let r = MediaModel.find(cond)

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
      rCount = await MediaModel.find(cond).count()
    }

    return {
      data: (await r).map((el) => {
        return {
          ...el.toJSON(),
          id: el.id!,
        }
      }),
      count: rCount,
    }
  }

  /**
   * Please use Mongo style update, e.g. $set
   */
  update: TypedRouter<IMediaApi, '/api/media', 'PUT'> = async (req) => {
    const { q, update, options } = req.body

    if (options && options.updateOne) {
      await MediaModel.updateOne(q, update)

      if (q.filename) {
        const filename = q.filename
        const newFilename = dotProp.get<string>(update, '$set.filename')

        if (this.cloudinary && newFilename) {
          if (this.cloudinary.uploadFolder) {
            fs.renameSync(
              path.join(this.cloudinary.uploadFolder, filename),
              path.join(this.cloudinary.uploadFolder, newFilename),
            )
          }

          await cloudinaryV2.uploader.rename(
            `${this.cloudinary.prefix}${filename}`,
            `${this.cloudinary.prefix}${newFilename}`,
          )
        }
      }
    } else {
      await MediaModel.updateMany(q, update)
    }

    return true
  }

  delete: TypedRouter<IMediaApi, '/api/media', 'DELETE'> = async (req) => {
    let q: Record<string, any> | null = null

    if (req.query.filename) {
      q = {
        filename: req.query.filename,
      }
    } else if (req.body && req.body.q) {
      q = req.body.q
    }

    const modified = false

    if (q) {
      const files = (await MediaModel.find(q).select({ filename: 1 })).map((el) => el.filename)

      if (files.length > 0) {
        await Promise.all(files.map(async (f) => {
          try {
            if (this.cloudinary) {
              if (this.cloudinary.uploadFolder) {
                const filePath = path.join(this.cloudinary.uploadFolder, f)
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath)
                }
              }

              await cloudinaryV2.uploader.destroy(`${this.cloudinary.prefix}${f}`)
            }
          } catch (e) {
            console.error(e)
          }
        }))

        await MediaModel.deleteMany(q)

        return true
      }
    }

    return modified
  }

  /**
   * Please create after uploading the file
   */
  upload: TypedRouter<IMediaApi, '/api/media/create', 'POST'> = async (req) => {
    const f = req.files.file
    let name = f.name

    if (name === 'image.png') {
      name = `${moment().format('YYYY-MM-DD_HHmmss')}.png`
    } else {
      name = (() => {
        const [filename, ext] = name.split(/\.([a-z0-9]+)$/i)
        return `${filename}-${nanoid(4)}.${ext || 'png'}`
      })()
    }

    let url: string | undefined

    if (this.cloudinary && this.cloudinary.uploadFolder) {
      const { mv } = f as any
      const folder = this.cloudinary.uploadFolder

      if (mv) {
        await new Promise((resolve, reject) => {
          mv(path.join(folder, name), (err: Error) => err ? reject(err) : resolve())
        })
      }

      url = (await cloudinaryV2.uploader.upload(path.join(folder, name), {
        public_id: `${this.cloudinary.prefix}${name}`,
      })).Location
    }

    return {
      filename: name,
      url,
    }
  }

  create: TypedRouter<IMediaApi, '/api/media/create', 'PUT'> = async (req) => {
    const { id = nanoid(), ...m } = req.body

    await MediaModel.create({
      ...m,
      _id: id,
    } as Media)

    return {
      id,
    }
  }

  getLocalPath: TypedRouter<IMediaApi, '/api/media/:filename', 'GET', string | null> = async (req) => {
    if (this.cloudinary && this.cloudinary.uploadFolder) {
      const folder = this.cloudinary.uploadFolder
      return path.join(folder, req.params.filename)
    }

    return null
  }

  getUrl: TypedRouter<IMediaApi, '/api/media/:filename', 'GET', string | null> = async (req) => {
    if (this.cloudinary && this.cloudinary.uploadFolder) {
      const folder = this.cloudinary.uploadFolder
      return path.join(folder, req.params.filename)
    }

    return null
  }
}
