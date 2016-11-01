var access = require('./accessToDB'),
    pg = require('pg'),
    pool;

access.dbUrl()
    .then( (config) => {
        pool = new pg.Pool(config);
        pool.on('error', function (error) {
            console.log(error);
        });
    });

module.exports.client = (query, param) => {
    return new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if(err) {
                reject(err);
                return;
            }
            client.query(query, param, (err, results) => {
                if(err) {
                    reject(err);
                }
                resolve(results);
                done();
            });
        });
    });
};
