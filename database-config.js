const { Sequelize, DataTypes} = require('sequelize');
const messages = require('./messages');

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: __dirname + "/db/modm.db"
});

const User = sequelize.define('User', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    login: {
        type: DataTypes.STRING,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    gender: {
        type: DataTypes.CHAR,
        allowNull: true
    },

});

const Course = sequelize.define('Course', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

});

const Project = sequelize.define('Project', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    jsonConfig: {
        type: DataTypes.STRING,
        allowNull: true
    },

    key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },

});

const ProjectUser = sequelize.define('ProjectUser', {});

Project.belongsToMany(User, { through: ProjectUser });

User.belongsToMany(Project, { through: ProjectUser });

Course.hasOne(User);

function databaseConnected() {

    console.log(messages.databaseConnected);

    if(!global.resetDatabase) return;

    ProjectUser.sync({ force: true }).then(() => {console.log(messages.projectUsersTableCreated)});
    User.sync({ force: true }).then(() => {console.log(messages.usersTableCreated)});
    Project.sync({ force: true }).then(() => {console.log(messages.projectsTableCreated)});
    Course.sync({ force: true }).then(() => {console.log(messages.coursesTableCreated)});

}

sequelize.authenticate().then(databaseConnected).catch(err => console.log('Erro: ', err))

module.exports = {
    User: User,
    Project: Project,
    ProjectUser: ProjectUser,
    Course: Course,
};