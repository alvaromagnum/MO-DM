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

function databaseConnected() {

    console.log(messages.databaseConnected);

    if(true) return; // Setar para falso para recriar as tabelas. TODO Remover e colocar algo mais elegante

    User.sync({ force: true }).then(() => {console.log(messages.usersTableCreated)});
    Project.sync({ force: true }).then(() => {console.log(messages.projectsTableCreated)});

}

sequelize.authenticate().then(databaseConnected).catch(err => console.log('Erro: ', err))

module.exports = {
    User: User,
    Project: Project
};