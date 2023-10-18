const express = require('express');
const messages = require('../messages');
const crypto = require('crypto');
const databaseConfig = require('../database-config');
const path = require("path");
const { Op } = require("sequelize");
const _ = require("underscore");
const jsonata = require('jsonata');

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

async function removeEvaluationOption(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var idToRemove = req.body.idToRemove;

    var evaluationOption = await global.project.getEvaluationOptions({ where: { id: idToRemove } });

    if(evaluationOption.length < 1) {
        res.status(500).send(messages.genericTaskError);
        return;
    }

    try {
        await evaluationOption[0].destroy();
    }
    catch(error) {
        res.status(500).send(error.message);
        return;
    }

    res.send(messages.genericTaskSuccess);

}

async function saveEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    const transaction = await databaseConfig.sequelize.transaction();

    try {

        var evaluations = req.body.evaluations;
        var evaluationsToDelete = [];

        var existingDecisionOptions = await databaseConfig.EvaluationOption.findAll({
            where: { ProjectId: global.project.id },
            include: databaseConfig.Evaluation
        });

        for(var existingDecisionOption of existingDecisionOptions) {

            var existingEvaluations = existingDecisionOption.Evaluations;

            existingEvaluations = _.filter(existingEvaluations, (o)=> o.UserId === global.user.id);

            evaluationsToDelete = _.union(evaluationsToDelete, existingEvaluations);

        }

        evaluationsToDelete.every(async evaluation => await evaluation.destroy());

        for(var evaluation of evaluations) {

            var id = evaluation.optionId;

            var evaluationOption = await databaseConfig.EvaluationOption.findOne({ where: { id: id } });

            if(evaluationOption !== null) {

                evaluationOption.idDecision = evaluation.decisionId;
                evaluationOption.idStep = evaluation.stepId;
                evaluationOption.option = evaluation.option;
                evaluationOption.ProjectId = evaluation.projectId;

                await evaluationOption.save();

            }
            else {

                evaluationOption = await databaseConfig.EvaluationOption.create({

                    id: id,
                    idDecision: evaluation.decisionId,
                    idStep: evaluation.stepId,
                    option: evaluation.option,
                    ProjectId: evaluation.projectId

                });

            }

            await databaseConfig.Evaluation.create({

                EvaluationOptionId: evaluationOption.id,
                UserId: evaluation.userId,
                e: evaluation.e,
                v: evaluation.v,
                c: evaluation.c

            });

        }

        await transaction.commit();

        res.send(messages.decisionsSavedSuccess);

    } catch (error) {

        await transaction.rollback();

        res.status(500).send(error.message);

    }

}

async function getEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var stepIds = req.body.stepIds;
    var decisionIds = req.body.decisionIds;

    if(!stepIds) stepIds = [];
    if(!decisionIds) decisionIds = [];

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({

        where: {

            ProjectId: global.project.id,

            idStep: {
                [Op.in]: stepIds,
            },

            idDecision: {
                [Op.in]: decisionIds,
            },

        }

    });

    var evaluations = [];

    for(var evaluationOption of evaluationOptions) {

        var allEvaluations = await evaluationOption.getEvaluations();
        var userEvaluations = _.filter(allEvaluations, function(o){ return o.UserId === global.user.id; });

        if(userEvaluations.length === 0) {
            evaluations.push({id: evaluationOption.id, idDecision: evaluationOption.idDecision, idStep: evaluationOption.idStep, option: evaluationOption.option, e: 0, v: 0, c: 0});
        }
        else {

            userEvaluations = _.map(userEvaluations, function(evaluation){
                return {id: evaluationOption.id, idDecision: evaluationOption.idDecision, idStep: evaluationOption.idStep, option: evaluationOption.option, e: evaluation.e, v: evaluation.v, c: evaluation.c};
            });

            evaluations = _.union(evaluations, userEvaluations);

        }

    }

    res.send(evaluations);

}

function loadMyDecisions(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/my-decisions.html');

}

function processResults(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/results.html');

}

function processDecisionsData(req, res) {
    res.send("");
}

function makeDecision(req, res) {
    res.send(messages.genericTaskSuccess);
}

projectRoute.post('/saveConfig', saveProjectConfig);

projectRoute.post('/removeEvaluationOption', removeEvaluationOption);

projectRoute.post('/makeDecision', makeDecision);

projectRoute.post('/saveEvaluations', saveEvaluations);

projectRoute.post('/getEvaluations', getEvaluations);

projectRoute.get('/loadConfig', loadProjectConfig);

projectRoute.get('/decisions', loadMyDecisions);
projectRoute.post('/decisions', processDecisionsData);

projectRoute.get('/results', processResults);

module.exports = projectRoute;