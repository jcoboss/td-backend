const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
require('dotenv').config()
const DBConnection = require("./helpers/MySQLConnection");
const UserRoutes = require("./routes/User");
const AuthRoutes = require("./routes/Authenticator");
const cors = require('cors')

const app = express()
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get('/', async (req, res, next) => {
  res.send('Hello from express.')
})
app.use('/user', UserRoutes);
app.use('/auth', AuthRoutes);

const PORT = process.env.SERVICE_PORT || 7080

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  DBConnection.destroy();
  process.exit(0);
}
