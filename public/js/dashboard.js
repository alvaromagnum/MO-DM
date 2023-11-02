import Drawflow from '../js/drawflow.js';

darkMode(true);
activateTooltips();

var sankeyChartRoot = am5.Root.new("sankeyChartDiv");

var pageAllUsersEvc;
var pageAllCoursesEvc;
var pageGeneralEvc;
var allProjectData;
var projectZoom;
var projectPositionX;
var projectPositionY;
var currentProjectJson;

var configCanvas = document.getElementById("projectConfigCanvas");
var configEditor = new Drawflow(configCanvas);

configEditor.start();

$('#btSave').click(async function () {

    var newJson = configEditor.export();

    if(!currentProjectJson) currentProjectJson = newJson;

    var fullOldData = await getFullProjectData(JSON.stringify(currentProjectJson), true);
    var fullNewData = await getFullProjectData(JSON.stringify(newJson), true);

    var queryData = "[decisions.[${\"id\": id, \"stakeholdersIds\": [stakeholders.idUser]}].*]";

    var oldDecisionStakeholders = await jsonata(queryData).evaluate(fullOldData);
    var newDecisionStakeholders = await jsonata(queryData).evaluate(fullNewData);

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/project/saveConfig",
        data: {jsonConfig: JSON.stringify(newJson), oldData: oldDecisionStakeholders, newData: newDecisionStakeholders}

    }).fail(function (jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (msg) {

        $.LoadingOverlay("hide");
        $.notify(msg, "success");

        importDefaultDataDashboard();

    });

});

$('#btImport').click(function(){
    importDefaultDataDashboard();
});

async function processProjectConfig() {

    allProjectData = await getFullProjectData(configEditor.getJson(), false);

    var editorJson = configEditor.getJson();
    var configData = await getConfigData(editorJson);
    var linksNodes = await getSankeyChartDataFromConfig(configData);

    generateProjectSankeyChart(linksNodes.nodes, linksNodes.links);

    await generateProjectPendencies(allProjectData);

    return({configData: configData, nodes: linksNodes.nodes, links: linksNodes.links});

}

async function generateProjectPendencies(allProjectData) {

    var queryDecisions = `[*.decisions]`;
    var decisions = await jsonata(queryDecisions).evaluate(allProjectData);

    var queryAllStakeholders = `[$distinct(*.decisions.stakeholders)]`;
    var allStakeholders = await jsonata(queryAllStakeholders).evaluate(allProjectData);

    var dictionary = [];

    for(var stakeholder of allStakeholders) {
        dictionary.push({id: stakeholder.idUser, name: stakeholder.stakeholderName, pendencies: []});
    }

    for(var decision of decisions) {

        var id = decision.id;

        var queryOptions = `[*.decisions.options[%.id=${id}]]`;
        var options = await jsonata(queryOptions).evaluate(allProjectData);

        var queryStakeholders = `[*.decisions.stakeholders[%.id=${id}]]`;
        var stakeholders = await jsonata(queryStakeholders).evaluate(allProjectData);

        var queryEvaluations = `[*.decisions.options.Evaluations[%.%.id=${id}]]`;
        var evaluations = await jsonata(queryEvaluations).evaluate(allProjectData);

        if(options.length === 0) {

            for(var stakeholder of stakeholders) {

                var stakeholderPendencies = _.findWhere(dictionary, {id: stakeholder.idUser}).pendencies;
                stakeholderPendencies.push(`<b>🠞 DECISÃO "${decision.question}"</b>`);

            }

        }

        for(var option of options) {

            for(var stakeholder of stakeholders) {

                var stakeholderEvaluations = _.where(evaluations, {UserId: stakeholder.idUser, EvaluationOptionId: option.id});

                var missingEvaluation = stakeholderEvaluations.length === 0;
                var incompleteEvaluation = _.findWhere(stakeholderEvaluations, {e: 0}) !== undefined || _.findWhere(stakeholderEvaluations, {v: 0}) !== undefined || _.findWhere(stakeholderEvaluations, {c: 0}) !== undefined;

                if(missingEvaluation || incompleteEvaluation) {
                    var stakeholderPendencies = _.findWhere(dictionary, {id: stakeholder.idUser}).pendencies;
                    stakeholderPendencies.push(`<b>🠞 DECISÃO "${decision.question}" [<u>OPÇÃO "${option.option}"</u>]</b>`);
                }

            }

        }

    }

    for(var user of dictionary) {
        if(user.pendencies.length === 0) user.pendencies.push("-- SEM PENDÊNCIAS --");
    }

    dictionary = _.sortBy(dictionary, (o)=>o.name);

    $("#tablePendencies").html("");

    for(var user of dictionary) {

        var row = $("<tr></tr>").html(`
            <td class="align-middle text-sm width-30 avatar-container">
              <img id="userAvatar${user.id}" src="/avatars/${user.id}.jpg" alt="userAvatar" class="avatar avatar-xs rounded-circle-black-mini"/>
              &nbsp;${user.name}
            </td>
            <td class="align-middle text-sm">
              <div class="pendencies-container">
                ${user.pendencies.join("<br/><br/>")}
              </div>
            </td>
        `);

        $("#tablePendencies").append(row);

    }

    checkAvatarImages();

}

