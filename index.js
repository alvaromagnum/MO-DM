const express = require('express');
const messages = require('./messages');
const databaseConfig = require('./database-config');
const registrationRoute = require('./routes/registration-route');
const loginRoute = require('./routes/login-route');
const dashboardRoute = require('./routes/dashboard-route');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/register', registrationRoute);
app.use('/login', loginRoute);
app.use('/dashboard', dashboardRoute);

// Land Page
function getRoot(req, res) {

    global.user = null;
    global.project = null;

    res.sendFile(__dirname + '/html/land-page.html');

}

app.get('/', getRoot);
// Land Page - End

function serverInitializedCallback() {
    console.log(messages.serverInitializedMessage);
}

app.listen('7777', serverInitializedCallback);