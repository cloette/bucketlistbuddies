const rateLimit = require('express-rate-limit')

function make(max, windowMs, message) {
  return rateLimit({
    max,
    windowMs,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

module.exports = {
  generalLimiter: make(100, 15 * 60 * 1000, 'Too many requests, please try again later.'),
  ideaLimiter:   make(10,  60 * 60 * 1000, 'You can submit up to 10 ideas per hour.'),
  forumLimiter:  make(20,  60 * 60 * 1000, 'You can create up to 20 forum posts per hour.'),
  commentLimiter: make(60, 60 * 60 * 1000, 'You can post up to 60 comments per hour.'),
  dmLimiter:     make(60,  60 * 60 * 1000, 'You can send up to 60 messages per hour.'),
}
