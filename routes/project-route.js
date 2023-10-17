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

async function saveEvaluations(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    const transaction = await databaseConfig.sequelize.transaction();

    try {

        var evaluations = req.body.evaluations;
        var existingDecisionOptions = await global.project.getEvaluationOptions();
        var evaluationsToDelete = [];

        for(var existingDecisionOption of existingDecisionOptions) {

            var existingEvaluations = await existingDecisionOption.getEvaluations();

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