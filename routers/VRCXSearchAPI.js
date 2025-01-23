let express = require('express');
let { SendAdminAlert } = require('../helpers/general');
let { MakeSQLRequest } = require('../helpers/database')
let { SetRedisKeyEX, GetRedisKey, GetRedisKeyAsync } = require('../helpers/redis')
const redis = require('redis');
let VRCXSearchAPI = express.Router()
let app = express()
let fs = require('fs');
let path = require('path');
const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// TODO: make this its own func
const r2Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto', // R2 uses 'auto'
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const RedisClient1 = redis.createClient({
    url: process.env.REDIS_CONNECTION_STRING,
    database: 1
});
RedisClient1.connect();
RedisClient1.on('error', (err) => {
    console.error(`Error connecting to Redis server`, err);
    process.exit(1); // Exit the process on Redis connection error
});
RedisClient1.on('connect', () => {
 //   console.log(`Connected to Redis server`);
});

VRCXSearchAPI.get('/search/:secret?', async (req, res) => {
    try {
        let isAdmin = false; // secret on how i decide this.

        let minLength = 3;
        if (!req.query.search || req.query.search.length < minLength) {
            if (!req.query.authorId) {
                return res.status(400).send([{ error: `search was too short min length is ${minLength}`, status_code: 400 }]);
            }
        }

        let cached = false;
        if (!isAdmin) {
            let authorId = req.query.authorId;
            let search = req.query.search?.toLowerCase();

            if (authorId) {
                cached = await GetRedisKeyAsync(`VRCX:authorId:${authorId}`);
                if (cached) return res.json(JSON.parse(cached));
            }

            if (search) {
                cached = await GetRedisKeyAsync(`VRCX:search:${search.toLowerCase()}`);
                if (cached) return res.json(JSON.parse(cached));
            }
        }

        if (cached) return;

        let sql = `
    SELECT
        id,
        name,
        authorName,
        description,
        imageUrl,
        COALESCE(thumbnailImageUrl, imageUrl) AS thumbnailImageUrl,
        authorId,
        releaseStatus
    FROM
        \`avatars\`
    WHERE
`;
        let queryParams = [];

        if (req.query.authorId) {
            sql += "`authorId` = ?";
            queryParams.push(req.query.authorId);

            if (!isAdmin) {
                sql += `
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.authorId
            )
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.id
            )
            AND releaseStatus = 'public'
            LIMIT 5020
        `;
            }
        } else if (req.query.search) {
            const search = req.query.search;
            let conditions = [];

            if (IsAuthorIDPresent(search) && !isAdmin) {
                sql += `
            \`authorId\` = ?
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.authorId
            )
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.id
            )
            AND releaseStatus = 'public'
            LIMIT 5000
        `;
                queryParams.push(search);
            } else if (IsAvatarIDPresent(search) && !isAdmin) {
                sql += `
            \`id\` = ?
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.id
            )
            AND NOT EXISTS (
                SELECT 1
                FROM \`vrcxblacklist\`
                WHERE obj_id = \`avatars\`.authorId
            )
            AND releaseStatus = 'public'
            LIMIT 1
        `;
                queryParams.push(search);
            } else {
                sql += "(";
                let columns = ["name", "authorName"];
                columns.forEach(column => {
                    conditions.push(`\`${column}\` LIKE ?`);
                    queryParams.push(`%${search}%`);
                });
                sql += conditions.join(" OR ") + ")";

                if (!isAdmin) {
                    sql += `
                AND NOT EXISTS (
                    SELECT 1
                    FROM \`vrcxblacklist\`
                    WHERE obj_id = \`avatars\`.id
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM \`vrcxblacklist\`
                    WHERE obj_id = \`avatars\`.authorId
                )
                AND releaseStatus = 'public'
                AND isValid = 1
                LIMIT 5000
            `;
                } else {
                    sql += " OR `authorId` LIKE ? OR `id` LIKE ?";
                    queryParams.push(`%${search}%`, `%${search}%`);
                }
            }
        }
        MakeSQLRequest(sql, queryParams, async (error, result) => {
            if (error) {
                console.log(error);
                SendAdminAlert(`Search API Exception: ${error}`, "1152461620719661237");
                return res.status(500).json([{ error: "request failed Zuxi has been alerted", status_code: 500 }]);
            }

            if (!isAdmin) {
                let cacheKey = req.query.authorId ? `VRCX:authorId:${req.query.authorId}` : `VRCX:search:${req.query.search.toLowerCase()}`;
                SetRedisKeyEX(cacheKey, result, 43200);
            }

            return res.json(result);
        });
    } catch (ex) {
        console.log(ex);
        SendAdminAlert(`Search API Exception: ${ex}`, "1152461620719661237");
        return res.status(500).json([{ error: 'internal server error zuxi has been alerted', status_code: 500 }]);
    }
});


VRCXSearchAPI.get('/stats', async (req, res) => {

    var datasql = "SELECT COUNT(DISTINCT authorName) AS authors, COUNT(*) AS avatars, SUM(CAST(CASE WHEN releaseStatus = 'private' THEN 1 ELSE 0 END AS int)) AS privateavatars, SUM(CAST(CASE WHEN releaseStatus = 'public' THEN 1 ELSE 0 END AS INT)) AS publicavatars, isValid = 1 as valid  FROM avatars; ";

    MakeSQLRequest(datasql, (err, result) => {
        if (err) {
            console.log(err)
            //  return res.json(result)
            return res.status(500).json([{ "authors": "calculating...", "avatars": "calculating...", "blacklistedavatars": "calculating...", "privateavatars": "calculating...", "publicavatars": "calculating..." }])
            //throw err;
        }
        res.json(result)

    })
})

