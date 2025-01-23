const fs = require('fs');
require('dotenv').config({ path: __dirname + '../.env' })
var mysql = require('mysql2');

let pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    connectionLimit: 40
});


function MakeSQLRequest(sql, data, callback) {
    pool.query(sql, data, (err, result) => {
        callback(err, result);
    });
}

async function MakeSQLRequestAsync(sql, data) {
    return new Promise((resolve, reject) => {
        pool.query(sql, data, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
module.exports = {
   MakeSQLRequest,
   MakeSQLRequestAsync
}