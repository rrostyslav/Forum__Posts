const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const request = require('request');
const morgan = require('morgan');
const dbPool = require('./middleware/dbConnectionPool');

if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

const postRoutes = require('./routes');
const sectionRoutes = require('./routes/sections')

app.use(cors());
app.use(bodyparser.json());
app.use(morgan('dev'));
app.use(dbPool);

app.use('/section', sectionRoutes);
app.use('/post', postRoutes);

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
})

app.listen(PORT, () => {
    console.log('Microservice: Posts. Running on port:', PORT)
})