VRCXSearchAPI.post('/upload-avatar', (req, res) => {

    let { avatar_id, avatar_name, avatar_author_name, avatar_author_id, avatar_asset_url, avatar_thumbnail, avatar_supported_platforms, avatar_release_status } = req.body
    var IHATESQL = "htop"
    var Packet = [avatar_id, avatar_name, avatar_author_name, avatar_author_id, avatar_asset_url, avatar_thumbnail, avatar_supported_platforms, avatar_release_status, avatar_name, avatar_author_name, avatar_author_id, avatar_asset_url, avatar_thumbnail, avatar_supported_platforms, avatar_release_status]

    try {

        if (!(avatar_thumbnail.includes("api.vrchat.cloud") || avatar_thumbnail.includes("vrc-uploads/images") || avatar_thumbnail.includes("cdn.cute.bet")) || !avatar_author_id.includes("usr_")) {
            SendAdminAlert(`Failed Upload For Data \`\`\` ${JSON.stringify(req.body, null, 2)} \`\`\` `, "1152461620719661237")
            return res.status(400).json({ error: "Failed Upload. Invalid Avatar", status_code: 400 });
        }



        MakeSQLRequest(IHATESQL, Packet, function (err, result) {
            if (err) {
                Sen
                SendAdminAlert(err, "1152461620719661237");
                console.log(err);
                res.status(500).json({ message: "Failed Avatar Upload", status_code: 500 })
                return;
            }// throw err;
            SendAdminAlert(
                `<-----{New Avatar}-----> \nName: ${avatar_name} \nAvatar ID: ${avatar_id} \NAuthor: \n${avatar_author_name} \nPic: ${avatar_thumbnail}  \nStatus: ${avatar_release_status} \n<-------{End}------->`
                , "1215255097169289216"
            );
            return res.status(200).json({ message: "Avatar Uploaded", status_code: 200 })
        });
    }
    catch (ex) {
        SendAdminAlert(ex, "1152461620719661237");
        throw new Error("Failed Avatar Upload");
    }
})

VRCXSearchAPI.post('/blacklist', async (req, res, next) => {
    let { secret, bval } = req.body

    if (!secret || secret != "") { next() }

    var sql = "  'INSERT INTO VRCX_blacklist (obj_id) VALUES (?)'"
    var sqlpacket = [bval];
    MakeSQLRequest(IHATESQL, sqlpacket, function (err, result) {
        if (err) {

            SendAdminAlert(err, "1152461620719661237");
            res.status(500).json({ error: "Failed to blacklist", status_code: 500 })
            return;
        }

        SendAdminAlert('Blacklisted: ' + bval, "1152461620719661237");

        res.json({ message: `added ${bval} to blacklist`, status_code: 200 })
    });
})

VRCXSearchAPI.get('/image-proxy/:imageId/:version/file', async (req, res) => {
    const imageId = req.params.imageId;
    const version = req.params.version;
    var imageUrl = `https://api.vrchat.cloud/api/1/file/${imageId}/${version}/file`;

    if (req.query)
        if (req.query.isImageURL) {
            imageUrl = `https://api.vrchat.cloud/api/1/image/${imageId}/${version}/256`
    }

    const cacheKey = `VRCX.ImageCacheKey:${imageId}`;

    try {
        const cachedImageExists = await RedisClient1.get(cacheKey);
        if (cachedImageExists) {
            if (cachedImageExists == 'exists') {
                return res.redirect(`https://r2.cute.bet/imagecache/vrchat/${imageId}.png`)
            } else {
                return res.redirect("https://r2.cute.bet/imagecache/vrchat/avatar_missing_photo.png");
            }

        }

        // Fetch the image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 5, // Adjust number of allowed redirects
            headers: {
                // request headers ommited
            },
        });

        const r2Params = {
            Bucket: process.env.R2_BUCKET,
            Key: `imagecache/vrchat/${imageId}.png`,
            Body: response.data,
            ContentType: response.headers['content-type'],
            ACL: 'public-read'
        };

        const command = new PutObjectCommand(r2Params);
        await r2Client.send(command);

        // Set cache in Redis with an expiration of 10 days (864000 seconds)
        await RedisClient1.set(cacheKey, 'exists', { EX: 2592000 }); // 30 days in seconds

        res.redirect(`https://r2.cute.bet/imagecache/vrchat/${imageId}.png`)
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error('Image not found (404 error):', error.message);

            // Make SQL request to set isValid = 0
            MakeSQLRequest('UPDATE avatars SET isValid = 0 WHERE image = ?', [imageUrl], (err, data) => {
                if (err) throw err;
            })

            // Set For 10 Days
            await RedisClient1.set(cacheKey, 'gone', { EX: 864000 });

            // Redirect to missing photo placeholder
            res.redirect("https://r2.cute.bet/imagecache/vrchat/avatar_missing_photo.png");
        } else {
            console.error('Error fetching or uploading image:', error);
            res.redirect("https://r2.cute.bet/imagecache/vrchat/avatar_missing_photo.png");
        }
    }
});

module.exports = VRCXSearchAPI;

function IsAuthorIDPresent(search) {
    if (search.includes("usr_") && search.length > 39) {
        return true;
    }
    return false
}

function IsAvatarIDPresent(search) {
    if (search.includes("avtr_") && search.length > 39) {
        return true;
    }
    return false
}