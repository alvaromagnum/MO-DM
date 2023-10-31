const express = require('express');
const SHA256 = require("crypto-js/sha256");
const messages = require('../messages');
const databaseConfig = require('../database-config');
const path = require("path");
const moment = require('moment');
const multer  = require('multer')

const registrationRoute = express.Router();

const storage = multer.diskStorage(
    {

        destination: 'public/avatars/',

        filename: function ( req, file, cb ) {
            cb( null, req.session.user.id + ".jpg" );
        },

    }

);

const upload = multer( {
    storage: storage,
    limits: { fileSize: 2000000 },
    fileFilter: function (req, file, cb) {

        var fileExt = file.originalname.split('.').pop();
        if(fileExt !== "jpg") cb(new Error(messages.incorrectImageTypeError));
        else cb(null, true);

    }
} );

function registerUser(req, res) {
    res.sendFile(path.resolve(__dirname, '..') + '/html/sign-up.html');
}

function registerProject(req, res) {
    res.sendFile(path.resolve(__dirname, '..') + '/html/register-project.html');
}

function saveUser(req, res) {

    var name = req.body.name;
    var login = req.body.login;
    var password1 = req.body.password1;
    var password2 = req.body.password2;
    var idCourse = req.body.idCourse;

    if(idCourse < 1) {
        res.status(500).send(messages.selectCourse);
        return;
    }

    var regex = /[^\w]/gi;

    if(regex.test(login) === true) {
        res.status(500).send(messages.invalidLogin);
        return;
    }

    if(name.trim() === "" || login.trim() === "" || password1.trim() === "" || password2.trim() === "") {
        res.status(500).send(messages.nameLoginAndPasswordRequired);
        return;
    }

    if(password1 !== password2) {
        res.status(500).send(messages.differentPasswords);
        return;
    }

    databaseConfig.User.findOne({ where: { login: login } }).then((user)=>{

        if(user !== null) {
            res.status(500).send(messages.loginAlreadyExists);
            return;
        }

        databaseConfig.User.create({
            CourseId: idCourse,
            name: name,
            login: login,
            password: SHA256(password1).toString(),
        }).then(() => {
            res.send(messages.userCreatedSuccess);
        });

    });

}

async function updateUser(req, res) {

    if (!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var name = req.body.name;
    var login = req.body.login;
    var password1 = req.body.password1;
    var password2 = req.body.password2;
    var idCourse = Number(req.body.idCourse);
    var gender = req.body.gender;
    var birthdayDate = moment(req.body.birthdayDate, "DD/MM/YYYY").toDate();

    var regex = /[^\w]/gi;

    if (regex.test(login) === true) {
        res.status(500).send(messages.invalidLogin);
        return;
    }

    if (name.trim() === "" || login.trim() === "") {
        res.status(500).send(messages.nameAndLoginRequired);
        return;
    }

    if (password1.trim() !== password2.trim()) {
        res.status(500).send(messages.differentPasswords);
        return;
    }

    var user = await databaseConfig.User.findOne({where: {login: login}});

    if (user !== null && login !== req.session.user.login) {
        res.status(500).send(messages.loginAlreadyExists);
        return;
    }

    user.CourseId = idCourse;
    user.name = name;
    user.login = login;
    user.gender = gender;
    user.birthdayDate = birthdayDate;

    if (password1.trim() !== "") user.password = SHA256(password1).toString();

    await user.save();

    user = await databaseConfig.User.findOne({
        where: {login: login},
        include: [{model: databaseConfig.Course}]
    });

    req.session.user = user;

    var project = await databaseConfig.Project.findOne({where: {id: req.session.project.id}});

    var jsonConfig = project.jsonConfig;

    var userId = user.id;
    var userName = user.name;
    var courseName = user.Course.name;
    var courseId = user.Course.id;

    var newData1 = {
        "data": {
            "user_id": "1",
            "user_name": userName,
            "course_name": courseName,
            "course_id": courseId.toString()
        }
    }

    var newData2 = `<div class=\\"df-user-course-name-div-1 node-user-name\\"><b>${userName} - ${courseName}</b></div>`;

    var regex1 = new RegExp(`"data":{"user_id":"${userId}"[^]*?}`, "g");
    var regex2 = new RegExp(`<div class=\\\\"df-user-course-name-div-${userId}[^]*?</div>`, "g");

    jsonConfig = jsonConfig.replaceAll(regex1, JSON.stringify(newData1).slice(1, -1));
    jsonConfig = jsonConfig.replaceAll(regex2, newData2);

    project.jsonConfig = jsonConfig;

    await project.save();

    req.session.project = project;

    res.send(messages.profileUpdateSuccess);

}

async function saveProject(req, res) {

    var projectName = req.body.projectName;
    var key = req.body.key;

    var regex = /[^\w\s]/gi;

    // if(regex.test(projectName) === true) {
    //     res.status(500).send(messages.invalidProjectName);
    //     return;
    // }

    if(projectName.trim() === '') {
        res.status(500).send(messages.invalidProjectName);
        return;
    }

    var project = await databaseConfig.Project.findOne({ where: { key: key } });

    if(project !== null) {
        res.status(500).send(messages.createProjectError);
        return;
    }

    project = await databaseConfig.Project.findOne({ where: { name: projectName } });

    if(project !== null) {
        res.status(500).send(messages.projectWithSameNameError);
        return;
    }

    databaseConfig.Project.create({
        name: projectName,
        key: key,
    }).then(() => {
        res.send(`${messages.projectCreatedSuccess} <b id="keyToCopy">${key}</b> <i data-toggle="tooltip" title="Clique para COPIAR A CHAVE de acesso do projeto" class="material-icons opacity-10" id="buttonCopyKey" style="cursor:pointer" onclick="copyKey()">content_copy</i>`);
    });

}

registrationRoute.get('/user', registerUser);
registrationRoute.post('/user', saveUser);

registrationRoute.get('/project', registerProject);
registrationRoute.post('/project', saveProject);

registrationRoute.post('/updateUser', upload.single('avatarPhoto'), updateUser);

module.exports = registrationRoute;