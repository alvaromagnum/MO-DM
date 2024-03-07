const express = require('express');
const messages = require('../messages');
const crypto = require('crypto');
const databaseConfig = require('../database-config');
const path = require("path");
const { Op } = require("sequelize");
const _ = require("underscore");
const jsonata = require('jsonata');

var projectRoute = express.Router();

async function saveProjectConfig(req, res) {

    if (!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var transaction = await databaseConfig.sequelize.transaction();

    try {

        var jsonConfig = req.body.jsonConfig;
        var oldData = req.body.oldData;
        var newData = req.body.newData;

        if(oldData && newData) {

            var oldIds = oldData.map((o)=>o.id);
            var newIds = newData.map((o)=>o.id);

            var decisionsToRemoveFromProject = _.difference(oldIds, newIds);

            for(var idDecision of decisionsToRemoveFromProject) {

                await databaseConfig.EvaluationOption.destroy({
                    where: {idDecision: idDecision, ProjectId: req.session.project.id},
                    transaction: transaction
                });

            }

            for(var newDecision of newData) {

                var newStakeholders = newDecision.stakeholdersIds;
                var oldDecision = _.find(oldData, function(o){ return o.id === newDecision.id });

                if(oldDecision) {

                    var oldStakeholders = oldDecision.stakeholdersIds;
                    var stakeholdersToRemoveFromDecision = _.difference(oldStakeholders, newStakeholders).map((item)=>Number(item));

                    if(!arrayEquals(oldStakeholders, newStakeholders)) {

                        await databaseConfig.Decision.destroy({
                            where: {idProject: req.session.project.id, idDecision: newDecision.id},
                            transaction: transaction
                        });

                    }

                    if(stakeholdersToRemoveFromDecision.length === 0) continue;

                    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({
                        where: {idDecision: newDecision.id},
                        include: [{model: databaseConfig.Evaluation}]
                    });

                    for(var evaluationOption of evaluationOptions) {

                        var evaluations = evaluationOption.Evaluations;

                        for(var evaluation of evaluations) {
                            if(_.contains(stakeholdersToRemoveFromDecision, evaluation.UserId)) {
                                await evaluation.destroy({ transaction: transaction });
                            }
                        }

                    }

                }

            }

        }
        else {

            await databaseConfig.EvaluationOption.destroy({
                where: {ProjectId: req.session.project.id},
                transaction: transaction
            });

        }

        var project = await databaseConfig.Project.findOne({
            where: {id: req.session.project.id}
        });

        project.jsonConfig = jsonConfig;

        await project.save({ transaction: transaction });

        await transaction.commit();

        res.send(messages.projectConfigSaveSuccess);

    } catch (error) {

        await transaction.rollback();

        res.status(500).send(error.message);

    }

}

function arrayEquals(a, b) {

    a = _.sortBy(a, (item)=>item);
    b = _.sortBy(b, (item)=>item);

    return a.length === b.length && a.every((val, index) => val === b[index]);

}

async function getAllProjectsJson(req, res) {

    if (!req.session.user || !req.session.project || req.session.user.login !== "admin") {
        res.redirect('/');
        return;
    }

    var projecIds = req.body.projectIds;

    var projects = [];

    try {

        projects = await databaseConfig.Project.findAll({

            where: {
                id: {
                    [Op.in]: projecIds
                }
            }

        });

    }
    catch (err) {

        console.log(err);

    }

    var jsons = new Array();

    for(var project of projects) {

        var jsonObject = JSON.parse(project.jsonConfig);

        if(!jsonObject) jsonObject = {};

        jsonObject.projectId = project.id;
        jsonObject.projectName = project.name;

        jsons.push(JSON.stringify(jsonObject));

    }

    req.session.project = {id: 0, name: "TODOS", key: "ADMIN", jsonConfig: null};

    res.send({
        jsons: jsons
    });

}

async function setCurrentProject(req, res) {

    if (!req.session.user || !req.session.project || req.session.user.login !== "admin") {
        res.redirect('/');
        return;
    }

    var idProject = Number(req.body.idProject);

    var project = await databaseConfig.Project.findOne({
        where: {id: idProject}
    });

    var projectUsers = [];

    var allUsers = project ? await project.getUsers() : [];

    for(var user of allUsers) projectUsers.push({name: user.name, id: user.id});

    if(!project) project = {id: 0, name: "TODOS", key: "ADMIN", jsonConfig: null};

    req.session.project = project;

    res.send({
        jsonConfig: project.jsonConfig,
        projectName: `[${project.name} ➤ ${project.key}]`,
        projectId: idProject,
        projectUsers: projectUsers
    });

}

async function loadProjectConfig(req, res) {

    if (!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var project = await databaseConfig.Project.findOne({
        where: {id: req.session.project.id}
    });

    var projectUsers = [];

    var allUsers = project ? await project.getUsers() : [];

    for(var user of allUsers) projectUsers.push({name: user.name, id: user.id});

    if(!project) project = {id: 0, name: "ADMIN", jsonConfig: null, key: "ADMIN"};

    res.send({
        jsonConfig: project.jsonConfig,
        projectName: `[${req.session.project.name} ➤ ${project.key}]`,
        projectId: req.session.project.id,
        projectUsers: projectUsers
    });

}

async function removeEvaluationOption(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var idToRemove = req.body.idToRemove;

    var project = await databaseConfig.Project.findOne({
        where: { id: req.session.project.id },
        include: [{model: databaseConfig.EvaluationOption}],
    });

    var evaluationOptions = project.EvaluationOptions;

    var evaluationOption = _.find(evaluationOptions, (o)=> o.id === idToRemove);

    if(evaluationOption) {
        await evaluationOption.destroy();
    }

    res.send(messages.genericTaskSuccess);

}

async function getImpacts(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var impactResultsIncomplete = JSON.parse(req.body.impactResultsIncomplete);
    var impactResultsComplete = [];

    for(var o of impactResultsIncomplete) {
        var user = await databaseConfig.User.findOne({where: {id: o.UserId}});
        impactResultsComplete.push({user: user.name, e: Number(((o.e - 1)/5).toFixed(2))*100, v: Number(((o.v - 1)/5).toFixed(2))*100, c: Number(((o.c - 1)/5).toFixed(2))*100, evc: Number((o.evc*100).toFixed(2))});
    }

    res.send(_.sortBy(impactResultsComplete, function(o){ return o.evc; }).reverse());

}

async function saveEvaluations(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var transaction = await databaseConfig.sequelize.transaction();

    try {

        var evaluations = req.body.evaluations;
        var evaluationsToDelete = [];

        var existingDecisionOptions = await databaseConfig.EvaluationOption.findAll({
            where: { ProjectId: req.session.project.id },
            include: databaseConfig.Evaluation
        });

        for(var existingDecisionOption of existingDecisionOptions) {

            var existingEvaluations = existingDecisionOption.Evaluations;

            existingEvaluations = _.filter(existingEvaluations, (o)=> o.UserId === req.session.user.id);

            evaluationsToDelete = _.union(evaluationsToDelete, existingEvaluations);

        }

        evaluationsToDelete.every(async evaluation => await evaluation.destroy({ transaction: transaction }));

        for(var evaluation of evaluations) {

            var id = evaluation.optionId;

            var evaluationOption = await databaseConfig.EvaluationOption.findOne({ where: { id: id } });

            if(evaluationOption !== null) {

                evaluationOption.idDecision = evaluation.decisionId;
                evaluationOption.idStep = evaluation.stepId;
                evaluationOption.option = evaluation.option;
                evaluationOption.ProjectId = evaluation.projectId;

                await evaluationOption.save({ transaction: transaction });

            }
            else {

                evaluationOption = await databaseConfig.EvaluationOption.create({

                    id: id,
                    idDecision: evaluation.decisionId,
                    idStep: evaluation.stepId,
                    option: evaluation.option,
                    ProjectId: evaluation.projectId

                }, { transaction: transaction });

            }

            var user = await databaseConfig.User.findOne({
                where: { id: req.session.user.id },
                include: [{model: databaseConfig.Course}]
            });

            var course = user.Course;

            var e = Number(evaluation.e);
            var v = Number(evaluation.v);
            var c = Number(evaluation.c);

            var evc = ((((0.3 * e + 0.3 * v) - 0.4 * c) + 1.8) / 5).toFixed(2);

            if(e === 0 || v === 0 || c === 0) {

                await databaseConfig.Decision.destroy({
                    where: {idProject: req.session.project.id, idDecision: evaluation.decisionId},
                    transaction: transaction
                });

                evc = 0;

            }

            await databaseConfig.Evaluation.create({

                EvaluationOptionId: evaluationOption.id,
                UserId: evaluation.userId,
                CourseId: course.id,
                e: evaluation.e,
                v: evaluation.v,
                c: evaluation.c,
                evc: evc

            }, { transaction: transaction });

        }

        // var snapshot = req.body.snapshot;
        //
        // await databaseConfig.ProjectSnapshot.create({
        //
        //     ProjectId: req.session.project.id,
        //     jsonSnapshot: snapshot
        //
        // }, { transaction: transaction });

        await transaction.commit();

        res.send(messages.decisionsSavedSuccess);

    } catch (error) {

        await transaction.rollback();

        res.status(500).send(error.message);

    }

}

async function getResults(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var projectId = Number(req.body.projectId);

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({
        where: { ProjectId: req.session.user.login === "admin" && projectId !== 0 ? req.body.projectId : req.session.project.id },
        include: [{model: databaseConfig.Evaluation}, {model: databaseConfig.Decision}]
    });

    res.send(evaluationOptions);

}

async function checkIsChoice(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var projectId = Number(req.body.projectId);

    var choice = await databaseConfig.Decision.findOne({where: {EvaluationOptionId: req.body.evaluationOptionId, idProject: req.session.user.login === "admin" && projectId !== 0 ? req.body.projectId : req.session.project.id}});

    res.send(choice !== null);

}

async function loadProjectSnapshots(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var data = await databaseConfig.ProjectSnapshot.findAll({
        where: { ProjectId: req.session.project.id },
        order: ["createdAt"]
    });

    res.send(data);

}

async function loadAllProjectSnapshots(req, res) {

    if (!req.session.user || !req.session.project || req.session.user.login !== "admin") {
        res.redirect('/');
        return;
    }

    var data = await databaseConfig.ProjectSnapshot.findAll({
        order: ["createdAt"]
    });

    res.send(data);

}

async function hasAnyEvaluation(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var idDecision = req.body.idDecision;

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({
        where: { ProjectId: req.session.project.id },
        include: databaseConfig.Evaluation
    });

    var queryNumberOfEvaluations = `$max([0, $sum(*[idDecision=${idDecision}].$count(Evaluations))])`;
    var numberOfEvaluations = await jsonata(queryNumberOfEvaluations).evaluate(evaluationOptions);

    res.send(numberOfEvaluations > 0);

}

async function getEvaluations(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var stepIds = req.body.stepIds;
    var decisionIds = req.body.decisionIds;

    if(!stepIds) stepIds = [];
    if(!decisionIds) decisionIds = [];

    var evaluationOptions = await databaseConfig.EvaluationOption.findAll({

        where: {

            ProjectId: req.session.project.id,

            idStep: {
                [Op.in]: stepIds,
            },

            idDecision: {
                [Op.in]: decisionIds,
            },

        },

        include: [{model: databaseConfig.Evaluation}]

    });

    var evaluations = [];

    for(var evaluationOption of evaluationOptions) {

        var allEvaluations = await evaluationOption.Evaluations;
        var userEvaluations = _.filter(allEvaluations, function(o){ return o.UserId === req.session.user.id; });

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

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.resolve(__dirname, '..') + '/html/my-decisions.html');

}

function showResults(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    if(req.session.user.login === "admin") res.sendFile(path.resolve(__dirname, '..') + '/html/results-admin.html');
    else res.sendFile(path.resolve(__dirname, '..') + '/html/results.html');

}

function processDecisionsData(req, res) {
    res.send("");
}

async function makeDecision(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var idProject = req.session.project.id;
    var idDecision = req.body.idDecision;
    var idOption = req.body.idOption;

    var decision = await databaseConfig.Decision.findOne({where: {idProject: idProject, idDecision: idDecision}});

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

    res.send(messages.genericTaskSuccess);

}

async function saveSnapshot(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    await databaseConfig.ProjectSnapshot.create({

        ProjectId: req.session.project.id,
        jsonSnapshot: req.body.snapshot

    });

    res.send(messages.genericTaskSuccess);

}

async function isDecisionFinished(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var idProject = req.session.project.id;
    var idDecision = req.body.idDecision;

    var decision = await databaseConfig.Decision.findOne({where: {idProject: idProject, idDecision: idDecision}});

    res.send(decision !== null);

}

async function getAllProjects(req, res) {

    if(!req.session.user || !req.session.project) {
        res.redirect('/');
        return;
    }

    var projects = await databaseConfig.Project.findAll();

    var allProjects = [];

    for(const project of projects) {
        allProjects.push({id: project.id, name: project.name});
    }

    allProjects = _.sortBy(allProjects, (o) => o.name);

    res.send(allProjects);

}

projectRoute.post('/saveConfig', saveProjectConfig);

projectRoute.post('/getImpacts', getImpacts);

projectRoute.post('/removeEvaluationOption', removeEvaluationOption);

projectRoute.post('/makeDecision', makeDecision);

projectRoute.post('/saveSnapshot', saveSnapshot);

projectRoute.post('/saveEvaluations', saveEvaluations);

projectRoute.post('/getEvaluations', getEvaluations);

projectRoute.get('/loadConfig', loadProjectConfig);

projectRoute.get('/get/all', getAllProjects);

projectRoute.get('/motivation/history', loadProjectSnapshots);
projectRoute.get('/motivation/allHistory', loadAllProjectSnapshots);

projectRoute.post('/isDecisionFinished', isDecisionFinished);

projectRoute.post('/hasAnyEvaluation', hasAnyEvaluation);

projectRoute.post('/decisions/choice/check', checkIsChoice);

projectRoute.get('/decisions', loadMyDecisions);
projectRoute.post('/decisions', processDecisionsData);

projectRoute.post('/setCurrent', setCurrentProject);

projectRoute.post('/getAllJson', getAllProjectsJson);

projectRoute.get('/results', showResults);
projectRoute.post('/results', getResults);

module.exports = projectRoute;