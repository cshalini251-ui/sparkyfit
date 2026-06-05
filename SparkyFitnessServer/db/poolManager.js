const { Pool, types } = require('pg');
const { log } = require('../config/logging');

// Parse numeric types
types.setTypeParser(types.builtins.NUMERIC, value => parseFloat(value));

let ownerPoolInstance = null;
let appPoolInstance = null;

// Mock Mongo Pool implementation
class MockMongoPool {
  constructor(userId = null) {
    this.userId = userId;
  }

  query(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const mongoQueryEngine = require('./mongoQueryEngine');
    mongoQueryEngine.executeSQL(sql, params, this.userId)
      .then(res => {
        if (callback) callback(null, res);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  }

  async connect() {
    return {
      query: async (sql, params = []) => {
        const mongoQueryEngine = require('./mongoQueryEngine');
        return mongoQueryEngine.executeSQL(sql, params, this.userId);
      },
      release: () => {}
    };
  }

  on(event, handler) {
    return this;
  }

  async end() {
    // No-op
  }
}

function createOwnerPoolInstance() {
  if (process.env.MONGODB_URI) {
    log('info', 'Using Mock Mongo Pool for Owner');
    return new MockMongoPool();
  }

  const newPool = new Pool({
    user: process.env.SPARKY_FITNESS_DB_USER,
    host: process.env.SPARKY_FITNESS_DB_HOST,
    database: process.env.SPARKY_FITNESS_DB_NAME,
    password: process.env.SPARKY_FITNESS_DB_PASSWORD,
    port: process.env.SPARKY_FITNESS_DB_PORT,
  });

  newPool.on('error', (err, client) => {
    log('error', 'Unexpected error on idle owner client', err);
    process.exit(-1);
  });

  return newPool;
}

function createAppPoolInstance() {
  if (process.env.MONGODB_URI) {
    log('info', 'Using Mock Mongo Pool for App');
    return new MockMongoPool();
  }

  const newPool = new Pool({
    user: process.env.SPARKY_FITNESS_APP_DB_USER,
    host: process.env.SPARKY_FITNESS_DB_HOST,
    database: process.env.SPARKY_FITNESS_DB_NAME,
    password: process.env.SPARKY_FITNESS_APP_DB_PASSWORD,
    port: process.env.SPARKY_FITNESS_DB_PORT,
  });

  newPool.on('error', (err, client) => {
    log('error', 'Unexpected error on idle app client', err);
    process.exit(-1);
  });

  return newPool;
}

function _getRawOwnerPool() {
  if (!ownerPoolInstance) {
    ownerPoolInstance = createOwnerPoolInstance();
  }
  return ownerPoolInstance;
}

function _getRawAppPool() {
  if (!appPoolInstance) {
    appPoolInstance = createAppPoolInstance();
  }
  return appPoolInstance;
}

async function getClient(userId) {
  if (!userId) {
    throw new Error("userId is required for getClient to ensure RLS is applied.");
  }
  if (process.env.MONGODB_URI) {
    return new MockMongoPool(userId).connect();
  }
  const client = await _getRawAppPool().connect();
  await client.query(`SELECT public.set_user_id($1)`, [userId]);
  return client;
}

async function getSystemClient() {
  if (process.env.MONGODB_URI) {
    return new MockMongoPool().connect();
  }
  const client = await _getRawOwnerPool().connect();
  return client;
}

async function endPool() {
  if (ownerPoolInstance) {
    log('info', 'Ending existing owner database connection pool...');
    await ownerPoolInstance.end();
    log('info', 'Existing owner database connection pool ended.');
    ownerPoolInstance = null;
  }
  if (appPoolInstance) {
    log('info', 'Ending existing app database connection pool...');
    await appPoolInstance.end();
    log('info', 'Existing app database connection pool ended.');
    appPoolInstance = null;
  }
}

async function resetPool() {
  await endPool();
  ownerPoolInstance = createOwnerPoolInstance();
  appPoolInstance = createAppPoolInstance();
  log('info', 'New database connection pools initialized.');
  return { ownerPoolInstance, appPoolInstance };
}

// Initialize the pools when the module is first loaded
ownerPoolInstance = createOwnerPoolInstance();
appPoolInstance = createAppPoolInstance();

module.exports = {
  endPool,
  resetPool,
  getClient, // getClient is now the primary way to get a client for user operations
  getSystemClient, // Export for system-level operations
  getRawOwnerPool: _getRawOwnerPool,
};