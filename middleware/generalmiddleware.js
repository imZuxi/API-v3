const { GetUserFromToken } = require("../helpers/tokens");

function SetDefaultHeaders(req, res, next) {
  res.setHeader('PoweredBy', 'Zuxi Labo');

  if (req.headers.host == "cdn.cute.bet")
    res.setHeader('Zuxi-Server', 'ZuxiCDN/6.8.3');
  else
    res.setHeader('Zuxi-Server', 'ZuxiAPI/8.6.9');
  next()
}

const MobileCheck = function (req, res, next) {
  return next();
  const userAgent = req.headers['user-agent'];

  // You can customize this regex pattern based on common mobile user-agent strings
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  req.isMobile = isMobile;
  next();
};

function GetUserFromTokenMiddleWare() {

  if (!req.cookies.auth) {
    return next();
  }

  GetUserFromToken(req.cookies.auth, 'web', (err, user) => {
    if (err) return next();
    if (user)
      req.user = user
  })
}



module.exports = {
  SetDefaultHeaders,
  MobileCheck,
  GetUserFromTokenMiddleWare,
}
