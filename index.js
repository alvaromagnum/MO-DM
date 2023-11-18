const express = require('express');
const messages = require('./messages');
const databaseConfig = require('./database-config');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const registrationRoute = require('./routes/registration-route');
const loginRoute = require('./routes/login-route');
const dashboardRoute = require('./routes/dashboard-route');
const projectRoute = require('./routes/project-route');
const usersRoute = require('./routes/users-route');

const app = express();

app.set('view engine', 'ejs');

const oneDay = 1000 * 60 * 60 * 24;

app.use(sessions({
    secret: crypto.randomUUID(),
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(cookieParser());

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/register', registrationRoute);
app.use('/login', loginRoute);
app.use('/dashboard', dashboardRoute);
app.use('/project', projectRoute);
app.use('/users', usersRoute);

// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.send({
//         'message': err.message
//     });
// });

var flagResetAll = false;

global.resetDatabase = flagResetAll;

var deleteAvatars = flagResetAll;

if(deleteAvatars) {
    deleteAllFilesInDir('./public/avatars').then(() => {
        console.log(messages.avatarsRemoved);
    });
}

async function deleteAllFilesInDir(dirPath) {

    try {

        const files = await fs.readdir(dirPath);

        const deleteFilePromises = files.map(file =>
            fs.unlink(path.join(dirPath, file)),
        );

        await Promise.all(deleteFilePromises);

    } catch (err) {

        console.log(err);

    }

}

var session;

function getRoot(req, res) {
    req.session.destroy();
    res.sendFile(__dirname + '/html/land-page.html');
}

function getAbout(req, res) {
    res.sendFile(__dirname + '/html/about.html');
}

app.get('/', getRoot);
app.get('/about', getAbout);

function serverInitializedCallback() {
    console.log(messages.serverInitializedMessage);
}

app.listen('7777', serverInitializedCallback);