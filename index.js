const express = require('express')
const app = express()
const redis = require('redis')
const client = redis.createClient({host: process.env.REDIS_HOST})
const {promisify} = require('util')
const crypto = require('crypto')
const asyncGet = promisify(client.get).bind(client)
const asyncSet = promisify(client.set).bind(client)
const cors = require('cors')
const bodyParser = require('body-parser')
const router = express.Router()

const start = async () => {
  mongoose.Promise = global.Promise

  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.DB_HOST)
    process.on('SIGTERM', () => {
      mongoose.disconnect()
      process.exit(1)
    })

    console.log('MongoDB connected, starting up webserver...')

    const PORT = process.env.APP_PORT

    app.listen(PORT, _ => console.log(`Server is now running on http://localhost:${PORT}`))
  } catch (err) {
    console.error(err)
    mongoose.disconnect()

    process.exit(1)
  }
}

console.log('Connecting to Redis...')
client.on('error', err => console.error(err))

client.once('ready', async () => {
  console.log('Connected to Redis!')

  const secret = await asyncGet('secret')

  if (!secret) await asyncSet('secret', process.env.SESSION_SECRET)

  start()
})

const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  name: String,
  age: Number,
  living: Boolean
})

const UserModel = mongoose.model('user', UserSchema)

app.use(cors())
app.use(bodyParser.json())
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)

  next()
})
app.post('/login', async (req, res) => res.send(process.env.SESSION_SECRET))

router.route('/')
  .get(async (req, res) => {
    const users = await UserModel.find({})

    res.json(users)
  })
  .post(async (req, res) => {
    const user = new UserModel(req.body)

    await user.save()

    res.status(201).json(user)
  })

router.route('/:id')
  .get(async (req, res) => {
    const user = await UserModel.findById(req.params.id)

    res.json(user)
  })
  .put(async (req, res) => {
    await UserModel.update({_id: req.params.id}, req.body)

    res.status(204).end()
  })
  .delete(async (req, res) => {
    await UserModel.remove({_id: req.params.id})

    res.end()
  })

app.use('/users', async (req, res, next) => {
  const secret = req.get('Authorization')
  const redisSecret = await asyncGet('secret')

  if (secret !== redisSecret) return next(new Error('invalid session secret'))

  next()
}, router)

app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).send(err.toString())
})