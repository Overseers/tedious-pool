# tedious-pool

## Summary
tedious-pool brings `ConnectionPool` to the [tedious](https://www.npmjs.com/package/tedious) suite. This enables a pool of connections to be made to a single database, and the requests that come in are spread across the connections to allow for greater bandwidth. This is meant to compliment tedious as it simply adds the new class, `ConnectionPool`, to the mix. The parameters that are passed to it's methods are identical to the corresponding tedious `Connection` methods, with the exceptions of `commitTransaction()`, `rollbackTransaction()`, `saveTransaction()`, `transaction()`, `cancel()`, and `reset()`. The other methods not mentioned return the tedious instance of the connection that the request is being performed on from the pool so those methods mention can then be leveraged as needed. All the documentation on tedious can be found [here](http://tediousjs.github.io/tedious/). All tedious exports are also available for convenience.

## Parameters
- [Database Config](http://tediousjs.github.io/tedious/api-connection.html#function_newConnection) - Object, required
- Pool Config - Object, not required

Pool Config:
|Property|Type|Default|
|---|---|---|
|min|number|1|
|max|number|1|
|busyTimeout|number|500|
|frequencyCheck|number|50|

## Use
```
const { ConnectionPool } = require('tedious-pool');

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
/* Utilize the methods provided by tedious from here */
/*
 * Methods not available from ConnectionPool as they require reuse of a connection:
 * - commitTransaction
 * - rollbackTransaction
 * - saveTransaction
 * - transaction
 * - cancel
 * - reset
 */
 async function test() {
    const connectionWithTransaction = await dbPool.beginTransaction(/*callback*/, /*name*/, /*isolationLevel*/);
    // Perform any transaction based methods with the reference to the connection pool
    connectionWithTransaction.rollbackTransaction(/*callback*/);
}
// Or
function anotherTest() {
    dbPool.beginTransaction(/*callback*/, /*name*/, /*isolationLevel*/).then((connectionWithTransaction) => {
        connectionWithTransaction.rollbackTransaction(/*callback*/);
    });
}
```
