const express = require('express');
const SHA256 = require("crypto-js/sha256");
const messages = require('../messages');
const databaseConfig = require('../database-config');
const path = require("path");

const registrationRoute = express.Router();

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

    if(login === "" || password1 === "" || password2 === "") {
        res.status(500).send(messages.loginAndPasswordRequired);
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

async function saveProject(req, res) {

    var projectName = req.body.projectName;
    var key = req.body.key;

    var regex = /[^\w\s]/gi;

    if(regex.test(projectName) === true) {
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
        res.send(`${messages.projectCreatedSuccess} <b>${key}</b>`);
    });

}

registrationRoute.get('/user', registerUser);
registrationRoute.post('/user', saveUser);

registrationRoute.get('/project', registerProject);
registrationRoute.post('/project', saveProject);

module.exports = registrationRoute;