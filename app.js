const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const app = express(); // DO NOT DELETE
const bodyParser = require('body-parser');
const urlEncodedParser = bodyParser.urlencoded({ extended: false });
const validate = require('jsonschema').validate;

const database = require('./database');
const { Validator } = require('jsonschema');

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
const v = new Validator(); //json Schema
const updateQueueSchema = {
    type: 'object',
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        },
        status: {
            type: 'string',
            pattern: '^DEACTIVATE|ACTIVATE$'
        },
    }
};
const checkQueueSchema = {
    type: 'object',
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        },
        customer_id: {
            type: 'string',
            pattern: '^[0-9]{10}$'
        },
    }
};
const createQueueSchema = {
    type: 'object',
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        },
        company_id: {
            type: 'integer',
            minimum:1000000000,
            maximum:9999999999
        },
    }
};
const serverAvailableSchema = {
    type: 'object',
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        }
    }
};
const joinQueueSchema = {
    type: 'object',
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        },
        customer_id: {
            type: 'integer',
            minimum:1000000000,
            maximum:9999999999
        },
    }
};
const ArrivalRateSchema = {
    type: 'object',
    required: ['duration'],
    properties: {
        queue_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
            minLength: 10,
            maxLength: 10
        },
        from: {
            type: 'string',
        },
        duration: {
            type: 'integer',
            minimum: 1,
            maximum: 1440
        },
    }
};

/**
 * ========================== RESET API =========================
 */

/**
 * Reset API
 */
app.post('/reset', function (req, res, next) {
    database.resetTables()
        .then(() => {
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
    const instance = {
        queue_id: queue_id,
        company_id: company_id
    };
    const validResult = validate(instance, createQueueSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.createQueue(queue_id.toUpperCase(), company_id)
            .then(() => {
                res.status(201);
                res.send();
            })
            .catch((error) => {
                if (error.code == '23505') next({ status: 422, message: `Queue Id ${queue_id} already exists`, code: 'QUEUE_EXISTS' });
                next(error);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        } else if (validResult.errors[0].stack == 'instance.company_id does not match pattern "^[0-9]{10}$"') {
            next({ status: 422, message: 'Company_id should be 10 digits', code: 'INVALID_JSON_BODY' });
        } else {next({status:422, message:validResult.errors});}
    }
})
/** 
 * Company: Update Queue
 */
app.put('/company/queue', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const status = req.body.status;
    const instance = {
        queue_id: queue_id,
        status: status
    };
    const validResult = validate(instance, updateQueueSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.updateQueue(queue_id.toUpperCase(), status)
            .then(() => {
                res.status(200);
                res.send();
            })
            .catch(function (err) {
                console.log(err.message);
                if (err.message == 'Cannot read property \'queue_id\' of undefined') {
                    next({ status: 404, message: "error - queue id does not exists", code: 'UNKNOWN_QUEUE' });
                }
                next(error);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        }
    }
})
/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res, next) {
    const queue_id = req.body.queue_id;
    const instance = {
        queue_id: queue_id
    };
    const validResult = validate(instance, serverAvailableSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.serverAvailable(queue_id.toUpperCase())
            .then((customer_id) => {
                res.status(200);
                res.json({ customer_id: customer_id });
            })
            .catch(function (err) {
                console.log(err.message);
                if (err.message == 'Cannot read property \'queue_id\' of undefined') {
                    next({ status: 404, message: "error - queue id does not exists", code: 'UNKNOWN_QUEUE' });
                }
                next(err);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        }
    }
})
/**
 * Company: Arrival Rate 
 */
app.get('/company/arrival_rate', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const from = req.query.from;
    const duration = parseInt(req.query.duration);
    const instance = {
        queue_id: queue_id,
        from: from,
        duration: duration
    };
    const validResult = validate(instance, ArrivalRateSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.arrivalRate(queue_id.toUpperCase(), from, duration)
            .then((resultArr) => {
                setTimeout(function () { console.log(resultArr); }, 2000); //log is executed before promise so delay it
                res.status(200);
                res.json(resultArr);
            })
            .catch(function (error) {
                console.log(error.message);
                if (error.message == 'Cannot read property \'queue_id\' of undefined') {
                    next({ status: 404, message: "error - queue id does not exists", code: 'UNKNOWN_QUEUE' });
                }
                next(error);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        }
        else if (validResult.errors[0].stack == 'instance.duration must be greater than or equal to 1') {
            next({ status: 400, message: "error - duration negative", code: 'INVALID_QUERY_STRING' });
        }
        else if (validResult.errors[0].stack == 'instance.duration must be less than or equal to 1440') {
            next({ status: 400, message: "error - duration over 1440", code: 'INVALID_QUERY_STRING' });
        }
        else if (validResult.errors[0].stack == 'instance.duration is not of a type(s) integer') {
            next({ status: 400, message: "error - duration NaN", code: 'INVALID_QUERY_STRING' });
        }
    }
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
    const instance = {
        queue_id: queue_id,
        customer_id: customer_id
    };
    const validResult = validate(instance, joinQueueSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.joinQueue(queue_id.toUpperCase(), customer_id)
            .then(() => {
                res.status(201);
                res.send();
            })
            .catch((error) => {
                if (error.code == 'ERR01') next({ status: 422, message: `Customer ${customer_id} already in Queue ${queue_id}`, code: 'ALREADY_IN_QUEUE' });
                if (error.code == 'ERR02') next({ status: 422, message: `Queue ${queue_id} is inactive`, code: 'INACTIVE_QUEUE' });
                if (error.code == 'ERR03') next({ status: 404, message: `Queue ${queue_id} is not found`, code: 'UNKNOWN_QUEUE' });
                next(error);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        } else if (validResult.errors[0].stack == 'instance.customer_id does not match pattern "^[0-9]{10}$"') {
            next({ status: 422, message: 'Customer_id should be 10 digits', code: 'INVALID_JSON_BODY' });
        }else{next();}
    }
})
/**
 * Customer: Check Queue
 */
app.get('/customer/queue/', function (req, res, next) {
    const queue_id = req.query.queue_id;
    const customer_id = req.query.customer_id;
    const instance = {
        queue_id: queue_id,
        customer_id: customer_id
    };
    const validResult = validate(instance, checkQueueSchema); //validate jsonschema
    if (validResult.valid == true) {
        database.checkQueue(queue_id.toUpperCase(), customer_id)
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
                if (err.message == 'Cannot read property \'queue_id\' of undefined') {
                    next({ status: 404, message: "error - queue id does not exists", code: 'UNKNOWN_QUEUE' });
                }
                next(error);
            })
    } else {
        if (validResult.errors[0].stack == 'instance.queue_id does not meet maximum length of 10' ||
            validResult.errors[0].stack == 'instance.queue_id does not meet minimum length of 10') {
            next({ status: 422, message: "Queue_id is not 10 characters", code: "INVALID_JSON_BODY" });
        }else if (validResult.errors[0].stack == 'instance.customer_id does not match pattern "^[0-9]{10}$"') {
            next({ status: 422, message: 'Customer_id should be 10 digits', code: 'INVALID_JSON_BODY' });
        }
    }
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
