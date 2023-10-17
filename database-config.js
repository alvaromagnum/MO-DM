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
    }

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
    }

});

const EvaluationOption = sequelize.define('EvaluationOption', {

    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },

    idDecision: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    idStep: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    option: {
        type: DataTypes.STRING,
        allowNull: false
    }

});

const Evaluation = sequelize.define('Evaluation', {

    e: {
        type: DataTypes.TINYINT,
        allowNull: false
    },

    v: {
        type: DataTypes.TINYINT,
        allowNull: false
    },

    c: {
        type: DataTypes.TINYINT,
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

    jsonConfig: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    }

});

const ProjectUser = sequelize.define('ProjectUser', {});

Project.belongsToMany(User, { through: ProjectUser });
User.belongsToMany(Project, { through: ProjectUser });

Course.hasMany(User);
User.belongsTo(Course)

EvaluationOption.belongsTo(Project);
Project.hasMany(EvaluationOption);

Evaluation.belongsTo(User);
User.hasMany(Evaluation);

Evaluation.belongsTo(EvaluationOption);
EvaluationOption.hasMany(Evaluation);

function databaseConnected() {

    console.log(messages.databaseConnected);

    if(!global.resetDatabase) return;

    ProjectUser.sync({ force: true }).then(() => {console.log(messages.projectUsersTableCreated)});
    User.sync({ force: true }).then(() => {console.log(messages.usersTableCreated)});
    Project.sync({ force: true }).then(() => {console.log(messages.projectsTableCreated)});
    EvaluationOption.sync({ force: true }).then(() => {console.log(messages.evaluationsTableCreated)});
    Evaluation.sync({ force: true }).then(() => {console.log(messages.evaluationOptionsTableCreated)});

    Course.sync({ force: true }).then(() => {

        Course.create({ name: "Administração" });
        Course.create({ name: "Arqueologia" });
        Course.create({ name: "Arquitetura e Urbanismo" });
        Course.create({ name: "Artes Visuais" });
        Course.create({ name: "Biblioteconomia" });
        Course.create({ name: "Biomedicina" });
        Course.create({ name: "Ciência Política" });
        Course.create({ name: "Ciênciais Ambientais" });
        Course.create({ name: "Ciências Atuariais" });
        Course.create({ name: "Ciências Biológicas" });
        Course.create({ name: "Ciências Contábeis" });
        Course.create({ name: "Ciência da Computação" });
        Course.create({ name: "Ciências Econômicas" });
        Course.create({ name: "Ciências Sociais" });
        Course.create({ name: "Cinema e Audiovisual" });
        Course.create({ name: "Dança" });
        Course.create({ name: "Design" });
        Course.create({ name: "Direito" });
        Course.create({ name: "Educação Física" });
        Course.create({ name: "Enfermagem" });
        Course.create({ name: "Engenharia Biomédica" });
        Course.create({ name: "Engenharia Cartográfica e de Agrimensura" });
        Course.create({ name: "Engenharia Civil" });
        Course.create({ name: "Engenharia da Computação" });
        Course.create({ name: "Engenharia de Alimentos" });
        Course.create({ name: "Engenharia de Controle e Automação" });
        Course.create({ name: "Engenharia de Energia" });
        Course.create({ name: "Engenharia de Materiais" });
        Course.create({ name: "Engenharia de Minas" });
        Course.create({ name: "Engenharia de Produção" });
        Course.create({ name: "Engenharia Elétrica" });
        Course.create({ name: "Engenharia Eletrônica" });
        Course.create({ name: "Engenharia Mecânica" });
        Course.create({ name: "Engenharia Naval" });
        Course.create({ name: "Engenharia Química" });
        Course.create({ name: "Engenharia de Telecomunicações" });
        Course.create({ name: "Estatística" });
        Course.create({ name: "Expressão Gráfica" });
        Course.create({ name: "Farmácia" });
        Course.create({ name: "Filosofia" });
        Course.create({ name: "Física" });
        Course.create({ name: "Fisioterapia" });
        Course.create({ name: "Fonoaudiologia" });
        Course.create({ name: "Geografia" });
        Course.create({ name: "Geologia" });
        Course.create({ name: "Gestão da Informação" });
        Course.create({ name: "História" });
        Course.create({ name: "Hotelaria" });
        Course.create({ name: "Jornalismo" });
        Course.create({ name: "Letras" });
        Course.create({ name: "Matemática" });
        Course.create({ name: "Medicina" });
        Course.create({ name: "Museologia" });
        Course.create({ name: "Música" });
        Course.create({ name: "Nutrição" });
        Course.create({ name: "Oceanografia" });
        Course.create({ name: "Odontologia" });
        Course.create({ name: "Pedagogia" });
        Course.create({ name: "Psicologia" });
        Course.create({ name: "Publicidade e Propaganda" });
        Course.create({ name: "Química" });
        Course.create({ name: "Química Industrial" });
        Course.create({ name: "Radio, TV e Internet" });
        Course.create({ name: "Secretariado Executivo" });
        Course.create({ name: "Serviço Social" });
        Course.create({ name: "Sistemas de Informação" });
        Course.create({ name: "Teatro" });
        Course.create({ name: "Terapia Ocupacional" });
        Course.create({ name: "Turismo" });

        console.log(messages.coursesTableCreated)});

    }

sequelize.authenticate().then(databaseConnected).catch(err => console.log('Erro: ', err))

module.exports = {
    User: User,
    Project: Project,
    ProjectUser: ProjectUser,
    Course: Course,
    EvaluationOption: EvaluationOption,
    Evaluation: Evaluation,
    sequelize: sequelize
};