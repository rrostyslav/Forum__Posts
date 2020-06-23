'use strict';
const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const request = require('request');
const morgan = require('morgan');
const dbPool = require('./middleware/dbConnectionPool');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3004;

const Routes = require('./routes');

app.use(cors());
app.use(bodyparser.json());
app.use(morgan('dev'));
app.use(dbPool);

app.use('/', Routes);

app.use((error, req, res, next) => {
  res.status(200).json({
    success: false,
    code: error.status,
    message: error.message
  });
})

app.listen(PORT, () => {
  console.log('Microservice: Posts. Running on port:', PORT)
})