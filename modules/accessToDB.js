var secret = require('../passwords.json');

module.exports.dbUrl = () => {
    return new Promise((resolve, reject) => {
        var dbUrl = process.env.DATABASE_URL || 'postgress://' + secret.user + ':' + secret.password + '@localhost/imageboard';
        dbUrl = require('url').parse(dbUrl);
        var dbUser = dbUrl.auth.split(':');
        var dbConfig = {
            user: dbUser[0],
            database: dbUrl.pathname.slice(1),
            password: dbUser[1],
            host: dbUrl.hostname,
            port: 5432,
            max: 10,
            idleTimoutMillis: 30000
        };
        resolve(dbConfig)
        .catch((reason) => reject(reason));
    });
};
