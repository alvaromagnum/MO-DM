const express = require('express');
const messages = require('../messages');
const crypto = require('crypto');
const databaseConfig = require('../database-config');
const path = require("path");
const { Op } = require("sequelize");
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

async function evaluationAlreadyExists(id) {
    var existingEvaluation = await databaseConfig.Evaluation.findOne({ where: { id: id } });
    return existingEvaluation !== null;
}

async function saveEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    const transaction = await databaseConfig.sequelize.transaction();

    try {

        await databaseConfig.Evaluation.destroy({
            where: {
                ProjectId: global.project.id,
                UserId: global.user.id
            }
        });

        var evaluations = req.body.evaluations;

        for(var evaluation of evaluations) {

            var id = evaluation.optionId;

            while(await evaluationAlreadyExists(id)) {
                id =  crypto.randomUUID();
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

        await transaction.commit();
        res.send(messages.decisionsSavedSuccess);

    } catch (error) {

        await transaction.rollback();
        res.status(500).send(messages.genericTaskError);

    }

}

async function getEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var stepIds = req.body.stepIds;
    var decisionIds = req.body.decisionIds;

    var evaluations = await databaseConfig.Evaluation.findAll({
        where: {
            UserId: global.user.id,
            ProjectId: global.project.id,
            idStep: {
                [Op.in]: stepIds,
            },
            idDecision: {
                [Op.in]: decisionIds,
            },
        }
    });

    res.send(evaluations);

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

projectRoute.post('/getEvaluations', getEvaluations);

projectRoute.get('/loadConfig', loadProjectConfig);

projectRoute.get('/decisions', loadMyDecisions);
projectRoute.post('/decisions', processDecisionsData);

module.exports = projectRoute;