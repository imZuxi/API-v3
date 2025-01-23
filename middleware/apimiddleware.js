






function GenerateNotFound(req, res, next) {
    var err = new Error('Not Found'); err.status = 404; next(err);
};

function APIChecks(req, res, next) {
    const domain = req.headers.host;
    if (domain == "api.imzuxi.com" || domain == "api.cute.bet" || domain.includes("localhost") || domain.includes('cute.bet') || domain == 'cute.bet' || domain == 'imzuxi.com') {
        next();
    }
    else
        return res.status(409).json({ zlerror: "zl15", message: "zl api not available though this domain use api.cute.bet instead NOTE CONTACT imzuxi on discord if you see this while performing normal operations" })
}


function APIErrorCatcher(err, req, res, next) {
    res.status(err.status || 500);
    res.json({ message: err.message, error: err })
};

module.exports = {
    APIChecks,
    APIErrorCatcher,
    GenerateNotFound
}