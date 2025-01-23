
const homedomain = 'cute.bet'


const DomainRedirects = function (req, res, next) {
//return next();

    let host = req.headers.host;
    var isAPI = host.includes('api');
    var isCDN = host.includes('cdn');


    if (host === "localhost") {
        return next();
    }

    if (host === "cute.bet") {
        return next();
    }
  
    if (isAPI || isCDN) {
        if (req.path == "/" || req.path == '')
            return res.redirect("https://" + homedomain)

            return next();
    }

    if (host != homedomain && !isCDN) {

        let redirect = "https://" + homedomain + req.path
        // if (req.query)
        // {
        //   redirect = redirect + req.query
        // }
        return res.redirect(redirect)
    }

    next()
}


const AuthRedirects = function (req, res, next) {
    const domain = req.headers.host;
    if (domain.toLowerCase() == "auth.imzuxi.com") {

        const reqpath = escapeLinuxPath(req.path);
        if (reqpath == "/") {
            res.redirect("https://auth.imzuxi.com/login");
            return;
        }
    }
    next();
}

function GenealRedirectCheck() {

}





module.exports = {
    AuthRedirects,
    DomainRedirects
}