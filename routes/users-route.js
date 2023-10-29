const express = require('express');
const _ = require('underscore');
const messages = require('../messages');
const databaseConfig = require('../database-config');
const path = require("path");

var usersRoute = express.Router();

async function getProjectUsers(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var project = await databaseConfig.Project.findOne({
        where: { id: req.session.project.id },
        include: [{model: databaseConfig.User}]
    });

    var usersFromDb = project.Users;

    var users = [];

    for(const userFromDb of usersFromDb) {
        var course = await  userFromDb.getCourse();
        users.push({id: userFromDb.id, name: userFromDb.name, courseName: course.name, courseId: course.id});
    }

    var sortedUsers = _(users).chain().sortBy(function(user) {
        return user.name;
    }).sortBy(function(user) {
        return user.courseName;
    }).value();

    res.send(sortedUsers);

}

async function getCourses(req, res) {
    var courses = await databaseConfig.Course.findAll();
    res.send(_.sortBy(courses, (o)=> o.name));
}

function getLoggedUserData(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    res.send({userName: req.session.user.name, login: req.session.user.login, gender: req.session.user.gender, birthdayDate: req.session.user.birthdayDate, userId: req.session.user.id, courseId: req.session.user.Course.id});

}

function getProfile(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/profile.html');

}

usersRoute.get('/get/projectUsers', getProjectUsers);
usersRoute.get('/get/courses', getCourses);
usersRoute.get('/get/loggedUserData', getLoggedUserData);
usersRoute.get('/profile', getProfile);

module.exports = usersRoute;