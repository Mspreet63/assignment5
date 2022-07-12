/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __Manpreet Singh____________________ Student ID: ___125947218___________ Date: __11 July 2022______________
*
*  Heroku App URL: ___________________________________________________________
* 
*  GitHub Repository URL: _https://github.com/Mspreet63/assignment4_____________________________________________________
*
********************************************************************************/ 

var express = require("express");
var fs = require('fs');
var path = require('path');
var app = express();
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
var blog = require('./blog-service.js')
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const upload = multer(); 

var HTTP_PORT = process.env.PORT || 8080;


function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
app.use(express.static('public'));

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        }
    }
}));
app.set('view engine', '.hbs');


cloudinary.config({
  cloud_name: 'don6p0dkg',
  api_key: '465627321558977',
  api_secret: 'z8N02lFW2Xjciga2lckb5M2up_Y',
  secure: true
});


app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get('/', (req, res) => {
    res.redirect('/blog');
});

app.get('/about', (req, res) => {
    res.render('about')
});

app.get('/posts/add', (req, res) => {
    res.render('addPost');
});

app.get('/posts', (req, res) => {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category).then((data) => {
            res.render('posts', {
                posts: data
            })
        }).catch((err) => {
            res.render("posts", { message: "No results" });
        })
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((data) => {
            res.render('posts', {
                posts: data
            })
        }).catch((err) => {
            res.render("posts", { message: "No results" });
        })
    } else {
        blog.getAllPosts().then((data) => {
            res.render('posts', {
                posts: data
            })
        })
            .catch((err) => {
                res.render("posts", { message: "No results" });
            })
    }
})

app.get('/posts/:id', (req, res) => {
    blog.getPostsById(req.params.id).then((data) => {
        res.json(data)
    })
        .catch((err) => {
            res.json({
                message: "No results"
            });
        })
})


app.post('/posts/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;
        blog.addPost(req.body).then(() => {
            res.redirect('/posts');
        })
    }
})

app.get('/blog/:id', async (req, res) => {


    let viewData = {};

    try {


        let posts = [];


        if (req.query.category) {

            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {

            posts = await blog.getPublishedPosts();
        }


        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));


        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {

        posts = await blog.getPostById(req.params.id);
        let post = posts[0];
        viewData.post = post;
    } catch (err) {
        viewData.message = "no results";
    }


    try {

        let categories = await blog.getCategories();


        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "Try another"
    }
    console.log(viewData);


    res.render("blog", { data: viewData })
});

app.get('/blog', async (req, res) => {


    let viewData = {};

    try {


        let posts = [];


        if (req.query.category) {

            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {

            posts = await blog.getPublishedPosts();
        }


        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));


        let post = posts[0];


        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {

        let categories = await blog.getCategories();


        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    res.render("blog", { data: viewData })

});



app.get('/categories', (req, res) => {
    blog.getCategories().then((data) => {
        res.render('categories', {
            categories: data
        })
    })
        .catch((err) => {
            res.render('categories', {
                message: "No results"
            });
        })
})
  blog.initialize().then(() => 
{
    app.listen(HTTP_PORT, onHttpStart());
}).catch (() => {
    console.log("ERROR : From starting the server");
});
