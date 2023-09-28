const express = require('express');
const SHA256 = require("crypto-js/sha256");
const messages = require('../messages');
const databaseConfig = require('../database-config');

const registrationRoute = express.Router();

function registerUser(req, res) {
    res.sendFile(__dirname.replace('\\routes', '') + '/html/sign-up.html');
}

function saveUser(req, res) {

    var login = req.body.login;
    var password1 = req.body.password1;
    var password2 = req.body.password2;

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
            login: login,
            password: SHA256(password1).toString(),
        }).then(() => {
            res.send(messages.userCreatedSuccess)
        });

    });

}

registrationRoute.get('/user', registerUser);

registrationRoute.post('/user', saveUser);

module.exports = registrationRoute;