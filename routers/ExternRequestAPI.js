const express = require('express');
const ExternRequestHandler = express.Router()
const { VerifyToken, GetUserFromToken } = require("../helpers/tokens")
const { MakeSQLRequest } = require('../helpers/database');
const crypto = require('crypto');

ExternRequestHandler.get('/getuser/:tokentype?/:authtoken?', async (req, res) => {
   let authtoken = req.params.authtoken

    if (!req.params.authtoken) {
        authtoken = req.cookies.auth
    }

    let tokentype = req.params.tokentype

    if (!tokentype) {
        tokentype = 'web'
    }

    GetUserFromToken(authtoken, tokentype, (err, user) => {
        if (user) {
            let data = { 
                userId: user.uid,
                username: user.username,
                subExpirey: user.sub, 
                hasValidHwid: user?.hwid !== null || user?.lhwid !== null,
                image: user.image,
                isBanned: user.banned != 0,
                grants: GetGrants(user),
                accessToken: "atoken_" + crypto.randomUUID(),
            }
        
            if (tokentype === 'client') {
                data.hashes =  {}
                // Ensure user.key, user.hwid, and user.lhwid exist before hashing
                   data.hashes.authkey = crypto.createHash('sha256').update(user.key).digest('hex');
                if (user.hwid) {
                    data.hashes.hwid = crypto.createHash('sha256').update(user.hwid).digest('hex');
                }
                if (user.lhwid) {
                    data.hashes.legacyhwid = crypto.createHash('sha256').update(user.lhwid).digest('hex');
                }
            }
        
            res.setHeader('datahash',  crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'))
            //return res.json(data);
            return res.json(data);
        } else {
            // Handle case when user is not found or invalid
            return res.status(400).json({ error: 'User not found' });
        }
        
      res.json({"error":"invalid token or grant provided.","status_code":404})
    })   
})

function GetGrants(user) {
    let ret = ""
    if (user.admin == 1) 
        ret += "isAdmin"

    
    if (user.active == 1) 
        ret += " isValid"

    
    if (user.sub > 0) 
        ret += " hasTime"

    
    if (user.beta == 1) 
        ret += " hasBeta"

    
    if (user.reseller == 1) 
        ret += " isOwner"
    return ret;
}

// Stuff Log Shit Here LOL 



module.exports = ExternRequestHandler