async function populateCustomChartsSelect(generalEvc, usersOtionsSelect, coursesOptionsSelect) {

    var queryOrderedOptions = `[*^(label)]`;

    usersOtionsSelect = await jsonata(queryOrderedOptions).evaluate(usersOtionsSelect);
    coursesOptionsSelect = await jsonata(queryOrderedOptions).evaluate(coursesOptionsSelect);

    addOptionToSelectCustomChart("selectChart1Content", generalEvc.id, generalEvc.label, "general");
    addOptionToSelectCustomChart("selectChart2Content", generalEvc.id, generalEvc.label, "general");

    addOptionToSelectCustomChart("selectChart1Content", -1, "--------------------", "none");
    addOptionToSelectCustomChart("selectChart2Content", -1, "--------------------", "none");

    for(var item of usersOtionsSelect) {
        addOptionToSelectCustomChart("selectChart1Content", item.id, item.label, "user");
        addOptionToSelectCustomChart("selectChart2Content", item.id, item.label, "user");
    }

    addOptionToSelectCustomChart("selectChart1Content", -1, "--------------------", "none");
    addOptionToSelectCustomChart("selectChart2Content", -1, "--------------------", "none");

    for(var item of coursesOptionsSelect) {
        addOptionToSelectCustomChart("selectChart1Content", item.id, item.label, "course");
        addOptionToSelectCustomChart("selectChart2Content", item.id, item.label, "course");
    }

}

function addOptionToSelectCustomChart(idChart, value, text, group) {
    $('#'+idChart).append(`<option group="${group}" value="${value}">${text}&nbsp;&nbsp;&nbsp;</option>`);
}

