const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const app = express(); // DO NOT DELETE
const bodyParser = require('body-parser');
const urlEncodedParser = bodyParser.urlencoded({ extended: false });

const database = require('./database');

app.use(morgan('dev'));
app.use(cors());
app.use(urlEncodedParser);
app.use(bodyParser.json());
app.use(express.json());

/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */

/**
 * ========================== SETUP APP =========================
 */

/**
 * JSON Body
 */

/**
 * ========================== RESET API =========================
 */

/**
 * Reset API
 */
app.post('/reset', function (req, res, next) {
    database.resetTables()
        .then((result) => {
            res.status(200);
            res.send();
        })
        .catch(next)
})
/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 */
app.post('/company/queue', function (req, res, next) {
    const queue_id = req.body.queue_id;
    const company_id = req.body.company_id;
    database.createQueue(queue_id.toUpperCase(), company_id)
        .then(() => {
            res.status(201);
            res.send();
        })
        .catch((error) => {
            if (error.code == '23505') next({ status: 422, message: `Queue Id ${queue_id} already exists`, code: 'QUEUE_EXISTS' });
            if (error.code == '10C') next({ status: 400, message: `Customer Id should be 10-digits"`, code: 'INVALID_JSON_BODY' });
            next(error);
        })
})
/** 
 * Company: Update Queue
 */
app.put('/company/queue', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const status = req.body.status;
    database.updateQueue(queue_id.toUpperCase(), status)
        .then(() => {
            res.status(200);
            res.send();
        })
        .catch((error) => {
            if (error.code == 'NF') next({ status: 404, message: `Queue Id ${queue_id} Not Found`, code: 'UNKNOWN_QUEUE' });
            if (error.code == '10C') next({ status: 400, message: `Queue_id should be 10 characters`, code: 'INVALID_QUERY_STRING' });
            next(error);
        })
})
/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res, next) {
    const queue_id = req.body.queue_id;
    database.serverAvailable(queue_id.toUpperCase())
        .then(() => {
            res.status(200);
            res.json({ customer_id: customer_id })
        })
        .catch((error) => {
            if (error.code == 'NF') next({ status: 404, message: `Queue Id ${queue_id} Not Found`, code: 'UNKNOWN_QUEUE' });
            if (error.code == '10C') next({ status: 400, message: `Customer Id should be 10-digits`, code: 'INVALID_JSON_BODY' });
            next(error);
        })
})
/**
 * Company: Arrival Rate 
 */
app.get('/company/arrival_rate', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const from = req.query.from;
    const duration = req.query.duration;
    if (duration < 0) {
        return next({ status: 400, message: "error - duration negative", code: 'INVALID_QUERY_STRING' });
    } else if (isNaN(Number(duration))) {
        return next({ status: 400, message: "error - duration NaN", code: 'INVALID_QUERY_STRING' });
    }
    database.arrivalRate(queue_id.toUpperCase(), from, duration)
        .then((resultArr) => {
            setTimeout(function () { console.log(resultArr); }, 2000); //log is executed before promise so delay it
            res.status(200);
            res.json(resultArr);
        })
        .catch((error) => {
            if (error.code == 'NF') next({ status: 404, message: `Queue Id ${queue_id} Not Found`, code: 'UNKNOWN_QUEUE' });
            if (error.code == '10C') next({ status: 400, message: `Customer Id should be 10-digits`, code: 'INVALID_QUERY_STRING' });
            next(error);
        })
})
/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 */
app.post('/customer/queue', function (req, res, next) {
    const queue_id = req.body.queue_id;
    const customer_id = req.body.customer_id;
    database.joinQueue(queue_id.toUpperCase(), customer_id)
        .then(() => {
            res.status(201);
            res.send();
        })
        .catch((error) => {
            if (error.code == 'ERR03') next({ status: 404, message: `Queue Id ${queue_id} Not Found`, code: 'UNKNOWN_QUEUE' });
            if (error.code == 'ERR01') next({ status: 422, message: `Customer ${customer_id} already in Queue ${queue_id}`, code: 'ALREADY_IN_QUEUE' });
            if (error.code == 'ERR02') next({ status: 422, message: `Queue ${queue_id} is inactive`, code: 'INACTIVE_QUEUE' });
            if (error.code == 'ERR04') next({ status: 400, message: `Customer Id should be 10-digits`, code: 'INVALID_JSON_BODY' });
            next(error);
        })
})
/**
 * Customer: Check Queue
 */
app.get('/customer/queue/', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const customerId = req.query.customer_id;
    database.checkQueue(queue_id.toUpperCase(), customerId)
        .then(() => {
            res.status(200);
            res.json({
                queue_no: queue_id,
                total: total,
                status: status,
                ahead: ahead,
            });
        })
        .catch((error) => {
            if (error.code == 'ERR03') next({ status: 404, message: `Queue Id ${queue_id} Not Found`, code: 'UNKNOWN_QUEUE' });
            if (error.code == 'ERR04') next({ status: 400, message: `Customer Id should be 10-digits`, code: 'INVALID_QUERY_STRING' });
            next(error);
        })
})


/**
 * ========================== UTILS =========================
 */

/**
 * 404
 */
app.use((req, res, next) => {
    next({
        status: 404,
        message: 'Looks like a ghost',
        code: 'NOT_FOUND'
    })
})

/**
 * Error Handler
 */
app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        error: (error.message || 'Unable to establish connection with database'),
        code: (error.code || 'UNEXPECTED_ERROR')
    });
})


function tearDown() {
    // DO NOT DELETE
    return database.closeDatabaseConnections();
}

/**
 *  NOTE! DO NOT RUN THE APP IN THIS FILE.
 *
 *  Create a new file (e.g. server.js) which imports app from this file and run it in server.js
 */

module.exports = { app, tearDown }; // DO NOT DELETE
