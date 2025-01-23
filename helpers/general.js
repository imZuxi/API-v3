const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fs = require('fs');
require('dotenv').config({ path: __dirname + '/.env' })


async function SendAdminAlert(content, channelid) {
    let tchannelid = process.env.DISCORD_ADMIN_CHANNEL_ID

    if (channelid) {
        tchannelid = channelid
    }

    const response = await fetch(
        `https://discord.com/api/v9/channels/${tchannelid}/messages`, {
        method: 'post',
        body: JSON.stringify({ content }),
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        }
    }
    );
    const data = await response.json();

    return data;
}

async function SendUserMessage(content, UserID) {
    let onse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipient_id: UserID,
        }),
    });

    const user = await onse.json();
    const response = await fetch(
        `https://discord.com/api/v9/channels/${user.id}/messages`,
        {
            method: 'POST',
            body: JSON.stringify(content),
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const data = await response.json();

    return data;
}

function CalcualteTime(CTC, callback) {

    let Time = Date.now().toString()
    let CTCPar = parseInt(CTC)
    Time = Time.substring(0, Time.length - 3);
    let FinalTime = CTCPar - Time + 1
    Time = Time.substring(0, Time.length - 4);
    //if (BypassServerTime) { FinalTime = 2 }
    callback(FinalTime)

    //return FinalTime;
}

function encryption(encrypt) {
    return encrypt; // again hidden.
}

function GenAuthKey() {
    return 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 35 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(35).toUpperCase();
    });
}

function escapeLinuxPath(path) {
    // Replace any backslashes with forward slashes
    path = path.replace(/\\/g, '/');

    // Remove any leading or trailing slashes
    path = path.replace(/^\/|\/$/g, '');

    // Split the path into individual components
    let parts = path.split('/');

    // Process each component
    let escapedParts = parts.map((part) => {
        // Escape any special characters using the encodeURIComponent function
        part = encodeURIComponent(part);

        return part;
    });

    // Join the escaped parts back into a path
    let escapedPath = escapedParts.join('/');

    // Add a leading slash
    escapedPath = '/' + escapedPath;

    return escapedPath;
}

function calculateCRC32(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, data) => {
            if (error) {
                reject(error);
            } else {
                const crcValue = crc32.unsigned(data);
                resolve(crcValue.toString(16)); // Convert to hexadecimal string
            }
        });
    });
}

function encodeFileToBase64(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, data) => {
            if (error) {
                reject(error);
            } else {
                const base64Data = data.toString('base64');
                resolve(base64Data);
            }
        });
    });
}

async function CorePrepInternal(filePath, callback) { // this only really mattered when i was doing a vrc client since the loader had a crc check; 
    var ModuleB64 = null;
    var ModuleCRC = null;
    var rerror = null;

    await encodeFileToBase64(filePath)
        .then(base64Data => {
            ModuleB64 = base64Data;
        })
        .catch(error => {
            rerror = error
            SendAdminAlert("Failed To Convert Module To Base64" + error)
        });

    await calculateCRC32(filePath)
        .then(crcValue => {
            ModuleCRC = crcValue;
        })
        .catch(error => {
            rerror = error
            console.error('Error:', error);
            SendAdminAlert("Failed To Calculate CRC: " + error)
        });
    callback(rerror, ModuleB64, ModuleCRC);
}

var GetRandomNum = function () {
    const min = 100000; // minimum value for a 6-digit number
    const max = 999999; // maximum value for a 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    encryption,
    SendAdminAlert,
    CalcualteTime,
    GenAuthKey,
    escapeLinuxPath,
    calculateCRC32,
    encodeFileToBase64,
    CorePrepInternal,
    SendUserMessage,
    GetRandomNum
}
