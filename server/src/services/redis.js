const Redis = require('ioredis')

const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('error', err => {
  // Log but don't crash — app stays up if Redis is unavailable
  console.error('[redis]', err.message)
})

module.exports = redis
