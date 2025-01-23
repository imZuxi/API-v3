const express = require('express');
const StatsAPI = express.Router()
const { MakeSQLRequest } = require('../helpers/database');
const { GetRedisKey } = require("../helpers/redis")
const fs = require('fs')
const path = require('path')

// everything is cached now via redis
StatsAPI.get('/', async (req, res) => {
    GetRedisKey("privatevar:websocket:connected", (websocketusers) => {
        GetRedisKey("privatevar:zuxinet:connected", (zuxinetusers) => {
            GetRedisKey("privatevar:database:stats", (value) => {
                if (value) {
                    let s = JSON.parse(value)
                    s.users.online = parseInt(websocketusers) + parseInt(zuxinetusers);
                 //   s.users.zuxinet =  parseInt(zuxinetusers);
                   // s.users.websocket = parseInt(websocketusers)
                    res.json({ data: s, status_code: 200 })
                }
                else {
                    res.status(404).json({ "error": "Processing Data Still Please Wait", "status_code": 404 })
                }
            })

        })
    })

})


StatsAPI.get('/users', (req, res) => {
    let users0 = fs.readFileSync(path.join(__dirname, '/../utils/usersonline')).toString()
    MakeSQLRequest("SELECT COUNT(*) AS totalusers FROM `users`", (err, result) => {
        if (err) throw err;
        res.status(200).json({ online: parseInt(users0), total: result[0].totalusers })
    })
})

StatsAPI.get('/dstat', (req, res) => {
    let users0 = fs.readFileSync(path.join(__dirname, '/../utils/toprps')).toString()
    res.status(200).json({ toprps: parseInt(users0) })
})


StatsAPI.get('/zuxistats', (req, res) => {
    let users0 = fs.readFileSync(path.join(__dirname, '/../utils/zuxijsondata')).toString()
    res.status(200).json(JSON.parse(users0))
})



module.exports = StatsAPI;

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}