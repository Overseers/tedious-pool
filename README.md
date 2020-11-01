# tedious-pool

## Summary
tedious-pool brings `ConnectionPool` to the [tedious module](https://www.npmjs.com/package/tedious). This enables a pool of connections to be made to a single database, and the requests that come in are spread across the connections to allow for greater bandwidth. This is meant to compliment tedious as it simply adds the new class, `ConnectionPool`, to the mix. The parameters that are passed to it's methods are identical to the corresponding tedious `Connection` methods. [Documentation on tedious](http://tediousjs.github.io/tedious/).

## Methods Ported
- `beginTransaction()`
- `callProcedure()`
- `execSql()`
- `execSqlBatch()`
- `execBulkLoad()`
- `execute()`
- `prepare()`
- `unprepare()`
- `newBulkLoad()`

## Methods Not Ported
This is not to say that these can't be used, but that they have to be used on a specific connection and thus not inherently compatible with this module. To counter said predicament, a reference to the singular connection is returned from the methods enabling the use of these methods on that connection. Be mindful that individual connections are subject to being used in the pool at any given time and may be in use arbitrarily.
- `commitTransaction()`
- `rollbackTransaction()`
- `saveTransaction()`
- `transaction()`
- `cancel()`
- `reset()`

## Parameters
- [Database Config](http://tediousjs.github.io/tedious/api-connection.html#function_newConnection) - Object, required
- Pool Config - Object, not required

Pool Config:
|Property|Type|Default|Units|
|---|---|---|---|
|min|number|1|eaches|
|max|number|1|eaches|
|busyTimeout|number|500|ms|
|frequencyCheck|number|50|eaches|

## Usage
```
const ConnectionPool = require('tedious-pool');

const dbPool = new ConnectionPool(
    { // Database config
        server: 'some db server',
        authentication: { /*...*/ },
        options: { /*...*/ }
    },
    { // Pool config
        min: 1,
        max: 4,
        busyTimeout: 500,
        frequencyCheck: 50
    }
);

async function asyncRequest() {
    // Create tedious Request object
    const request = new Request('SELECT someColumn FROM someTable', (err, rowCount, rows) => { /*...*/ } );
    // Handle request incoming data as per tedious
    request.on('row', (columns) => { /*...*/ });
    await connectionPool.execSql(request);
}

async function asyncTransaction() {
    const connectionWithTransaction = await dbPool.beginTransaction(/*callback*/, /*name*/, /*isolationLevel*/);
    // Perform any transaction based methods with the reference to the connection pool
    connectionWithTransaction.rollbackTransaction(/*callback*/);
}
// Or
function chainTransaction() {
    dbPool.beginTransaction(/*callback*/, /*name*/, /*isolationLevel*/).then((connectionWithTransaction) => {
        connectionWithTransaction.rollbackTransaction(/*callback*/);
    });
}
```
