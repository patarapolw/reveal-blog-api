const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const dotenv = require('dotenv')
dotenv.config()

if (!fs.existsSync(path.join(__dirname, 'now.json'))) {
  if (!process.env.MONGO_URI) {
    process.exit(1)
  }

  fs.writeFileSync(path.join(__dirname, 'now.json'), JSON.stringify({
    version: 2,
    env: Object.keys(process.env)
      .filter((k) => /^(MONGO|CLOUDINARY|EXCERPT)/.test(k))
      .reduce((prev, c) => ({ ...prev, [c]: process.env[c] }), {}),
  }, null, 2))
}

if (!process.env.NO_PUBLISH) {
  spawnSync('lerna', ['publish'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
  })
}
