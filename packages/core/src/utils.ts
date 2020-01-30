import moment from 'moment'
import yaml from 'js-yaml'

export function getExcerptSeparator () {
  return process.env.EXCERPT_SEPARATOR || '<!-- excerpt_separator -->'
}

export function getExcerptLength () {
  return parseInt(process.env.EXCERPT_LENGTH || '200')
}

export function customDateToEpoch (date?: string | Date) {
  if (!date) {
    return null
  }

  /**
   * Moment will default timezone to local if not specified, unlike Date.parse
   *
   * https://momentjs.com/docs/#/parsing/
   *
   * See #please-read
   */
  let m = moment(date, [
    'YYYY-MM-DD HH:MM ZZ',
    'YYYY-MM-DD ZZ',
    'YYYY-MM-DD HH:MM',
    'YYYY-MM-DD',
    'YYYY-MM',
  ])

  if (m.isValid()) {
    /**
     * moment().unix() is in seconds
     */
    return m.unix() * 1000
  }

  m = moment(date)

  if (m.isValid()) {
    return m.unix() * 1000
  }

  return null
}

export function parseQ (
  q: string,
  anyOf: string[] = ['tag', 'title', 'name', 'filename'],
): Record<string, any> {
  q = q.trim()
  if (!q) {
    return {}
  }

  if (/\{.*\}/.test(q)) {
    try {
      return yaml.safeLoad(q, { schema: yaml.JSON_SCHEMA })
    } catch (e) {}
  }

  return {
    $or: anyOf.map((k) => {
      return {
        [k]: {
          $regex: `(${q.split(/ +/g)
            .map((el) => el.trim())
            .filter((el) => el)
            .map((el) => escapeRegExp(el))
            .join('|')})`,
          $options: 'i',
        },
      }
    }),
  }
}

function escapeRegExp (s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
