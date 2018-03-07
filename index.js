const express = require('express')
const app = express()

const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  name: String,
  age: Number,
  living: Boolean
})

const UserModel = mongoose.model('user', UserSchema)

app.get('/', async (req, res) => {
  const users = await UserModel.find({})

  res.json(users)
})

const start = async () => {
  mongoose.Promise = global.Promise

  let db
  try {
    db = await mongoose.connect(process.env.DB_HOST)
    process.on('SIGTERM', () => db.close())

    console.log('MongoDB connected, starting up webserver...')

    const PORT = process.env.APP_PORT

    app.listen(PORT, _ => console.log(`Server is now running on http://localhost:${PORT}`))
  } catch (err) {
    console.error(err)
    if (db) db.close()
  }
}

start()
