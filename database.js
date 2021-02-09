const { Client } = require('pg');

// postgres sql link
var connectionString = 'postgres://gkerbwhl:FgLLyy2Yda-bqWsebhnd_bkYss7Wxhon@john.db.elephantsql.com:5432/gkerbwhl';

/** 
 * Reset Tables
 */
function resetTables() {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `TRUNCATE TABLE customer; TRUNCATE TABLE queue;`; // Removing data from the tables
    return client
        .query(sql)
        .then((result) => {
            client.end();
            return result;
        })
        .catch((error) => {
            client.end();
            throw error;
        })
}
/** 
 * Create Queue
 */
function createQueue(queue_id, company_id) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `INSERT INTO queue (queue_id, company_id) values ($1, $2);`; // Creating a new row in queue table
    const sqlParams = [queue_id, company_id];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            client.end();
            return result.rows;
        })
        .catch((error) => {
            client.end();
            throw error;
        })
}
/** 
 * Update Queue
 */
function updateQueue(queue_id, status) {
    const client = new Client({ connectionString });
    client.connect();
    if (status == "DEACTIVATE") {  //setting queue status based on what it was
        status = "inactive";
    } else if (status == "ACTIVATE") {
        status = "active";
    }
    const sql = `UPDATE queue SET status = $2 WHERE queue_id = $1;`; // updating the queue status in queue table
    const sqlParams = [queue_id.toUpperCase(), status];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            {
                client.end();
                return result.rows;
            }
        })
        .catch((error) => {
            client.end();
            throw error;
        })
}
/** 
 * Join Queue
 */
function joinQueue(queue_id, customer_id) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `SELECT * FROM queue WHERE queue_id = $1;`; // checking for queues currently in queue table
    const sqlParams = [queue_id];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            if (result.rowCount == 0) { // check if queue exist
                client.end();
                error = { code: "ERR03" };
                throw error;
            } else if (result.rows[0].status == 'inactive') { // check for inactive
                client.end();
                error = { code: "ERR02" };
                throw error;
            } else {
                const sql = `SELECT FROM customer WHERE queue_id = $1 AND customer_id = $2;`; // finding customer in queue
                const sqlParams = [queue_id, customer_id];
                return client
                    .query(sql, sqlParams)
                    .then((result) => {
                        if (result.rowCount != 0) { //check if customer alr inside q
                            client.end();
                            error = { code: "ERR01" };
                            throw error;
                        } else {
                            const sql = `INSERT INTO customer (queue_id, customer_id) VALUES($1, $2);`; // adding customer to queue table
                            const sqlParams = [queue_id, customer_id];
                            return client
                                .query(sql, sqlParams)
                                .then((result) => {
                                    client.end();
                                    return result;
                                })
                                .catch((error) => {
                                    client.end();
                                    throw error;
                                })
                        }
                    })
            }
        })
}
/** 
 * Check Queue
 */
function checkQueue(queue_id, customer_id) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `SELECT * FROM customer WHERE queue_id = $1;`; // finding customer with the queue id
    const sqlParams = [queue_id];
    return client
        .query(sql, sqlParams)
        .then((result) => { //check total and ahead in q
            total = result.rowCount;
            ahead = 0;
            flag = false;
            for (i = 0; i < total; i++) {
                if (result.rows[i].customer_id != customer_id) { //keep looping until reach custid passed in
                    ahead++; //increment ahead until match
                } else {
                    flag = true;
                    break;
                }
            }
            if (flag == false) {
                ahead = -1; //set to -1 if not in q
            }
            const sql = `SELECT FROM queue WHERE queue_id = $1 AND status = 'inactive';`;//check if queue active
            const sqlParams = [queue_id];
            return client
                .query(sql, sqlParams)
                .then((result) => {
                    if (result.rowCount == 0) {
                        status = "active";
                        client.end();
                        return { total: total, status: status, ahead: ahead };
                    } else {
                        status = "inactive";
                        client.end();
                        return { total: total, status: status, ahead: ahead };
                    }
                })
                .catch((error) => {
                    client.end();
                    throw error;
                })
        })
}
/** 
 * Server Available
 */
function serverAvailable(queue_id) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `SELECT * FROM customer Where queue_id = $1 LIMIT 1;`; // selecting the first customer in queue
    const sqlParams = [queue_id];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            if (result.rowCount == 0) {//check if there is any customer in queue
                client.end();
                result = 0;
                return result;
            } else {
                const sql = `DELETE FROM customer where customer_id = $1 and queue_id= $2;`; // after customer is selected , will be removed from queue
                const sqlParams = [result.rows[0].customer_id, queue_id]
                customer_id = result.rows[0].customer_id;

                return client.query(sql, sqlParams)
                    .then(() => {
                        client.end();
                        return customer_id;
                    })
                    .catch((error) => {
                        client.end();
                        throw error;
                    })
            }
        })
}

function getQueue(queue_id) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `SELECT FROM queue_tab WHERE queue_id = $1;`;//check if queue active
    const sqlParams = [queue_id];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            console.log(result);
            return result;
        })
        .catch((error) => {
            client.end();
            throw error;
        })
}

/** 
 * Arrival Rate
 */
function arrivalRate(queue_id, from, duration) {
    const client = new Client({ connectionString });
    client.connect();
    const sql = `select * from customer where queue_id = $1 and joined_at between 
                $2::timestamp and $2::timestamp + ($3 ||' minutes')::interval order by joined_at ASC;`; // selecting customers from the timestamp to the duration
    const sqlParams = [queue_id, from, duration];
    return client
        .query(sql, sqlParams)
        .then((result) => {
            let time = [],
                count = [],
                resultArr = [],
                prev;
            for (let i = 0; i < result.rows.length; i++) {
                let currentTime = Math.trunc(new Date(result.rows[i].joined_at).getTime() / 1000); // formatting the time to timestamp
                if (currentTime != prev) {
                    time.push(currentTime);
                    count.push(1);
                } else {
                    count[count.length - 1]++;
                }
                prev = currentTime;
            }
            for (let i = 0; i < time.length; i++) { // looping through values from array to insert into proper format
                resultArr.push({
                    timestamp: time[i],
                    count: count[i].toString()
                })
            }
            client.end();
            return resultArr;
        })
}


function closeDatabaseConnections() {  // disconnecting the current client that is still in use if any
    return client.end(err => {
        console.log('client has disconnected');
        if (err) {
            console.log('error during disconnection', err.stack);
        }
    })
}

module.exports = {
    resetTables,
    createQueue,
    getQueue,
    updateQueue,
    joinQueue,
    checkQueue,
    serverAvailable,
    arrivalRate,
    closeDatabaseConnections,
};
