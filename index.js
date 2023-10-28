const express = require('express');
const messages = require('./messages');
const databaseConfig = require('./database-config');
const fs = require('fs/promises');
const path = require('path');
const registrationRoute = require('./routes/registration-route');
const loginRoute = require('./routes/login-route');
const dashboardRoute = require('./routes/dashboard-route');
const projectRoute = require('./routes/project-route');
const usersRoute = require('./routes/users-route');

const app = express();

app.set('view engine', 'ejs');

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
//     // Maybe log the error for later reference?
//     // If this is development, maybe show the stack here in this response?
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

function getRoot(req, res) {

    global.user = null;
    global.project = null;

    res.sendFile(__dirname + '/html/land-page.html');

}

app.get('/', getRoot);

function serverInitializedCallback() {
    console.log(messages.serverInitializedMessage);
}

app.listen('7777', serverInitializedCallback);