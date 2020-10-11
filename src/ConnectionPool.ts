import { Connection, ConnectionConfig } from 'tedious';
import { POOL_CONFIG, CONNECTION_POOLED } from './types';

/*
 * Wrapper for tedious so that a pool can be made without
 * too much meddling in what tedious already does well
 * http://tediousjs.github.io/tedious/api-connection.html
 */

export class ConnectionPool implements ConnectionPool {
    _dbConfig: ConnectionConfig;
    _poolConfig: POOL_CONFIG = {
        min: 1,
        max: 1,
        busyTimeout: 500,
        frequencyCheck: 50,
        maxCheckCount: function () {
            return this.busyTimeout / this.frequencyCheck;
        },
    };
    _pool: CONNECTION_POOLED[] = [];
    _pauseCreation: boolean = false;

    // Waiting for ready conditions to be met in constructor https://stackoverflow.com/a/50885340
    constructor(dbConfig: ConnectionConfig, poolConfig: POOL_CONFIG = {}) {
        // @ts-ignore
        return (async () => {
            this._dbConfig = dbConfig;
            this._poolConfig = { ...this._poolConfig, ...poolConfig };

            if (this._poolConfig.frequencyCheck > this._poolConfig.busyTimeout) return new Error('POOL_FREQUENCY_GREATER_THAN_TIMEOUT');
            if (this._poolConfig.min > this._poolConfig.max) return new Error('POOL_MIN_GREATER_THAN_MAX');
            await Promise.all(new Array(this._poolConfig.min).fill(null).map(() => this.createConnection()));

            // Pooling methods
            this.createConnection = this.createConnection.bind(this);
            this.findConnection = this.findConnection.bind(this);
            this.drain = this.drain.bind(this);

            // tedious method wrappers
            this.beginTransaction = this.beginTransaction.bind(this);
            this.callProcedure = this.callProcedure.bind(this);
            this.execSql = this.execSql.bind(this);
            this.execSqlBatch = this.execSqlBatch.bind(this);
            this.execBulkLoad = this.execBulkLoad.bind(this);
            this.execute = this.execute.bind(this);
            this.prepare = this.prepare.bind(this);
            this.unprepare = this.unprepare.bind(this);
            this.newBulkLoad = this.newBulkLoad.bind(this);

            return this;
        })();
    }

    private createConnection(): Promise<CONNECTION_POOLED> {
        return new Promise((resolve) => {
            if (this._pool.length >= this._poolConfig.max) throw new Error('POOL_AT_MAX');
            const connection: CONNECTION_POOLED = new Connection(this._dbConfig);
            connection.connect();
            connection.on('connect', () => {
                connection.index = (this._pool.push(connection) - 1);
                if (this._pauseCreation === true) this._pauseCreation = false;
                resolve(connection);
            });
            connection.on('end', () => {
                this._pool = this._pool.filter((_, i) => (i !== connection.index));
                // Everything after index those connection.index needs to be reduced by 1 to account for removed connection
                for (let x = connection.index; x < (this._pool.length - 1); x++) this._pool[x].index = (this._pool[x].index - 1);
                if (this._pool.length < this._poolConfig.min) this.createConnection();
            });
            // connection.on('debug', (msg) => console.log('TEDIOUS DEBUG: ', msg));
            connection.on('error', (err) => console.error('[tedious][error] - ', err));
            connection.on('errorMessage', (err) => console.error('[tedious][errorMessage] - ', err));
        });
    }

    private findConnection(checkCount = 0): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const openConnection = this._pool.findIndex((connection) => connection.state.name === 'LoggedIn');
            if (openConnection === -1) {
                if ((this._pool.length <= this._poolConfig.max) && !this._pauseCreation) {
                    this._pauseCreation = true;
                    const newConnection = await this.createConnection();
                    return newConnection.index;
                } else {
                    if (checkCount >= this._poolConfig.maxCheckCount()) reject(new Error('POOL_BUSY'));
                    setTimeout(() => resolve(this.findConnection(checkCount + 1)), this._poolConfig.frequencyCheck);
                }
            } else {
                resolve(openConnection);
            }
        });
    }

    drain() {
        this._pool.forEach((connection) => connection.close());
    }

    /*
     * The methods wrapped return the instance of
     * the connection so they can still be used
     * on those as they are tedious Connection
     * objects
     *
     * Methods not being wrapped:
     * - commitTransaction
     * - rollbackTransaction
     * - saveTransaction
     * - transaction
     * - cancel
     * - reset
     */
    async beginTransaction(callback, name, isolationLevel) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].beginTransaction(callback, name, isolationLevel);
        return this._pool[openConnection];
    }

    async callProcedure(request) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].callProcedure(request);
        return this._pool[openConnection];
    }

    async execSql(request) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].execSql(request);
        return this._pool[openConnection];
    }

    async execSqlBatch(request) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].execSqlBatch(request);
        return this._pool[openConnection];
    }

    async execBulkLoad(bulkLoad) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].execBulkLoad(bulkLoad);
        return this._pool[openConnection];
    }

    async execute(request, parameters) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].execute(request, parameters);
        return this._pool[openConnection];
    }

    async prepare(request) {
        await Promise.all(this._pool.map(async (connection) => connection.prepare(request)));
    }

    async unprepare(request) {
        await Promise.all(this._pool.map(async (connection) => connection.unprepare(request)));
    }

    async newBulkLoad(tableName, callback) {
        const openConnection = await this.findConnection();
        await this._pool[openConnection].newBulkLoad(tableName, callback);
        return this._pool[openConnection];
    }
}
