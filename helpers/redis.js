const fs = require('fs');
require('dotenv').config({ path: __dirname + '/.env' })
const redis = require('redis');

const RedisClient = redis.createClient({
    url: process.env.REDIS_CONNECTION_STRING,
    database: 0
});

RedisClient.on('error', (err) => {
    console.error(`Error connecting to Redis server`, err);
    process.exit(1);
});

RedisClient.on('connect', () => {
    console.log(`Connected to Redis server`);
});

RedisClient.connect();

async function GetRedisKey(key, callback) {
    const value = await RedisClient.get(key);
    callback(value)
}

async function SetRedisKey(key, data, callback) {
    RedisClient.set(key, JSON.stringify(data), (err, reply) => {
        if (err) {
            callback(err, null)
        } else {
            callback(undefined, 'done')
        }
    });
}

function SetRedisKeyEX(tokenKey, tokenValue, tokenTTL, callback) {
    // Set the token with a TTL
    RedisClient.set(tokenKey, JSON.stringify(tokenValue), {EX: tokenTTL}, (err, reply) => {
      if (err) {
        console.error(`Error setting token: ${err}`);
        callback(err, null);
      } else {
        console.log(`Token set successfully: ${reply}`);
        callback(null, reply);
      }
    });
  }

async function GetRedisKeyAsync(key) {
    try {
        const value = await RedisClient.get(key);
        return value;
    } catch (err) {
        throw new Error(`Error getting key: ${err}`);
    }
}

async function SetRedisKeyAsync(key, data) {
    try {
        await RedisClient.set(key, JSON.stringify(data));
        return 'done';
    } catch (err) {
        throw new Error(`Error setting key: ${err}`);
    }
}

async function SetRedisKeyEXAsync(tokenKey, tokenValue, tokenTTL) {
    try {

        await RedisClient.set(tokenKey, JSON.stringify(tokenValue), { EX: tokenTTL });
        console.log(`Token set successfully`);
        return 'done'; 
    } catch (err) {
        console.error(`Error setting token: ${err}`);
        throw new Error(`Error setting token: ${err}`);
    }
}

function GetRedisClient() {
    return RedisClient1
}

module.exports = {
    GetRedisKey,
    SetRedisKey,
    SetRedisKeyEX,
    GetRedisKeyAsync,
    SetRedisKeyAsync,
    SetRedisKeyEXAsync,
    GetRedisClient
}