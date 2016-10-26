var client = require('./getClient'),
    query = require('../content/queries.json'),
    faker = require('faker');

function checkDBContent() {
    client.client(query.checkDBContent, [])
    .then(function(content) {
        if(content.rows.length < 1) {
            for(var i=0; i < 200; i++) {
                var param = [faker.image.image(), faker.lorem.word(), faker.lorem.sentence()];
                client.client(query.addImage, param);
            }
        }
    });
}

setTimeout(checkDBContent, 500);
