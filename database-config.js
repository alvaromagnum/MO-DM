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

    login: {
        type: DataTypes.STRING,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    }

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

    key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    }

});

const ProjectUser = sequelize.define('ProjectUser', {

    idProject: {
        type: DataTypes.INTEGER,
        references: {
            model: Project,
            key: 'id'
        }
    },

    idUser: {
        type: DataTypes.INTEGER,
        references: {
            model: User, // 'Actors' would also work
            key: 'id'
        }
    }

});

Project.belongsToMany(User, { through: ProjectUser });
User.belongsToMany(Project, { through: ProjectUser });

function databaseConnected() {

    console.log(messages.databaseConnected);

    if(true) return; // Setar para falso para recriar as tabelas. TODO Remover e colocar algo mais elegante

    User.sync({ force: true }).then(() => {console.log(messages.usersTableCreated)});
    Project.sync({ force: true }).then(() => {console.log(messages.projectsTableCreated)});
    ProjectUser.sync({ force: true }).then(() => {console.log(messages.projectUsersTableCreated)});

}

sequelize.authenticate().then(databaseConnected).catch(err => console.log('Erro: ', err))

module.exports = {
    User: User,
    Project: Project,
    ProjectUser: ProjectUser,
};