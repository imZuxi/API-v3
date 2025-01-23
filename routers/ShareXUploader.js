const path = require('path');
const express = require('express');
const UploadHandler = express.Router();
const multer = require('multer');
const fs = require('fs');
const { MakeSQLRequest } = require('../helpers/database');
const { SendAdminAlert } = require('../helpers/general');
const { SetRedisKeyEX } = require('../helpers/redis');
bodyParser = require('body-parser');

const storage = multer.diskStorage({
    destination: '/home/zuxi/node/ShareX/ShareX/Files/',
});

const upload = multer({ storage });

UploadHandler.put('/upload', upload.single('file'), (req, res, next) => {

let username = "Zuxi"
let bottomtext = "Image I don't know, this could be the most gayest thing Zuxi has ever done."

if (req.body.token != "")
   return next()

    if (!req.file) {
        console.log('No File?');
        return res.status(400).send('No file uploaded.');
    }

    const originalFilename = req.file.originalname;
    const fileExtension = path.extname(originalFilename);
    const uniqueCode = GenFileName();
    const customFilename = `${username}_${uniqueCode}${fileExtension}`;

    const oldPath = req.file.path;
    const newPath = path.join(req.file.destination, customFilename);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error renaming file.');
    }
      MakeSQLRequest( 'INSERT INTO zuxi_host (filename, iden, orgname, username, bottomtext, type) VALUES (?, ?, ?, ?, ?, ? )', ["ShareX/Files/" + customFilename, uniqueCode, originalFilename, username, bottomtext, 'file'],
          (err, result) => {
            if (err) throw err

            SetRedisKeyEX(`privatevar:datahost:${uniqueCode}`,  { filename: "ShareX/Files/" + customFilename, iden: uniqueCode, orgname: originalFilename, username: username, bottomtext: bottomtext, type: 'file'}, 86400);

            SendAdminAlert(`New Upload => https://${process.env.IMAGEDOMAIN || req.headers.host}/${uniqueCode}`, "1203153793836130414")

            res.json({
                url: `https://${process.env.IMAGEDOMAIN || req.headers.host}/${uniqueCode}`,
                uniqueCode: uniqueCode,
            });

          }
        );
    });
});

function GenFileName() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 36 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(36);
    });
}

module.exports = UploadHandler;
