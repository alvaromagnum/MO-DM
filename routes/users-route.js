const express = require('express');
const messages = require('../messages');
const databaseConfig = require('../database-config');

var usersRoute = express.Router();

async function getProjectUsers(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var usersFromDb = await global.project.getUsers();
    var users = [];

    for(const userFromDb of usersFromDb) {
        var user = await getUserData(userFromDb);
        users.push(user);
    }

    res.send(users);

}

async function getUserData(user) {
    var course = await  user.getCourse();
    return {id: user.id, name: user.name, courseName: course.name};
}

async function getCourses(req, res) {
    var courses = await databaseConfig.Course.findAll();
    res.send(courses);
}

usersRoute.get('/get/projectUsers', getProjectUsers);
usersRoute.get('/get/courses', getCourses);

module.exports = usersRoute;