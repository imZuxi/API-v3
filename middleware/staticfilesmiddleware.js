const { escapeLinuxPath } = require("../helpers/general")

function StaticFileHelper(req, res, next) {
    let path = escapeLinuxPath(req.path.replace(/\//g, '').toLowerCase())
    switch (path) {
        case '/tos':
            return res.send('tos replace me!')

    }

    next();
}

module.exports = {
    StaticFileHelper
}