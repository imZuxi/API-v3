const path = require('path');
const express = require('express');
const UploadHandler = express.Router();
const multer = require('multer');
const fs = require('fs');
const { MakeSQLRequest } = require('../helpers/database');
const { SetRedisKeyEX } = require('../helpers/redis')
bodyParser = require('body-parser');

UploadHandler.put('/shorten', (req, res, next) => {
    const { url } = req.body
    let shurl = GenFileName()
    
    SetRedisKeyEX(`privatevar:datahost:${shurl}`,  {filename: encodeURIComponent(url), type : "url"}, 86400, (err, res) => {
        if (err) throw err; 
        console.log(res)
    });
   
    MakeSQLRequest( 'INSERT INTO zuxi_host (filename, iden, type) VALUES (?, ? , ?)', [encodeURIComponent(url), shurl, "url"],
    (err, result) => {
      if (err) throw err

      res.json({
          url: `https://${process.env.SHORTENDDOMAIN || req.headers.host}/s/${shurl}`,
          uniqueCode: shurl,
      });
    }
  );
});

function GenFileName() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 36 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(36);
    });
}

module.exports = UploadHandler;