async function getSankeyChartDataFromConfig(steps) {

    var nodes = [];
    var links = [];
    var allStakeholders = [];

    nodes.push({ id: -1, type: "DECISAO", name: "SEM DECISÕES", info : "---", fill: am5.color(0x1a2035) });
    nodes.push({ id: 0, type: "STAKEHOLDER", name: "SEM STAKEHOLDERS", info : "---", fill: am5.color(0x1a2035) });

    for(const step of steps) {

        nodes.push({ id: step.id, type: "ETAPA", name: step.stepName, info : `Decisões: ${step.decisions.length}`, fill: am5.color(0x1a2035) });

        if(step.decisions.length === 0) {
            links.push({ from: step.id, to: -1, value: 1 });
            links.push({ from: -1, to: 0, value: 1 });
        }

        for(const decision of step.decisions) {

            decision.stakeholders = _.uniq(decision.stakeholders, false, (o)=>{return o.idUser});

            for(const stakeholder of decision.stakeholders) {
                allStakeholders.push(stakeholder);
            }

            allStakeholders = _.uniq(allStakeholders, false, (o)=>{return o.idUser});

            var isDecisionFinished = await isFinished(decision.id);
            var hasEvaluations = await hasAnyEvaluation(decision.id);

            var nodeColor = 0x1a2035;

            if(isDecisionFinished) nodeColor = 0x90EE90;
            else if(hasEvaluations) nodeColor = 0xFFA500;

            var queryCurrentDecision = `$filter(decisions.options.Decision[%.%.id=${decision.id}], function($v, $i, $a) {$v != null}).option`;
            var currentDecision = await jsonata(queryCurrentDecision).evaluate(allProjectData);

            var info = currentDecision ? `ESCOLHA: ${currentDecision}` : "ESCOLHA: ---";

            nodes.push({ id: decision.id, type: "DECISAO", name: decision.question, info : `Stakeholders: ${decision.stakeholders.length}\n\n${info}`, fill: am5.color(nodeColor) });
            links.push({ from: step.id, to: decision.id, value: Math.max(1, decision.stakeholders.length) });

            if(decision.stakeholders.length === 0) {
                links.push({ from: decision.id, to: 0, value: 1 });
            }

            for(const stakeholder of allStakeholders) {
                nodes.push({ id: stakeholder.id, idUser: stakeholder.idUser, type: "STAKEHOLDER", name: stakeholder.stakeholderName, info : "", fill: am5.color(0x1a2035) });
                if(_.contains(decision.stakeholders.map((o)=>{return o.idUser}), stakeholder.idUser)) links.push({ from: decision.id, to: stakeholder.id, value: 1 }); //baba
            }

        }

    }

    nodes = _.uniq(nodes, false, (o)=> {return o.id});
    links = _.uniq(links, false, (o)=> {return o.from + "_" + o.to});

    var stakeholdersQuery = `[*[type='STAKEHOLDER']]`;
    var uniqueStakeholders = await jsonata(stakeholdersQuery).evaluate(nodes);

    for(const stakeholder of uniqueStakeholders) {

        if(stakeholder.id === 0) continue;

        var stakeholderDecisionsCountQuery = `$count(*[to=${stakeholder.id}])`;
        var count = await jsonata(stakeholderDecisionsCountQuery).evaluate(links);

        var queryStakeholderCourse = `*[idUser=${stakeholder.idUser}].courseName`;
        var stakeholderCourse = await jsonata(queryStakeholderCourse).evaluate(allStakeholders);

        stakeholder.info = `\n\Curso: ${stakeholderCourse}\n\nDecisões: ${count}`;

    }

    var noDecisionsCount = `$count(*[to=-1])`;
    var count = await jsonata(noDecisionsCount).evaluate(links);

    if(count === 0) {
        nodes = _.without(nodes, _.findWhere(nodes, {id: -1}));
    }

    var noStakeholdersCount = `$count(*[to=0])`;
    var count = await jsonata(noStakeholdersCount).evaluate(links);

    if(count === 0) {
        nodes = _.without(nodes, _.findWhere(nodes, {id: 0}));
    }

    return({nodes: nodes, links: links});

}

async function hasAnyEvaluation(idDecision) {

    return $.ajax({
        method: "POST",
        url: "/project/hasAnyEvaluation",
        data: { idDecision: idDecision }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return false;
    }).done(function (result) {
        return result;
    });

}

async function isFinished(idDecision) {

    return $.ajax({
        method: "POST",
        url: "/project/isDecisionFinished",
        data: { idDecision: idDecision }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return false;
    }).done(function (result) {
        return result;
    });

}

function importUsersNodes() {

    $.LoadingOverlay("show");

    $.ajax({
        method: "GET",
        url: "/users/get/projectUsers",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (users) {
        for(var user of users) {
            addUserNode(user.name, user.id, user.courseName, user.courseId)
        }
        $.LoadingOverlay("hide");
    });

}

function addUserNode(userName, userId, courseName, courseId) {
    $('#selectNodeType').append(`<option value="${userId}" courseId="${courseId}" courseName="${courseName}" userName="${userName}">${userName} - ${courseName}&nbsp;&nbsp;&nbsp;</option>`);
}

function importDefaultDataDashboard() {

    $.LoadingOverlay("show");

    $.ajax({
        method: "GET",
        url: "/users/get/loggedUserData",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (user) {
        if(user) {
            $("#labelUserName").text(user.userName);
        }
        $.LoadingOverlay("hide");
    });

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/project/loadConfig",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(async function (dataToImport) {

        if (dataToImport) {

            var projectName = dataToImport.projectName;
            var jsonConfig = dataToImport.jsonConfig;

            $("#labelProjectName").text(projectName);

            if (!jsonConfig) {
                $.LoadingOverlay("hide");
                return;
            }

            currentProjectJson = JSON.parse(jsonConfig);

            configEditor.import(currentProjectJson);

            projectZoom = configEditor.zoom;
            projectPositionX = configEditor.x;
            projectPositionY = configEditor.y;

            await processProjectConfig();

            await generateEvcCharts(jsonConfig);

            var evcRankings = await getEvcRankings(jsonConfig);

            $.LoadingOverlay("show");

            $.ajax({

                method: "GET",
                url: "/project/motivation/history",

            }).fail(function(jqXHR, textStatus, errorThrown) {

                $.LoadingOverlay("hide");
                Swal.fire('Erro!', jqXHR.responseText, 'error');

            }).done(function (snapshots) {

                if(snapshots) {

                    snapshots = snapshotsToJson(snapshots);

                    generateLineChartStudents("allStudentsMotivationDiv", snapshots, evcRankings);
                    generateLineChartGeneral("generalMotivationDiv", snapshots, evcRankings);

                }

                $.LoadingOverlay("hide");

            });

        }

        $.LoadingOverlay("hide");

    });

}

