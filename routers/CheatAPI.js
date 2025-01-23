const express = require('express');
const CheatAPI = express.Router()
const { SendAdminAlert, escapeLinuxPath,  GenAuthKey, CalcualteTime, encryption } = require("../helpers/general")
const fs = require('fs')
const path = require('path');
const { GetUserFromToken, GenerateToken } = require('../helpers/tokens');
const { MakeSQLRequest } = require('../helpers/database');

CheatAPI.put('/download', async (req, res) => {
    var { key, hwid, beta, loaderversion, ct, BypassServerTime, gamename } = req.body
        MakeSQLRequest("SELECT DATEDIFF(sub, NOW()) AS sub, uid, lhwid as hwid, banned, username FROM `users` WHERE `key` = ?", [key], (err, result) => {
            if (result.length === 0) {
                return res.status(404).json(Encryption(({ message: "ZE04", status: "404" })));
            }

            var user = result[0];

            if (!user) {
                return res.status(404).json(Encryption(({ message: "ZE04", status: "404" })));
            }

            if (user.banned !== 0) {
                return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
            }

            if (user.sub <= 0) {
                return res.status(417).json(Encryption(({ message: "ZE11", status: "403" })));
            }

            if (!hwid) {
                Ban(key, `Tried to Circumvent hwid: ${req.clientIp}`, req.clientIp);
                return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
            }

            if (user.hwid === null) {
                MakeSQLRequest("UPDATE users SET hwid = ? WHERE uid = ?", [hwid, user.uid], (err, result) => {
                    if (err) {
                        SendAdminAlert(`Error Was Thrown: ${err}`);
                        throw err;
                    } else {
                        console.log(result);
                        if (fs.existsSync(path.join(__dirname, `Core_${gamename}.dll`))) {
                            return res.status(200).jsonFile(path.join(__dirname, `Core_${gamename}.dll`));
                        }
                    }
                });
                return;
            }

            if (hwid !== user.hwid) {
                return res.status(404).json(Encryption(({ message: "ZE07", status: "404" })));
            }

            if (hwid === user.hwid && beta === "1" && user.betaaccess !== "1") {
                return res.status(417).json(Encryption(({ message: "ZE09", status: "417" })));
            }

            if (hwid === user.hwid && beta === "1" && user.hasBeta === "1") {
                return res.status(200).jsonFile('NoSleepBetaCore.dll', { root: __dirname });
            }

            if (fs.existsSync(path.join(__dirname, '../', 'cores', `Core_${gamename}.dll`))) {
                if (hwid === user.hwid) {
                    return res.status(200).sendFile(path.join(__dirname, '../', 'cores', `Core_${gamename}.dll`));
                }
            }

            var tosend = {
                type: "Error Report",
                request_body: [],
                userdata: [result],
            };

            tosend.request_body.push({ key, hwid, requestforbeta: beta, loaderversion, time: ct, gamename });
            SendAdminAlert(`Check Logs Failed download request\`\`\`${JSON.stringify(tosend, null, 4)}\`\`\``);
            res.status(404).json({ message: "Something is wrong, try again later", code: "ZE15", status: "404" });
        });
})


CheatAPI.put('/login', async (req, res) => {
    try {
        var { key, hwid, beta, loaderversion, ct, BypassServerTime, gamename } = req.body

        if (!hwid) {
            Ban(key, `Tried to Circumvent hwid: ${req.clientIp}`, req.clientIp); // ah back when i had a insane firewall to ban users.
             return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
        }

            MakeSQLRequest("SELECT DATEDIFF(sub, NOW()) AS sub, uid, lhwid as hwid, banned, username FROM `users` WHERE `key` = ?", [key], (err, result) => {
                if (result.length === 0) {
                    return res.status(404).json(Encryption(({ message: "ZE04", status: "404" })));
                }

                var user = result[0];

                if (!user) {
                    return res.status(404).json(Encryption(({ message: "ZE04", status: "404" })));
                }

                if (user.banned !== 0) {
                    return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
                }

                if (user.sub <= 0) {
                    return res.status(417).json(Encryption(({ message: "ZE11", status: "403" })));
                }

                if (user.hwid === null) {
                    MakeSQLRequest("UPDATE users SET lhwid = ? WHERE uid = ?", [hwid, user.uid], (err, result) => {
                        if (err) {
                            res.status(500).json(Encryption(({ message: "failed to update hwid Zuxi has been alerted", status: "500" })));
                            SendAdminAlert(`Error Was Thrown: ${err}`);
                            throw err;
                        } else {
                            GenerateToken(user, req.clientIp, 'client', (token, err) => {
                                return res.status(200).json({ type: "auth", token: token, user: [user], status_code: 200 })
                            })
                        }
                    });
                    return;
                }

                if (hwid !== user.hwid) {
                    return res.status(404).json(Encryption(({ message: "ZE07", status: "404" })));
                }

                if (hwid === user.hwid && beta === "1" && user.betaaccess !== "1") {
                    return res.status(417).json(Encryption(({ message: "ZE09", status: "417" })));
                }

                if (hwid === user.hwid && beta === "1" && user.hasBeta === "1") {
                    return res.status(200).jsonFile('NoSleepBetaCore.dll', { root: __dirname });
                }

                if (hwid === user.hwid) {
                    return GenerateToken(user, req.clientIp, 'client', (token, err) => {
                        let response = {
                            type: "auth",
                            token: token,
                            user: {
                                uid: user.uid,
                                username: user.username,
                                sub: user.sub,
                            },
                            status_code: 200
                        }
                        res.status(200).json(
                            response
                        ).end();
                    })
                }

                var tosend = {
                    type: "Error Report",
                    request_body: [],
                    userdata: [result],
                };
                tosend.request_body.push({ key, hwid, requestforbeta: beta, loaderversion, time: ct, gamename });
                SendAdminAlert(`Check Logs Failed Login\`\`\`${JSON.stringify(tosend, null, 4)}\`\`\``);
                res.status(404).json({ message: "Something is wrong, try again later", code: "ZE15", status_code: "404" });
            });
    }
    catch (err) {
        throw err
    }
})

CheatAPI.put('/clientversion', async (req, res) => { // make a fake request to ban users.
    try {
        var { key, hwid, beta, loaderversion, ct, BypassServerTime, gamename } = req.body
        SendAdminAlert(`banning user with key ${key}, ip ${req.clientIp}`)
        if (key)
            MakeSQLRequest("UPDATE users SET banned = 1, ban_reason = ? WHERE `key` = ?", ['crack attempt...', key]);
            return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
    } catch (ex) {
        return res.status(410).json(Encryption(({ message: "ZE06", status: "410" })));
    }
})

function Encryption(value) {
    return value; // cant tell you what encrypton method i use thats private!
}

function Ban(key, reason, ip) {
    MakeSQLRequest(" UPDATE `users` SET banned = 1, ban_reason = 'Automatic Server Ban' WHERE `key` = ?", [key], (err, result) => {
        if (err) {
            throw err
        }
        SendAdminAlert(`Banned User \`\`\`Key ${key} IP ${ip} Reason ${reason}`)
    })
}

module.exports = CheatAPI;
