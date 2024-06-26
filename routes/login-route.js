const express = require('express');
const SHA256 = require("crypto-js/sha256");
const loginRoute = express.Router();
const databaseConfig = require('../database-config');
const messages = require("../messages");

async function doLogin(req, res) {

    var login = req.body.login;
    var password = SHA256(req.body.password).toString();
    var key = req.body.key;

    var regex = /[^\w]/gi;

    if (regex.test(login) === true) {
        res.status(500).send(messages.loginError);
        return;
    }

    var user = await databaseConfig.User.findOne({where: {login: login, password: password}, include: databaseConfig.Course});

    if (user === null) {
        res.status(500).send(messages.cantLogin);
        return;
    }

    var project = await databaseConfig.Project.findOne({where: {key: key}});

    if(user.login === "admin") project = {id: 0, name: "TODOS", key: "ADMIN", jsonConfig: null};

    var userProject = await user.getProject();

    if (project === null && userProject === null) {
        res.status(500).send(messages.projectNotFound);
        return;
    }

    if(!project) project = userProject;

    if (userProject !== null && userProject.id !== project.id) {
        res.status(500).send(messages.userAlreadyInProject);
        return;
    }

    if(user.login !== "admin" && userProject === null) project.addUser(user);

    req.session.user = user;
    req.session.project = project;

    res.redirect('/dashboard');

}

function doLogout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

loginRoute.post('/', doLogin);

loginRoute.get('/out', doLogout);

module.exports = loginRoute;