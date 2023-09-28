const express = require('express');
const SHA256 = require("crypto-js/sha256");
const loginRoute = express.Router();
const databaseConfig = require('../database-config');
const messages = require("../messages");

function doLogin(req, res) {

    var login = req.body.login;
    var password = SHA256(req.body.password).toString();
    var key = req.body.key;

    global.user = null;
    global.project = null;

    var regex = /[^\w]/gi;

    if(regex.test(login) === true) {
        res.status(500).send(messages.loginError);
        return;
    }

    databaseConfig.User.findOne({ where: { login: login, password: password } }).then((user)=> {

        if (user === null) {
            res.status(500).send(messages.cantLogin);
            return;
        }

        databaseConfig.Project.findOne({ where: { key: key } }).then((project)=> {

            if (project === null) {
                res.status(500).send(messages.projectNotFound);
                return;
            }

            project.addUser(user);

            global.user = user;
            global.project = project;

            res.redirect('/dashboard');

        });


    });

}

function doLogout(req, res) {

    global.user = null;
    global.project = null;

    res.redirect('/');

}

loginRoute.post('/', doLogin);

loginRoute.get('/out', doLogout);

module.exports = loginRoute;