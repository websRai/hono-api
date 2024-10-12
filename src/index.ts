import { Hono } from 'hono'
import { Redis } from '@upstash/redis'

// Initialize Hono app
const app = new Hono()

// Initialize Upstash Redis client
const redis = new Redis({
  url: 'YOUR_UPSTASH_REDIS_URL',
  token: 'YOUR_UPSTASH_REDIS_TOKEN',
})

// Root route
app.get('/', (c) => c.text('Hello from Hono!'))

// Create a new item
app.post('/items', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await redis.set(`item:${id}`, JSON.stringify(body))
  return c.json({ id, ...body }, 201)
})

// Get an item by ID
app.get('/items/:id', async (c) => {
  const id = c.req.param('id')
  const item = await redis.get(`item:${id}`)
  if (!item) return c.notFound()
  return c.json(JSON.parse(item as string))
})

// Update an item
app.put('/items/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const exists = await redis.exists(`item:${id}`)
  if (!exists) return c.notFound()
  await redis.set(`item:${id}`, JSON.stringify(body))
  return c.json(body)
})

// Delete an item
app.delete('/items/:id', async (c) => {
  const id = c.req.param('id')
  const deleted = await redis.del(`item:${id}`)
  if (!deleted) return c.notFound()
  return c.text('Item deleted successfully', 200)
})

// List all items
app.get('/items', async (c) => {
  const keys = await redis.keys('item:*')
  const items = await Promise.all(
    keys.map(async (key) => {
      const item = await redis.get(key)
      return { id: key.split(':')[1], ...JSON.parse(item as string) }
    })
  )
  return c.json(items)
})

export default app