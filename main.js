const express = require('express'),
    app = express(),
    client = require('./modules/getClient'),
    query = require('./content/queries.json');

// upon starting with a clean database run uncomment the following line below;
// var dbcontent = require('./modules/populateDB.js');
app.get('/images', function(req, res){
    client.client(query.initialImageLoad)
        .then(function(images){
            res.json(images);
        });
});
app.use(express.static('public'));
app.use('/uploads', express.static('/uploads'));
app.listen(8080);
