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
        return user.courseName;
    }).sortBy(function(user) {
        return user.name;
    }).value();

    res.send(sortedUsers);

}

async function getCourses(req, res) {
    var courses = await databaseConfig.Course.findAll();
    res.send(_.sortBy(courses, (o)=> o.name));
}

async function getLoggedUserData(req, res) {

    if (!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var user = await databaseConfig.User.findOne({
        where: {id: req.session.user.id},
        include: [{model: databaseConfig.Course}]
    });

    res.send({
        userName: user.name,
        login: user.login,
        gender: user.gender,
        birthdayDate: user.birthdayDate,
        userId: user.id,
        courseId: user.Course.id,
        courseName: user.Course.name
    });

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