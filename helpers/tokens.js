const crypto = require("crypto");
const { CalcualteTime, GenAuthKey } = require("./general")
const { v4: uuidv4 } = require('uuid');
const { SetRedisKeyEX } = require("./redis");
const { MakeSQLRequest } = require("./database");
const { error } = require("console");

function GenerateToken(user, ip, type, callback) {
    if (!user) {
        throw new Error("CANNOT GENERATE TOKEN FOR NULL USER");
    }

    // Prepare SQL request to call the stored procedure
    const sql = "CALL GenerateAuthToken(?, ?, ?)";
    const dataInsert = [user.uid, type, ip];

    MakeSQLRequest(sql, dataInsert, (err, result) => {
        if (err) {
            throw err;
            return callback(undefined, err); // Handle the error
        }

        // Assuming result[0][0].AuthToken contains the generated token
        const token = result[0][0].AuthToken;
        callback(token, undefined);
    });
}

function GetUserFromToken(token, type, callback) {
    // First, check if the token exists and is valid
    MakeSQLRequest("SELECT * FROM auth_tokens WHERE token = ?", [token], (err, result) => {
        if (err || !result[0]) {
            return callback("Invalid token", null); // Return error if token is invalid
        }

        let sql = "SELECT u.*, u.sub AS sub_raw, DATEDIFF(u.sub, NOW()) AS sub FROM users u JOIN auth_tokens t ON u.uid = t.user_id WHERE t.token = ? AND t.expiration_time > NOW()"; // i dont rember why i check the token expire time here instead of in the call above.

        if (result[0].login_type === 'web') {
            if (type !== 'web') {
                return callback("Invalid token type requested for web token", null); 
            }
            sql += " AND t.login_type = 'web'"; 
        } else if (result[0].login_type === 'client') {

            sql += " AND t.login_type = 'client'";
        }

        // Execute the query to retrieve the user data
        MakeSQLRequest(sql, [token], (err, res) => {
            if (err || !res[0]) {
                return callback("No user data found", null);
            }
            callback(err, res[0]);
        });
    });
}

module.exports = {
    GenerateToken,
    GetUserFromToken
};

function sha256(message) {
    const hash = crypto.createHash('sha256');
    hash.update(message);
    return hash.digest('hex');
}
