
const express = require('express');
const StaticHandler = express.Router()
const path = require('path')
const fs = require("fs");
const { SendAdminAlert } = require('../helpers/general')

StaticHandler.get('/tos', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/legal/TOS.html')))
})

StaticHandler.get('/Privacy-Policy', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/legal/PrivacyPolicy.html')))
})

StaticHandler.get('/PrivacyPolicy', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/legal/PrivacyPolicy.html')))
})

StaticHandler.get('/privacy', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/legal/PrivacyPolicy.html')))
})

StaticHandler.get('/discord', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/discord/index.html')))
})
/*
StaticHandler.get('/upload', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/uploadfp/upload.html')))
})
*/

StaticHandler.get('/ping', (req, res) => {
    res.type('text/plain');
    res.status(200).send("pong");
})

StaticHandler.get('/links', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/links.html')))
})
StaticHandler.get('/contact', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/links.html')))
})
StaticHandler.get('/vrcx', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/vrcx.html')))
})
StaticHandler.get('/avatarsearch', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/avatarsearch.html')))
})
StaticHandler.get('/djsets', async (req, res) => {
    res.sendFile((path.join('/var/www/html/static/djsets.html')))
})



StaticHandler.get('/coffee', async (req, res) => {
    res.status(418).send("im a teapot");

    //res.sendFile((path.join(__dirname, '../Zuxi/discord/index.html')))
})

StaticHandler.get('/users', async (req, res) => {
    res.redirect("https://api.cute.bet/api/v7/stats/users");
})

StaticHandler.get('/donate', async (req, res) => {
    res.redirect("https://ko-fi.com/imzuxi");
})

StaticHandler.get('/addvrcxsearch', async (req, res) => {
    res.redirect("vrcx://addavatardb/https://api.cute.bet/api/v6/vrcx/search")
})
/*
StaticHandler.get('/shutdown', async (req, res) => {
    res.send("Shuting Down Goodbye!")
    SendAdminAlert("Shuting Down Goodbye!")
})
*/
StaticHandler.get('/assets/img/logolarge.png', (req, res, next) => {
    const referer = req.headers.referer || req.headers.referrer;
    if (req.isMobile && !referer.includes("cdn.cute.bet")) {
      res.redirect('https://cdn.cute.bet/assets/img/mobilelogolarge.png')
    } else {
      next()
    }
  });



module.exports = StaticHandler