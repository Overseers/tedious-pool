import {
    Connection,
    Request,
    ConnectionConfig,
    BulkLoad
} from 'tedious';

export interface ConnectionPool {
    _dbConfig: ConnectionConfig;
    _poolConfig: POOL_CONFIG;
    _pool: CONNECTION_POOLED[];
    _pauseCreation: boolean;
    createConnection: () => Promise<CONNECTION_POOLED>;
    findConnection: () => Promise<number>;
    drain: () => void;
    beginTransaction: (Function, string, number) => Promise<CONNECTION_POOLED>;
    callProcedure: (Request) => Promise<CONNECTION_POOLED>;
    execSql: (Request) => Promise<CONNECTION_POOLED>;
    execSqlBatch: (Request) => Promise<CONNECTION_POOLED>;
    execBulkLoad: (BulkLoad) => Promise<CONNECTION_POOLED>;
    execute: (Request, { }) => Promise<CONNECTION_POOLED>;
    prepare: (Request) => void;
    unprepare: (Request) => void;
    newBulkLoad: (string, Function) => Promise<CONNECTION_POOLED>;
};

export type POOL_CONFIG = {
    min?: number,
    max?: number,
    busyTimeout?: number,
    frequencyCheck?: number,
    maxCheckCount?: () => number;
};

export type CONNECTION_POOLED = {
    index?: number;
    state?: {
        name: string;
    };
    connect?: () => void;
} & Connection;
