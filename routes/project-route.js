const express = require('express');
const messages = require('../messages');
const crypto = require('crypto');
const databaseConfig = require('../database-config');
const path = require("path");
const {forEach} = require("underscore");

var projectRoute = express.Router();

function saveProjectConfig(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    global.project.jsonConfig = req.body.jsonConfig;

    global.project.save().then(()=> {
        res.send(messages.projectConfigSaveSuccess);
    });

}

function loadProjectConfig(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.send({jsonConfig: global.project.jsonConfig, projectName: global.project.name, projectId: global.project.id});

}

async function isEvaluationIdUnique(id) {
    var existingEvaluation = await databaseConfig.User.findOne({ where: { id: id } });
    return existingEvaluation !== null;
}

async function saveEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var evaluations = req.body.evaluations;

    for(var evaluation of evaluations) {

        var id = evaluation.optionId;

        while(await !isEvaluationIdUnique(id)) {
            id = crypto.randomUUID();
        }

        await databaseConfig.Evaluation.create({

            id: id,
            idDecision: evaluation.decisionId,
            idStep: evaluation.stepId,
            option: evaluation.option,
            UserId: evaluation.userId,
            ProjectId: evaluation.projectId,
            e: evaluation.e,
            v: evaluation.v,
            c: evaluation.c,

        });

    }

    res.send(messages.decisionsSavedSuccess);

}

function loadMyDecisions(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/my-decisions.html');

}

function processDecisionsData(req, res) {
    res.send("");
}

projectRoute.post('/saveConfig', saveProjectConfig);

projectRoute.post('/saveEvaluations', saveEvaluations);

projectRoute.get('/loadConfig', loadProjectConfig);

projectRoute.get('/decisions', loadMyDecisions);
projectRoute.post('/decisions', processDecisionsData);

module.exports = projectRoute;