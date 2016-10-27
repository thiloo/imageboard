const express = require('express'),
    app = express(),
    client = require('./modules/getClient'),
    query = require('./content/queries.json'),
    bodyParser = require('body-parser'),
    multer = require('multer');

var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + '/public/uploads');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '_' + Math.floor(Math.random() * 99999999) + '_' + file.originalname);
    }
});
var maxSize = 2097152;
var uploader = multer({
    storage: diskStorage,
    limits: {
        filesize: maxSize
    }
});

// upon starting with a clean database run uncomment the following line below;
// var dbcontent = require('./modules/populateDB.js');

app.use(bodyParser.json());
app.get('/images', function(req, res){
    client.client(query.initialImageLoad)
        .then(function(images){
            res.json(images);
        });
});
app.get('/image/:imageName', function(req, res){
    var image = req.url.split('/').pop();
    client.client(query.getImage, [image])
        .then(function(response){
            res.json(response);
        });
});
app.post('/upload', uploader.single('file'), function(req, res){
    if (req.file) {
        res.json({
            success: true,
            file: '/uploads/' + req.file.filename
        });
    } else {
        res.json({
            success: false
        });
    }
});
app.post('/store', function(req, res){
    client.client(query.addImage, [req.body.url.file, req.body.title, req.body.description])
        .then(function(id){
            res.json({
                succes: true,
                id: id.rows[0].id
            });
        })
        .catch(function(error){
            console.log(error);
            res.json({
                success: false,
                reason: error
            });
        });
});

app.use(express.static('public'));
app.listen(8080);
