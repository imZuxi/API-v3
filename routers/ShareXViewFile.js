const express = require('express');
const ViewHandler = express.Router()
const multer = require('multer');
const fs = require('fs');
const sharp = require("sharp");
const path = require('path');
const { MakeSQLRequest } = require('../helpers/database');
const { GetRedisKey, SetRedisKey, SetRedisKeyEX } = require('../helpers/redis');


ViewHandler.get('/:id', async (req, res, next) => {
    try {
        if (req.params.id == 'favicon.ico') return;
        GetRedisKey(`privatevar:datahost:${req.params.id}`, (value) => {
            if (value) {
                let data = JSON.parse(value)
                
                if (data.type == "url") {
                    if (data.isShort == 1) {
                        console.log(req.path)
                        if (!req.path.includes('s/'))
                            return next(`im sorry but i cannot redirect you as the url provided is invalid. try using ${req.headers.host}/s/[id]`);//res.status(400).json({error: "im sorry but i cannot redirect you as the url provided is invalid.", status_code: 400})
                    }
                    return res.redirect(decodeURIComponent(data.filename));
                }
                else {
                    return res.render((path.join(__dirname, '../views/ShareX/render.ejs')), {
                        contentUrl: `http://${req.headers.host}/${req.params.id}/file`,
                        filep: data.filename,
                        ofile: data.orgname,
                        bottomtext: data.bottomtext
                    })
                }
            } else {
                MakeSQLRequest('SELECT * FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rows) => {
                    if (err) throw err
                    if (!rows[0]) {
                        //console.log("Doesnt Exist")
                        return next()
                    }
                    if (rows[0].type == 'url') {
                        SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, { filename: rows[0].filename, isShort: rows[0].isShort,type: 'url' }, 86400);
                        if (rows[0].isShort == 1) {
                            if (!req.path.includes('s/'))
                                return res.status(400).json({error: "im sorry but i cannot redirect you as the url provided is invalid.", status_code: 400})
                        }
                        res.redirect(decodeURIComponent(rows[0].filename));
                   

                    }
                    else {
                 
                        res.render((path.join(__dirname, '../views/ShareX/render.ejs')), {
                            contentUrl: `http://${req.headers.host}/${req.params.id}/file`,
                            filep: rows[0].filename,
                            ofile: rows[0].orgname,
                            bottomtext: rows[0].bottomtext
                        })
                        SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, { filename: rows[0].filename, orgname: rows[0].orgname, username: rows[0].username, bottomtext: rows[0].bottomtext, type: 'file' }, 86400);

                    }
                })
            }

        })
    } catch (error) {
        // throw error
        return next();
    }
})

ViewHandler.get('/s/:id', async (req, res, next) => {
    try {
        if (req.params.id == 'favicon.ico') return;
        GetRedisKey(`privatevar:datahost:${req.params.id}`, (value) => {
            if (value) {
                let data = JSON.parse(value)
                
                if (data.type == "url") {
                    if (data.isShort == 1) {
                        console.log(req.path)
                        if (!req.path.includes('s/'))
                            return next(`im sorry but i cannot redirect you as the url provided is invalid. try using ${req.headers.host}/s/[id]`);//res.status(400).json({error: "im sorry but i cannot redirect you as the url provided is invalid.", status_code: 400})
                    }
                    return res.redirect(decodeURIComponent(data.filename));
                }
                else {
                    return res.render((path.join(__dirname, '../views/ShareX/render.ejs')), {
                        contentUrl: `http://${req.headers.host}/${req.params.id}/file`,
                        filep: data.filename,
                        ofile: data.orgname,
                        bottomtext: data.bottomtext
                    })
                }
            } else {
                MakeSQLRequest('SELECT * FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rows) => {
                    if (err) throw err
                    if (!rows[0]) {
                        //console.log("Doesnt Exist")
                        return next()
                    }
                    if (rows[0].type == 'url') {
                        SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, { filename: rows[0].filename, isShort: rows[0].isShort,type: 'url' }, 86400);
                        if (rows[0].isShort == 1) {
                            if (!req.path.includes('s/'))
                                return res.status(400).json({error: "im sorry but i cannot redirect you as the url provided is invalid.", status_code: 400})
                        }
                        res.redirect(decodeURIComponent(rows[0].filename));
                   

                    }
                    else {
                 
                        res.render((path.join(__dirname, '../views/ShareX/render.ejs')), {
                            contentUrl: `http://${req.headers.host}/${req.params.id}/file`,
                            filep: rows[0].filename,
                            ofile: rows[0].orgname,
                            bottomtext: rows[0].bottomtext
                        })
                        SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, { filename: rows[0].filename, orgname: rows[0].orgname, username: rows[0].username, bottomtext: rows[0].bottomtext, type: 'file' }, 86400);

                    }
                })
            }

        })
    } catch (error) {
        // throw error
        return next();
    }
})


ViewHandler.get('/:id/delete/:con', async (req, res, next) => {
    try {
        if (req.params.id == 'favicon.ico') return;
        MakeSQLRequest('SELECT * FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rows) => {

            if (rows) {
                MakeSQLRequest('DELETE FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rowspc) => {
                SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, {  }, 80);
                let path = "node/ShareX/" + rows[0].filename
                if (fs.existsSync(path)) {
                   fs.unlinkSync(path)
                }
                return res.status(200).json({ message: 'file deleted.'})
                })
            } else {
                return res.status(404).json({ error: 'file not found.'})
            }
       })
    } catch (error) {
        // throw error
        return next(error);
    }


})

ViewHandler.get('/:id/file', async (req, res, next) => {
    try {

        GetRedisKey(`privatevar:datahost:${req.params.id}`, (value) => {

            if (!value) {
                MakeSQLRequest('SELECT * FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rows) => {
                    if (err) throw err

                    if (!rows[0]) {
                        return next()
                    }
                    SetRedisKeyEX(`privatevar:datahost:${req.params.id}`, { filename: rows[0].filename, orgname: rows[0].orgname, username: rows[0].username, bottomtext: rows[0].bottomtext, type: 'file' }, 86400);

                    let path = "node/ShareX/" + rows[0].filename
                    if (!fs.existsSync(path)) {
                        path = rows[0].filename
                    }

                    return res.sendFile(path, {
                        headers: {
                            'Content-Disposition': `attachment; filename=${rows[0].orgname}`
                        }
                    });

                    //res.sendFile(path.join(__dirname, "../", rows[0].filename))
                })
            }
console.log(value)
            let data = JSON.parse(value)
            console.log(data)
            let path = "node/ShareX/" + data.filename
            if (!fs.existsSync(path)) {
                path = data.filename
            }
            res.sendFile("/home/zuxi/node/ShareX/" + data.filename, {
                headers: {
                    'Content-Disposition': `attachment; filename=${data.orgname}`
                }
            });
            //res.sendFile(path.join(__dirname, "../", rows[0].filename))
        })
    } catch (error) {
        return next();
    }
    /*
           */
})

ViewHandler.get('/:id/file.mp4', async (req, res, next) => {
    try {


        MakeSQLRequest('SELECT * FROM zuxi_host WHERE iden = ? ', [req.params.id], (err, rows) => {
            if (err) throw err

            if (!rows[0]) {
                return next()
            }
            res.sendFile(path.join(__dirname, "../", rows[0].filename), {
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Disposition': `attachment; filename=${rows[0].orgname}`
                }
            });

            //res.sendFile(path.join(__dirname, "../", rows[0].filename))
        })
    } catch (error) {
        //throw error;
        return next();
    }
})




module.exports = ViewHandler



