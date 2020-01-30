import { NowRequest, NowResponse } from '@now/node'

import { PostsRouter } from '@blog-reveal/core'

export default async (req: NowRequest, res: NowResponse) => {
  const router = new PostsRouter(process.env.MONGO_URI!)
  res.json(await router.query(req))
}
