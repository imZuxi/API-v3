const { PerformanceObserver, performance } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
    console.log("startup completed in " + items.getEntries()[0].duration);
    performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

performance.mark('start');
// Load Config File Early to prevent Errors
require('dotenv').config({ path: __dirname + '/.env' })

// My Middle Ware Loaders;
const { APIChecks, APIErrorCatcher, GenerateNotFound } = require('./middleware/apimiddleware');
const { SetDefaultHeaders, MobileCheck } = require('./middleware/generalmiddleware');
const { DomainRedirects } = require('./middleware/redirectmiddleware');
const { SaveMyEyes } = require('./middleware/debugmiddleware');
const { SendAdminAlert } = require('./helpers/general')

// Load Dependencys
const express = require('express')
const cookieParser = require("cookie-parser");
const path = require('path')
bodyParser = require('body-parser')
const requestIp = require('request-ip');
const fs = require("fs");



// Setup of Paths
const RoutersPath = path.join(__dirname, 'routers')

// Init Setup of Express Server
const app = express()

// Set Our Headers
app.use(SetDefaultHeaders);

// Disable Powered by out of caution
app.disable('x-powered-by');

// setup the handlers and parsers
const cors = require('cors');
app.use(cookieParser());
app.use(cors())
app.set('view engine', 'ejs')
app.use(requestIp.mw());
app.use(bodyParser.json())
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(bodyParser.urlencoded({ extended: true }));

// Start Routing Traffic Starting With Redirects
app.use(DomainRedirects)
app.use(MobileCheck)

// Static routes
app.use('/', require(path.join(RoutersPath, 'StaticHandler')))
app.use('/', require(path.join(RoutersPath, 'AuthenAPI')));
app.use('/', require(path.join(RoutersPath, 'ShareXUploader')))
app.use('/', require(path.join(RoutersPath, 'UrlShort')))

/// User Accessable API we dont require them to type out the entire api ffs
app.use('/', require(path.join(RoutersPath, 'DashboardAPI')));
app.use('/', require(path.join(RoutersPath, 'SpecialFileDownloadAPI')));
app.use('/', require(path.join(RoutersPath, 'DownloadAPI')))
app.use('/', require(path.join(RoutersPath, 'HomePageRenderAPI')))
app.use('/admin', require(path.join(RoutersPath, 'AdminAPI')))
app.use('/api', APIChecks) // run api checks
// V6 Routes For Compatibility
app.use('/api/v6', require(path.join(RoutersPath, 'StaticHandler')))
app.use('/api/v6/obfuscator', require(path.join(RoutersPath, 'ObfusAPI')))
app.use('/api/v6/vrcx', require(path.join(RoutersPath, 'VRCXSearchAPI')))

// V7 Routes
app.use('/api/v7/user/', require(path.join(RoutersPath, 'UserUploadAPI')))
app.use('/api/v7/user/', require(path.join(RoutersPath, 'UserAPI')))
app.use('/api/v7/stats/', require(path.join(RoutersPath, 'StatsAPI')))
app.use('/api/v7/auth', require(path.join(RoutersPath, 'AuthenAPI')));
app.use('/api/v7/discord', require(path.join(RoutersPath, 'DiscordAPI')))
app.use('/api/v7/cheat', require(path.join(RoutersPath, 'CheatAPI')))
app.use('/api/v7/random', require(path.join(RoutersPath, 'RandomAPI')))
app.use('/api/v7/redis', require(path.join(RoutersPath, 'RedisAPI')))
app.use('/api/v7/vrc/avatars', require(path.join(RoutersPath, 'VRCXSearchAPI')))
app.use('/api/v7/vrchat', require(path.join(RoutersPath, 'VRChatAPI')))
app.use('/api/v7/extern', require(path.join(RoutersPath, 'ExternRequestAPI')))
app.use('/', require(path.join(RoutersPath, 'ShareXViewFile')))
app.use('/s', require(path.join(RoutersPath, 'ShareXViewFile')))

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    if (req.headers.host.includes('api') || req.path.includes("api")) {
        err = new Error(`The endpoint you're looking for is not implemented by our system`);
    }
    err.status = 404; next(err);

});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    if (err.message != "" || err.message != null) {
        if (err.message != "Not Found" && err.message != `The endpoint you're looking for is not implemented by our system`) {
            SendAdminAlert("Main Server Threw += \`\`\`" + err.message + "\`\`\` full error += \`\`\`" + err + "\`\`\`   \`\`\`" + "Request Path: " + req.path + " Domain: " + req.headers.host + "\`\`\`")
            console.log(err)
        }
    }

    if (req.headers.host.includes('api') || req.path.includes("api")) {
        return res.json({ error: err.message, status_code: err.status || 500 })
    }

    if (req.headers.host === "cute.bet") {
       return res.status(404).sendFile((path.join('/var/www/html/errors/404.html')));
    }
    let redirect = "https://cute.bet"  + req.path
    res.status(404).redirect(redirect)
});

// catch all errors that were not procecssed before
// @note THIS SHOULD NEVER BE RAN IN THIS CONTEXT THIS IS A CRITICAL ERROR IF IT DOES.
app.use(APIErrorCatcher)

app.listen(1337, () => {
    console.log('Server up at 1337 waiting for nginx requests!');
})


