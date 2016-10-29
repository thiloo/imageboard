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
    console.log(req.query);
    client.client(query.initialImageLoad, [JSON.parse(req.query.limit)])
        .then(function(images){
            console.log(images);
            res.json(images);
        });
});
app.get('/image/:imageID', function(req, res){
    var id = req.url.split('/').pop();
    client.client(query.getImage, [id])
        .then(function(response){
            res.json(response);
        });
});
app.get('/comments/:imageID', function(req, res){
    var id = req.url.split('/').pop();
    client.client(query.getComments, [id])
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
app.post('/addcomment', function(req, res){
    client.client(query.addComment, [req.body.image_id, req.body.name, req.body.comment, req.body.type])
        .then(function(id){
            res.json({
                success: true,
                id : id.rows[0].id,
                comment_id: id.rows[0].comment_id
            });
        });
});
app.put('/addcomment', function(req, res){
    client.client(query.changeComment, [req.body.id])
        .then(function(id){
            console.log('success');
        });
});

app.post('/replycomment', function(req, res){
    console.log(req.body);
    client.client(query.replyComment, [req.body.comment_id, req.body.image_id, req.body.name, req.body.comment, req.body.type])
        .then(function(id){
            console.log(id);
            res.json({
                success: true,
                id : id.rows[0].id,
                comment_id: id.rows[0].comment_id
            });
        })
        .catch(function(error){
            console.log(error);
        });
});
app.use(express.static('public'));
app.listen(8080);
