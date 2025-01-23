const express = require('express');
const RedisAPI = express.Router();
const { GetRedisKey } = require('../helpers/redis');


RedisAPI.get('/:key', async (req, res) => {
    //res.send(req.params.key)
    if (req.params.key.toLowerCase().includes("privatevar")) {
       return res.status(404).json({ "error": "Key not found", "status_code": 404 })
    }

    GetRedisKey(req.params.key, (value) => {
        if (value) {
            try {
                res.json(JSON.parse(value))
            }
            catch {
                res.send((value))
            }
        }
        else {
            res.status(404).json({ "error": "Key not found", "status_code": 404 })
        }
    })
});

module.exports = RedisAPI