function snapshotsToJson(snapshots) {

    for(var snapshot of snapshots) {
        snapshot.jsonSnapshot = JSON.parse(snapshot.jsonSnapshot)
    }

    return snapshots;

}

function generateEvcCharts(editorJson) {

    getEvcRankings(editorJson).then((allData)=> {

        var countStudents = allData.allUsersEvc.length;
        var countCourses = allData.allCoursesEvc.length;

        var moreMotivatedStudent = countStudents > 0 ? allData.allUsersEvc[0] : {label: "", id: 0, evc: 0, e: 0, v: 0, c: 0};
        var lessMotivatedStudent = countStudents > 0 ? allData.allUsersEvc[countStudents - 1] : {label: "", id: 0, evc: 0, e: 0, v: 0, c: 0};

        var moreMotivatedCourse = countCourses > 0 ? allData.allCoursesEvc[0] : {label: "" , evc: 0, e: 0, v: 0, c: 0};
        var lessMotivatedCourse = countCourses > 0 ? allData.allCoursesEvc[countCourses - 1] : {label: "", id: 0, evc: 0, e: 0, v: 0, c: 0};

        var generalEvc = allData.generalEvc ? allData.generalEvc : {label: "Geral", id: 0, evc: 0, e: 0, v: 0, c: 0};

        pageAllUsersEvc = allData.allUsersEvc;
        pageAllCoursesEvc = allData.allCoursesEvc;
        pageGeneralEvc = generalEvc;

        generateBubbleChart("allStudentsBubbleMotivationDiv", pageAllUsersEvc);

        populateCustomChartsSelect(generalEvc, pageAllUsersEvc, pageAllCoursesEvc);

        $('#labelMoreMotivatedStudent').text(moreMotivatedStudent.label);
        $('#labelLessMotivatedStudent').text(lessMotivatedStudent.label);

        $('#labelMoreMotivatedCourse').text(moreMotivatedCourse.label);
        $('#labelLessMotivatedCourse').text(lessMotivatedCourse.label);

        generateRadarChart("moreMotivatedStudentDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [moreMotivatedStudent.e*100, moreMotivatedStudent.v*100, moreMotivatedStudent.c*100], [0x000000, 0x767676], generalEvc.label,  moreMotivatedStudent.label, false);
        generateRadarChart("lessMotivatedStudentDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [lessMotivatedStudent.e*100, lessMotivatedStudent.v*100, lessMotivatedStudent.c*100], [0x000000, 0x767676], generalEvc.label, lessMotivatedStudent.label, false);
        generateRadarChart("moreMotivatedCoursetDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [moreMotivatedCourse.e*100, moreMotivatedCourse.v*100, moreMotivatedCourse.c*100], [0x000000, 0x767676], generalEvc.label, moreMotivatedCourse.label, false);
        generateRadarChart("lessMotivatedCoursetDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [lessMotivatedCourse.e*100, lessMotivatedCourse.v*100, lessMotivatedCourse.c*100], [0x000000, 0x767676], generalEvc.label, lessMotivatedCourse.label, false);

        generateGaugeChart("moreMotivatedStudentDiv2", generalEvc.evc*100, moreMotivatedStudent.evc*100, [0x000000, 0x767676], generalEvc.label,  moreMotivatedStudent.label, false);
        generateGaugeChart("lessMotivatedStudentDiv2", generalEvc.evc*100, lessMotivatedStudent.evc*100, [0x000000, 0x767676], generalEvc.label, lessMotivatedStudent.label, false);
        generateGaugeChart("moreMotivatedCoursetDiv2", generalEvc.evc*100, moreMotivatedCourse.evc*100, [0x000000, 0x767676], generalEvc.label, moreMotivatedCourse.label, false);
        generateGaugeChart("lessMotivatedCoursetDiv2", generalEvc.evc*100, lessMotivatedCourse.evc*100, [0x000000, 0x767676], generalEvc.label, lessMotivatedCourse.label, false);

        generateRadarChart("customRadarChartDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [0x000000, 0x767676], generalEvc.label, generalEvc.label, false);
        generateGaugeChart("customGaugeChartDiv", generalEvc.evc*100, generalEvc.evc*100, [0x000000, 0x767676], generalEvc.label,  generalEvc.label, false);

    });

}

$('#btZoomIn').click(function(){
    configEditor.zoom_in_by_value(0.05);
});

$('#btZoomOut').click(function(){
    configEditor.zoom_out_by_value(0.05);
});

$('#btZoomReset').click(function(){
    configEditor.zoom_load(projectZoom ? projectZoom : 0.7);
    configEditor.position_load(projectPositionX ? projectPositionX : 0, projectPositionY ? projectPositionY : 0);
});

$('#btZoomDefault').click(function(){
    configEditor.zoom_reset();
});

$('#btReset').click(function(){
    configEditor.clear();
    sankeyChartRoot.container.children.clear();
});

function generateProjectSankeyChart(nodes, links) {

    sankeyChartRoot.container.children.clear();

    sankeyChartRoot.setThemes([
        am5themes_Animated.new(sankeyChartRoot)
    ]);

    var series = sankeyChartRoot.container.children.push(am5flow.Sankey.new(sankeyChartRoot, {
        sourceIdField: "from",
        targetIdField: "to",
        valueField: "value",
        paddingRight: 450,
        nodeWidth: 10
    }));

    series.nodes.setAll({
        nameField: "name",
    });

    series.links.template.setAll({
        tooltipText: "[bold]{source.name}[/]\n{target.name}",
        fillOpacity: 0.2
    });

    series.nodes.labels.template.setAll({
        fill: am5.color(0xffffff)
    });

    series.nodes.nodes.template.setAll({
        draggable: false,
    });

    series.nodes.rectangles.template.setAll({
        fillOpacity: 0.5,
        stroke: am5.color(0x000000),
        strokeWidth: 1,
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        cornerRadiusBL: 4,
        cornerRadiusBR: 4,
        tooltipText: "[bold]{name}[/]\n{info}"
    });

    series.nodes.data.setAll(nodes)

    series.data.setAll(links);

    series.appear(1000, 100);

}

$(".temp-class").click(function(){
    $('#divChartsComparison').modalJ({
        fadeDuration: 100
    });
});

$("#btShowCustomChart").click(function(){

    var id1 = $('#selectChart1Content').val();
    var group1 = $('#selectChart1Content option:selected').attr("group");

    var id2 = $('#selectChart2Content').val();
    var group2 = $('#selectChart2Content option:selected').attr("group");

    var data1;
    var data2;

    switch(group1) {

        case "user":
            data1 = _.find(pageAllUsersEvc, (o)=>id1 == o.id);
            break;

        case "course":
            data1 = _.find(pageAllCoursesEvc, (o)=>id1 == o.id);
            break;

        default:
            data1 = pageGeneralEvc;
            break;

    }

    switch(group2) {

        case "user":
            data2 = _.find(pageAllUsersEvc, (o)=>id2 == o.id);
            break;

        case "course":
            data2 = _.find(pageAllCoursesEvc, (o)=>id2 == o.id);
            break;

        default:
            data2 = pageGeneralEvc;
            break;

    }

    generateRadarChart("customRadarChartDiv", [data1.e*100, data1.v*100, data1.c*100], [data2.e*100, data2.v*100, data2.c*100], [0x000000, 0x767676], data1.label, data2.label, false);
    generateGaugeChart("customGaugeChartDiv", data1.evc*100, data2.evc*100, [0x000000, 0x767676], data1.label,  data2.label, false);

});

configEditor.zoom_out_by_value(0.3);

importUsersNodes();
importDefaultDataDashboard();