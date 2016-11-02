const express = require('express'),
    app = express(),
    client = require('./modules/getClient'),
    query = require('./content/queries.json'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    basicAuth = require('basic-auth');

var diskStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + '/public/uploads');
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + '_' + Math.floor(Math.random() * 99999999) + '_' + file.originalname);
    }
});
var maxSize = 2097152,
    uploader = multer({
        storage: diskStorage,
        limits: {
            filesize: maxSize
        }
    });

var auth = (req, res, next) => {
    var credentials = basicAuth(req);
    if(!credentials || credentials.name != 'admin' || credentials.pass != 'password') {
        res.setHeader('WWW-Authenticate', 'Basic realm=www');
        res.sendStatus(401);
    } else {
        next();
    }
};

// upon starting with a clean database run uncomment the following line below;
// var dbcontent = require('./modules/populateDB.js');

app.use(bodyParser.json());
app.use('/admin', auth);
app.get('/images', (req, res) => {
    client.client(query.initialImageLoad, [req.query.limit, req.query.offset])
        .then(images => res.json(images));
});
app.get('/image/:imageID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.getImage, [id])
        .then((response) => res.json(response));
});
app.get('/comments/:imageID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.getComments, [id])
        .then((response) => res.json(response));
});
app.get('/tags/:tagname', (req, res) => {
    var tag = req.url.split('/').pop();
    client.client(query.getTags, [tag])
        .then((response) => {
            var images = JSON.stringify(response.rows.map((image) => JSON.parse(image.image_id)));
            images = images.replace('[', '(');
            images = images.replace(']', ')');
            var q = 'SELECT * FROM images WHERE id IN ' + images;
            client.client(q)
            .then((images) => res.json(images))
            .catch((error) => console.log(error));
        });
});


app.post('/upload', uploader.single('file'), (req, res) => {
    if (req.file) {
        res.json({
            success: true,
            file: '/uploads/' + req.file.filename
        });
    } else {
        res.json({success: false});
    }
});
app.post('/store', (req, res) => {
    client.client(query.addImage, [req.body.url.file, req.body.title, req.body.description, req.body.tags])
        .then(function (id) {
            res.json({
                succes: true,
                id: id.rows[0].id
            });
            JSON.parse(req.body.tags).map((tag) => client.client(query.addTag, [tag, id.rows[0].id]));
        })
        .catch((error) => res.json({error, success: false}));
});
app.post('/addcomment', (req, res) => {
    client.client(query.addComment, [req.body.image_id, req.body.name, req.body.comment, req.body.type])
        .then((id) => {
            res.json({
                success: true,
                id : id.rows[0].id,
                comment_id: id.rows[0].comment_id
            });
        })
        .catch((error) => res.json({error, success: false}));
});
app.put('/addcomment', (req, res) => {
    client.client(query.changeComment, [req.body.id])
        .then((id) => {
            res.json({
                success: true,
                id: id.rows[0].id
            });
        })
        .catch((error) => res.json({error, success: false}));
});

app.post('/replycomment', (req, res) => {
    client.client(query.replyComment, [req.body.comment_id, req.body.image_id, req.body.name, req.body.comment, req.body.type])
        .then((id) => {
            res.json({
                success: true,
                id : id.rows[0].id,
                comment_id: id.rows[0].comment_id
            });
        })
        .catch((error) => res.json({error, success: false}));
});

app.delete('/admin/image/:imageID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.deleteImage, [id])
        .then((response) => res.json({response, success: true}));
});

app.put('/admin/image/:imageID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.updateImage, [id, req.body.title, req.body.description])
        .then((response) => res.json({response, success: true}));
});

app.get('/admin/comments', (req, res) => {
    client.client(query.getCommentsAdmin, [req.query.offset, req.query.limit])
        .then(images => res.json(images))
        .catch(error => console.log(error));
});

app.put('/admin/comment/:commentID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.updateComment, [id, req.body.comment])
        .then((response) => res.json({response, success: true}));
});

app.delete('/admin/comment/:commentID', (req, res) => {
    var id = req.url.split('/').pop();
    client.client(query.deleteComment, [id])
        .then((response) => res.json({response, success: true}))
        .catch(error => console.log(error));
});

app.use(express.static('public'));
app.listen(8080);
