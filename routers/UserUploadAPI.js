const path = require('path');
const express = require('express');
const UserUploadHandler = express.Router();
const multer = require('multer');
const fs = require('fs');
const { MakeSQLRequest } = require('../helpers/database');
const sharp = require("sharp");
bodyParser = require('body-parser');
const mime = require('mime-types');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const storage = multer.diskStorage({
    destination: './temp',
});

const upload = multer({ storage });

UserUploadHandler.put('/uploadpfp/:auth?', upload.single('profileImage'), async (req, res, next) => {
    let challenge = req.params.auth;
    if (!challenge) {
        challenge = req.cookies.auth;
    }
    if (!challenge) {
        return res.status(401).json({ error: 'Unauthorized.' , status_code: 401 });
    }

    GetUserFromToken(challenge, 'web', async (err, user) => {
        if (err) throw err;

        const uid = user.uid;
        const file = req.file;

        if (!file) {
            const error = new Error('Please upload a file');
            error.statusCode = 400;
            return next(error);
        }

        try {

            const mimeType = file.mimetype
            if (mimeType == "application/octet-stream")
                mimeType = mime.lookup(file.originalname);
            console.log(mimeType)
            // Check if the uploaded file is a valid image or GIF
            const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
            if (!validMimeTypes.includes(mimeType)) {
                const error = new Error('Invalid file type. Only images or GIFs are allowed.');
                error.statusCode = 400;
                return next(error);
            }

            let filePath;
            let fileBuffer;

            if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
                // Convert to PNG format if it's a PNG or JPEG image
                fileBuffer = await sharp(file.path).jpeg().toBuffer();
                filePath = path.join('/var/www/html/users/avatars/', `${uid}.png`);
                await uploadToS3(fileBuffer, `${uid}.png`) 
            } else if (mimeType === 'image/gif') {
                
                // If it's a GIF, keep it as is
                fileBuffer = fs.readFileSync(file.path);
                filePath = path.join('/var/www/html/users/avatars', `${uid}.gif`);
                const pngFile = await sharp(file.path).jpeg().toBuffer();
                let path1 = path.join('/var/www/html/users/avatars/', `${uid}.png`)
                await savePngToFile(path1, pngFile);
                await uploadToS3(fileBuffer, `${uid}.gif`)
                await uploadToS3(pngFile, `${uid}.png`) // create static version as well.
            }

            await savePngToFile(filePath, fileBuffer);

            const fileUrl = `https://cdn.cute.bet/users/avatars/${path.basename(filePath)}`;
            const HWIDStatement = "UPDATE users SET image = ? WHERE uid = ?";
            const KEWI = [fileUrl, uid];

            MakeSQLRequest(HWIDStatement, KEWI, (err, result) => {
                if (err) throw err;
            });

            res.status(200).send('File uploaded successfully');
        } catch (err) {
            console.log(err);
            const error = new Error('Error uploading file');
            error.statusCode = 500;
            return next(error);
        }
    });
});


UserUploadHandler.put('/uploadpfpold/:auth?', upload.single('profileImage'), async (req, res, next) => {
    let challenge = req.params.auth
    if (!challenge) {
        challenge = req.cookies.auth
    }
    if (!challenge) {
        res.status(401).json({error:'unauthorized.'})
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
            const pngFile = await sharp(file.path).png().toBuffer();
            let path1 = path.join('/var/www/html/users/avatars/', `${uid}.png`)
            await savePngToFile(path1, pngFile);


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
            const error = new Error('Error uploading file');
            error.statusCode = 500;
            return next(error);
        }
    })
});


async function savePngToFile(filePath, pngData) {
    try {
        await fs.promises.writeFile(filePath, pngData);
        console.log(`PNG data saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving PNG data to file:', error);
    }
}

function GetUserFromToken(token, type, callback) {
    const sql = "SELECT u.*, DATEDIFF(u.sub, NOW()) AS sub FROM users u JOIN auth_tokens t ON u.uid = t.user_id WHERE t.token = ? AND t.login_type = ? AND t.expiration_time > NOW();"

    MakeSQLRequest(sql, [token, type], (err, res) => {
        callback(err, res[0])
    })
}

const uploadToS3 = async (file, uid) => {
    //const fileStream = fs.createReadStream(file.path);
    // console.log("Read Stream")

  
    const key = `users/avatars/${uid}`;
    const s3Params = {
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file,
        ContentType: file.mimetype,
    };
    const s3Client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        }
    });
    const command = new PutObjectCommand(s3Params);
    try {
        await s3Client.send(command);
        console.log(`File uploaded successfully`);
    } catch (err) {
        console.log(`Error uploading file to S3 bucket: hypervoidlabs`, err);
        throw err;
    }
};

module.exports = UserUploadHandler;
