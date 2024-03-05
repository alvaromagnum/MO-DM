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

    if(user.login === "admin") project = {id: 0, name: "TODOS", key: "---", jsonConfig: null};

    if (project === null) {
        res.status(500).send(messages.projectNotFound);
        return;
    }

    if(user.login !== "admin") project.addUser(user);

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