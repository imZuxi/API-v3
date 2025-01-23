function makeresponse(res, status, data) {
    res.code(200).json({ status: status, data: { data } });
}

function makeerrorresponse(res, code, status, zcode, data) {
    res.code(code).json({ status: status, data: { data } });
}

module.exports = {
    makeresponse,
    makeerrorresponse
}