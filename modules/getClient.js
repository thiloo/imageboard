var access = require('./accessToDB'),
    pg = require('pg'),
    pool;

access.dbUrl()
    .then(function (config) {
        pool = new pg.Pool(config);
        pool.on('error', function (error) {
            console.log(error);
        });
    });

module.exports.client = function (query, param) {
    return new Promise(function (resolve, reject) {
        pool.connect(function (err, client, done) {
            if(err) {
                reject(err);
                return;
            }
            client.query(query, param, function (err, results) {
                if(err) {
                    reject(err);
                }
                resolve(results);
                done();
            });
        });
    });
};
