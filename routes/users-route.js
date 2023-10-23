const express = require('express');
const _ = require('underscore');
const messages = require('../messages');
const databaseConfig = require('../database-config');

var usersRoute = express.Router();

async function getProjectUsers(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var usersFromDb = await global.project.getUsers();
    usersFromDb = _.sortBy(usersFromDb, function(o) { return o.name; })

    var users = [];

    for(const userFromDb of usersFromDb) {
        var course = await  userFromDb.getCourse();
        users.push({id: userFromDb.id, name: userFromDb.name, courseName: course.name, courseId: course.id});
    }

    res.send(users);

}

async function getCourses(req, res) {
    var courses = await databaseConfig.Course.findAll();
    res.send(courses);
}

function getLoggedUserData(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.send({userName: global.user.name, userId: global.user.id});

}

usersRoute.get('/get/projectUsers', getProjectUsers);
usersRoute.get('/get/courses', getCourses);
usersRoute.get('/get/loggedUserData', getLoggedUserData);

module.exports = usersRoute;