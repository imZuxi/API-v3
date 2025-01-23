const express = require('express');
const VRChatAPIController = express.Router()
require('dotenv').config({ path: __dirname + '/.env' })
var mysql = require('mysql2');
const { MakeSQLRequest } = require('../helpers/database');

VRChatAPIController.get('/getusertag', async (req, res) => {
    if (!req.query.id)
        res.status(404).json({ custom_rank: "", custom_tag_color: "", error: "uid not provided", status_code: 404 })
    var sql = "SELECT * FROM `vrctags` WHERE vrchat_id = ?";
    var Packet = [req.query.id]
    MakeSQLRequest(sql, Packet, (QueryErr, result) => {
        if (QueryErr) return jsonstring = JSON.stringify({ "error": "internal server error", "status_code": 500 });
        try {
            if (!result[0]) return res.status(404).json({ custom_rank: "", custom_tag_color: "", error: "not found", status_code: 404 })
             res.status(200).json({ custom_rank: result[0].custom_rank, custom_tag_color: result[0].custom_tag_color, status_code: 200 })
        }
        catch (err) {
            res.json({ "error": "internal server error", "status_code": 500 });
        }
    })
})
module.exports = VRChatAPIController
