const express = require('express');
const app = express();
const db = require('./sql/db');
const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');
const s3 = require('./s3');
const config = require('./config');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});

// app.use(bodyParser)


app.post('/upload', uploader.single('file'), s3.upload, function(req, res) {
    // console.log(req.body, req.file);
    db.addImage(
        req.body.title,
        req.body.desc,
        req.body.username,
        config.s3Url + req.file.filename
    ).then(image => {
        // console.log(image);
        res.json ({
            success: true,
            image: image
        });
    });
});

app.get('/images/:id', (req, res ) => {
    db.getAnImage(req.params.id)
        .then(image => {
            // console.log(image);
            res.json ({
                success: true,
                image: image
            });
        }).catch(err => {
            console.log(err);
        });

});
app.get('/comments/:imageid', (req, res ) => {
    db.getComments(req.params.imageid)
        .then(comments => {
            console.log(comments);
            res.json ({
                success: true,
                comments: comments
            });
        }).catch(err => {
            console.log(err);
        });

});

app.get('/images', (req, res) => {
    db.getImages()
        .then(images => {
            // console.log(images);
            res.json(images);
        }).catch(err => {
            console.log(err);
        });
});

app.post('/uploadcomment', function(req, res) {
    // console.log(req.body)
    // console.log(req.body.imageId, req.body.usernameComment, req.body.comment);
    db.addComment(
        req.body.imageId,
        req.body.usernameComment,
        req.body.comment
    ).then(comment => {
        // console.log(image);
        res.json ({
            success: true,
            comment: comment
        });
    });
});

app.listen(8080, () => {
    console.log('listening  on port 8080');
});
