import { prop, getModelForClass, pre } from '@typegoose/typegoose'
import mongoose from 'mongoose'
import stringify from 'fast-json-stable-stringify'
import SparkMD5 from 'spark-md5'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import nanoid from 'nanoid'
import Slugify from 'seo-friendly-slugify'

import {
  IPostsFull,
  ISlidesFull, ISlidesSubHeader, ISlidesContent,
  IMediaFull,
} from '@blog-reveal/types'

import { customDateToEpoch, getExcerptSeparator, getExcerptLength } from '../utils'

let cachedDb: mongoose.Mongoose | null = null
const slugify = new Slugify()

function uniqueSlugify (title?: string) {
  return [
    slugify.slugify(title || ''),
    nanoid(4),
  ].filter((el) => el.trim()).join('-')
}

@pre<Posts>('save', function () {
  if (!this.excerpt) {
    this.excerpt = this.content
      .split(getExcerptSeparator())[0]
      .substr(0, getExcerptLength())
  }

  if (!this._id) {
    this._id = uniqueSlugify(this.title)
  }

  if (!this.md5) {
    const { date, title, tag, header, content } = this
    this.md5 = SparkMD5.hash(stringify({ date, title, tag, header, content }))
  }
})
export class Posts implements IPostsFull {
  @prop() _id!: string
  @prop({
    index: true,
    type: Date,
    set: (d) => {
      const t = customDateToEpoch(d)
      return t ? new Date(t) : undefined
    },
  }) date?: Date | string

  @prop({ required: true, index: true }) title!: string
  @prop({ index: true }) source?: string
  @prop({ default: [] }) tag?: string[]
  @prop({ default: {} }) header?: Record<string, any>
  @prop({ required: true }) excerpt?: string
  @prop({ required: true }) content!: string
  @prop({ unique: true, required: true }) md5?: string

  get raw () {
    const { _id: id, date, title, tag, header, content } = this

    return matter.stringify(content, {
      ...header, id, date, title, tag,
    }, {
      engines: {
        yaml: {
          stringify: (obj) => yaml.safeDump(obj, { skipInvalid: true, sortKeys: true }),
          parse: (s) => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA }),
        },
      },
    })
  }

  set raw (s: string) {
    const { data, content } = matter(s, { engines: { yaml: (s) => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA }) } })
    const { id, date, title, tag, ...header } = data
    this._id = id
    this.date = date
    this.title = title
    this.tag = tag
    this.header = header
    this.content = content
  }
}

export const PostsModel = getModelForClass(Posts, { schemaOptions: { timestamps: true } })

@pre<Slides>('save', function () {
  if (!this._id) {
    this._id = uniqueSlugify(this.title)
  }

  if (!this.md5) {
    const { date, title, tag, header, content } = this
    this.md5 = SparkMD5.hash(stringify({ date, title, tag, header, content }))
  }
})
export class Slides implements ISlidesFull {
  @prop() _id!: string
  @prop({ default: {} }) header?: ISlidesSubHeader
  @prop() content!: ISlidesContent
  @prop({
    index: true,
    type: Date,
    set: (d) => {
      const t = customDateToEpoch(d)
      return t ? new Date(t) : undefined
    },
  }) date?: Date | string

  @prop({ index: true }) title?: string
  @prop({ index: true }) source?: string
  @prop({ default: [] }) tag?: string[]
  @prop({ unique: true, required: true }) md5?: string

  get raw () {
    const { _id: id, date, title, tag, header, content } = this

    return matter.stringify(Object.keys(content).sort().map((kSs) => {
      const ss = content[kSs]
      return Object.keys(ss).sort().map((kS) => ss[kS]).join('\n--\n')
    }).join('\n===\n'), {
      ...header, id, date, title, tag,
    }, {
      engines: {
        yaml: {
          stringify: (obj) => yaml.safeDump(obj, { skipInvalid: true, sortKeys: true }),
          parse: (s) => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA }),
        },
      },
    })
  }

  set raw (s: string) {
    const { data, content } = matter(s, { engines: { yaml: (s) => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA }) } })
    const { id, date, title, tag, ...header } = data
    this._id = id
    this.date = date
    this.title = title
    this.tag = tag
    this.header = header
    this.content = content.split(/\n===\n/g).map((ss) => {
      return ss.split(/\n--\n/g).reduce((prev, c, i) => {
        return {
          ...prev,
          [i.toString()]: c,
        }
      }, {})
    }).reduce((prev, c, i) => {
      return {
        ...prev,
        [i.toString()]: c,
      }
    }, {})
  }
}

export const SlidesModel = getModelForClass(Slides, { schemaOptions: { timestamps: true } })

@pre<Media>('save', function () {
  if (!this._id) {
    this._id = uniqueSlugify(this.filename)
  }
})
export class Media implements IMediaFull {
  @prop() _id!: string
  @prop({ required: true, index: true, unique: true }) filename!: string
  @prop({ index: true }) type?: string
  @prop({ required: true }) url!: string
  @prop({ required: true }) md5!: string
  @prop({ index: true }) source?: string
  @prop({ default: [] }) tag?: string[]
}

export const MediaModel = getModelForClass(Media, { schemaOptions: { timestamps: true } })

export async function mongoConnect (mongUri: string) {
  if (!cachedDb) {
    cachedDb = await mongoose.connect(mongUri, { useNewUrlParser: true, useUnifiedTopology: true })
  }
}
