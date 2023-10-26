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

    res.send({jsonConfig: global.project.jsonConfig, projectName: `[${global.project.name} ➤ ${global.project.key}]`, projectId: global.project.id});

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

async function getImpacts(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var impactResultsIncomplete = JSON.parse(req.body.impactResultsIncomplete);
    var impactResultsComplete = [];

    for(var o of impactResultsIncomplete) {
        var user = await databaseConfig.User.findOne({where: {id: o.UserId}});
        impactResultsComplete.push({user: user.name, e: Number(((o.e - 1)/5).toFixed(2))*100, v: Number(((o.v - 1)/5).toFixed(2))*100, c: Number(((o.c - 1)/5).toFixed(2))*100, evc: (o.evc*100).toFixed(2)});
    }

    res.send(_.sortBy(impactResultsComplete, function(o){ return o.evc; }));

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

            var course = await global.user.getCourse();

            await databaseConfig.Evaluation.create({

                EvaluationOptionId: evaluationOption.id,
                UserId: evaluation.userId,
                CourseId: course.id,
                e: evaluation.e,
                v: evaluation.v,
                c: evaluation.c,
                evc: ((((0.3 * evaluation.e + 0.3 * evaluation.v) - 0.4 * evaluation.c) + 1.8) / 5).toFixed(2)

            });

        }

        await transaction.commit();

        res.send(messages.decisionsSavedSuccess);

    } catch (error) {

        await transaction.rollback();

        res.status(500).send(error.message);

    }

}

async function getResults(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({
        where: { ProjectId: global.project.id },
        include: [{model: databaseConfig.Evaluation}, {model: databaseConfig.Decision}]
    });

    res.send(evaluationOptions);

}

async function loadProjectSnapshots(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var data = await databaseConfig.ProjectSnapshot.findAll({
        where: { ProjectId: global.project.id }
    });

    res.send(data);

}

async function hasAnyEvaluation(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var idDecision = req.body.idDecision;

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({
        where: { ProjectId: global.project.id },
        include: databaseConfig.Evaluation
    });

    var queryNumberOfEvaluations = `$max([0, $sum(*[idDecision=${idDecision}].$count(Evaluations))])`;
    var numberOfEvaluations = await jsonata(queryNumberOfEvaluations).evaluate(evaluationOptions);

    res.send(numberOfEvaluations > 0);

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

function showResults(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/results.html');

}

function processDecisionsData(req, res) {
    res.send("");
}

async function makeDecision(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var idProject = global.project.id;
    var idDecision = req.body.idDecision;
    var idOption = req.body.idOption;

    var decision = await databaseConfig.Decision.findOne({where: {idProject: idProject, idDecision: idDecision}});

    var snapshot = req.body.snapshot;

    if(decision !== null) {
        decision.EvaluationOptionId = idOption;
        await decision.save();
    }
    else {

        await databaseConfig.Decision.create({

            idProject: idProject,
            idDecision: idDecision,
            EvaluationOptionId: idOption

        });

    }

    await databaseConfig.ProjectSnapshot.create({

        ProjectId: idProject,
        jsonSnapshot: snapshot

    });

    res.send(messages.genericTaskSuccess);

}

async function isDecisionFinished(req, res) {

    if(!global.user || !global.project) {
        res.redirect('/');
        return;
    }

    var idProject = global.project.id;
    var idDecision = req.body.idDecision;

    var decision = await databaseConfig.Decision.findOne({where: {idProject: idProject, idDecision: idDecision}});

    res.send(decision !== null);

}

projectRoute.post('/saveConfig', saveProjectConfig);

projectRoute.post('/getImpacts', getImpacts);

projectRoute.post('/removeEvaluationOption', removeEvaluationOption);

projectRoute.post('/makeDecision', makeDecision);

projectRoute.post('/saveEvaluations', saveEvaluations);

projectRoute.post('/getEvaluations', getEvaluations);

projectRoute.get('/loadConfig', loadProjectConfig);

projectRoute.get('/motivation/history', loadProjectSnapshots);

projectRoute.post('/isDecisionFinished', isDecisionFinished);

projectRoute.post('/hasAnyEvaluation', hasAnyEvaluation);

projectRoute.get('/decisions', loadMyDecisions);
projectRoute.post('/decisions', processDecisionsData);

projectRoute.get('/results', showResults);
projectRoute.post('/results', getResults);

module.exports = projectRoute;