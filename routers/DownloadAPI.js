const express = require('express');
const DownloadAPI = express.Router()
const { GetUserFromToken } = require("../helpers/tokens")
const { MakeSQLRequest } = require('../helpers/database');

DownloadAPI.get('/dl/:productName/:authtoken?', async (req, res) => {
    const productName = req.params.productName;
    let authtoken = req.params.authtoken

    if (!authtoken) {
        authtoken = req.cookies.auth
    }

    try {

        var sql = "SELECT * FROM `cheat` WHERE `name` = ?  ";
        var Packet = [productName]
        MakeSQLRequest(sql, Packet, (err, result) => {

            if (err) {
                console.log(err); return res.status(404).json((({ message: "download not found", status: "404" })))
            }
            if (result.length === 0) { return res.status(404).json(((({ message: "download not found", status: "404" })))) }

            const downloadable = result[0];

            if (downloadable.private == "1") {
                if (authtoken) {
                    GetUserFromToken(authtoken, 'client', (err, user) =>
                    {
                        if (user.key)
                        {
                           return res.redirect(downloadable.DownloadURL);
                        }
                        res.status(404).json((({ message: "download not found", status: "404" })))
                        return;
                    })
                }
                else res.status(404).json((({ message: "download not found", status: "404" })))

            }
            else res.redirect(downloadable.DownloadURL)
        }
        )
    }
    catch (error) {
        console.log(error)
        res.status(500).json((({ message: "an error occured", status: "500" })))
    }

}

)


module.exports = DownloadAPI
