const express = require('express');
const messages = require('../messages');
const databaseConfig = require('../database-config');

var projectRoute = express.Router();

function saveProjectConfig(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    global.project.jsonConfig = req.body.jsonConfig;

    global.project.save().then(()=> {
        res.send(messages.projectConfigSaveSuccess)
    });

}

function loadProjectConfig(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.send(global.project.jsonConfig);

}

projectRoute.post('/saveConfig', saveProjectConfig);

projectRoute.get('/loadConfig', loadProjectConfig);

module.exports = projectRoute;