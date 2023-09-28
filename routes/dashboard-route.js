const express = require('express');
const messages = require('../messages');
const databaseConfig = require('../database-config');
const path = require("path");

var dashboardRoute = express.Router();

function showDashboard(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/dashboard.html');

}

dashboardRoute.get('/', showDashboard);

module.exports = dashboardRoute;