const express = require('express');
const messages = require('../messages');
const databaseConfig = require('../database-config');
const path = require("path");

var dashboardRoute = express.Router();

function showDashboard(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    if(req.session.user.login === "admin") res.sendFile(path.resolve(__dirname, '..') + '/html/admin.html');
    else res.sendFile(path.resolve(__dirname, '..') + '/html/dashboard.html');

}

dashboardRoute.get('/', showDashboard);

module.exports = dashboardRoute;