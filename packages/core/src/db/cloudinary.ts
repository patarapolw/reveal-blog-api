/* eslint-disable camelcase */
import cloudinary from 'cloudinary'

export interface ICloudinaryConfig {
  api_key?: string
  api_secret?: string
  cloud_name?: string
  url?: string
  uploadFolder?: string
  prefix?: string
}

export function cloudinaryConnect (config: ICloudinaryConfig) {
  if (config.url) {
    const [_, api_key, api_secret, cloud_name] = /\/\/([^:]+):([^@]+)@([^/]+)/.exec(config.url) || [] as string[]
    Object.assign(config, { api_key, api_secret, cloud_name })
  }

  cloudinary.v2.config(config)
}
