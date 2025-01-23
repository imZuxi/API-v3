const express = require('express');
const ExUploadHandler = express.Router()
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const sharp = require("sharp");
const { MakeSQLRequest } = require('../helpers/database');
const { GetUserFromToken } = require('../helpers/tokens');

const upload = multer({ dest: 'uploads/' });

const uploadToS3 = async (file, uid) => {
    const pngFile = await sharp(file.path).png().toBuffer();
    const key = `s/users/avatars/${uid}.png`;
    const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: pngFile,
        ContentType: file.mimetype,
    };
    const s3Client = new S3Client({
        region: 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
    });
    const command = new PutObjectCommand(s3Params);
    try {
        await s3Client.send(command);
        console.log(`File uploaded successfully`);
    } catch (err) {
        console.log(`Error uploading file to S3 bucket: zuxilabo`, err);
        throw err;
    }
};

ExUploadHandler.put('/pfp', upload.single('profileImage'), async (req, res, next) => {
    let challenge = req.cookies.auth
    if (!challenge) {
        res.code(401).send('')
    }
    GetUserFromToken(challenge, 'web', async (err, user) => {
        if (err) throw err;
        let uid = user.uid
        const file = req.file;
        if (!file) {
            const error = new Error('Please upload a file');
            error.statusCode = 400;
            return next(error);
        }
        try {
            await uploadToS3(file, uid);
            var HWIDStatement = "UPDATE users SET image = ? WHERE uid = ?"
            const fileStream = fs.createReadStream(file.path);
            const key = `users/avatars/${uid}.png`;
            var KEWI = ["https://cdn.cute.bet/" + key, uid]
            MakeSQLRequest(HWIDStatement, KEWI, (err, result) => {
                if (err) { throw err } //return res.status(500);}
            })
            res.status(200).send('File uploaded successfully');
        } catch (err) {
            console.log(err);
            const error = new Error('Error uploading file to S3 bucket');
            error.statusCode = 500;
            return next(error);
        }
    })
});

module.exports = ExUploadHandler