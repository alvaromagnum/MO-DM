const express = require('express');
const messages = require('../messages');
const databaseConfig = require('../database-config');

var usersRoute = express.Router();

async function getProjectUsers(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var users = await global.project.getUsers();

    res.send(users.map((user)=> {
        return {id: user.id, name: user.name};
    }));

}

usersRoute.get('/get/projectUsers', getProjectUsers);

module.exports = usersRoute;