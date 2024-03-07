import Drawflow from '../js/drawflow.js';

darkMode(true);
activateTooltips();

var pageAllUsersEvc;
var projectZoom;
var projectPositionX;
var projectPositionY;
var currentProjectJson;

var configCanvas = document.getElementById("projectConfigCanvas");
var configEditor = new Drawflow(configCanvas);

configEditor.start();
configEditor.editor_mode = 'admin';

async function processProjectConfig() {

    allProjectData = await getFullProjectData(configEditor.getJson(), false, 0);

    var editorJson = configEditor.getJson();
    var configData = await getConfigData(editorJson);
    var linksNodes = await getSankeyChartDataFromConfig(configData);

    generateProjectSankeyChart(linksNodes.nodes, linksNodes.links);

    await generateProjectPendencies(allProjectData, true);

    return({configData: configData, nodes: linksNodes.nodes, links: linksNodes.links});

}

function importProjectNames() {

    $.LoadingOverlay("show");

    $.ajax({
        method: "GET",
        url: "/project/get/all",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (projects) {
        for(var project of projects) {
            addProjectName(project.name, project.id)
        }
        $.LoadingOverlay("hide");
    });

}

function addProjectName(name, id) {
    $('#selectProjectNames').append(`<option value="${id}">${name.toUpperCase()}&nbsp;&nbsp;&nbsp;</option>`);
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

        await load(dataToImport);
        $.LoadingOverlay("hide");

    });

}

function clearLabels() {

    $('#labelMoreMotivatedStudent').text('---');
    $('#labelLessMotivatedStudent').text('---');
    $('#labelMoreMotivatedCourse').text('---');
    $('#labelLessMotivatedCourse').text('---');

}

async function load(dataToImport) {

    configEditor.clear();

    clearCharts(4);

    clearLabels();

    if (dataToImport) {

        var projectName = dataToImport.projectName;
        var jsonConfig = dataToImport.jsonConfig;

        $("#labelProjectName").text(projectName);
        $("#selectProjectNames").val(dataToImport.projectId);

        if(projectName !== "[TODOS ➤ ADMIN]") {

            $('#buttonResults').show();
            $('#divCardSankeyChart').show();
            $('#divCardProjectConfig').show();

        }
        else {

            $('#buttonResults').hide();
            $('#divCardSankeyChart').hide();
            $('#divCardProjectConfig').hide();

            loadAllProjects();

        }

        if (!jsonConfig) {
            $.LoadingOverlay("hide");
            return;
        }

        currentProjectJson = JSON.parse(jsonConfig);

        configEditor.import(currentProjectJson);

        projectZoom = configEditor.zoom;
        projectPositionX = configEditor.x;
        projectPositionY = configEditor.y;

        $('input').attr("readonly", "readonly");

        await processProjectConfig();
        await generateEvcCharts(jsonConfig);

        var evcRankings = await getEvcRankings(jsonConfig);

        generateLineCharts(evcRankings, false);

    }

}

function generateLineCharts(evcRankings, full) {

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: full ? "/project/motivation/allHistory" : "/project/motivation/history",

    }).fail(function (jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (snapshots) {

        if (snapshots) {

            snapshots = snapshotsToJson(snapshots);

            generateLineChartStudents("allStudentsMotivationDiv", snapshots, evcRankings, pageAllUsersEvc);
            generateLineChartGeneral("generalMotivationDiv", snapshots, evcRankings);

        }

        $.LoadingOverlay("hide");

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

function getAllProjectIds() {

    var allProjectIds = new Array();

    $('#selectProjectNames option').each(function(){
        var id = Number(this.value);
        if(id > 0) allProjectIds.push(id);
    });

    return allProjectIds;

}

function loadAllProjects() {

    $.LoadingOverlay("show");

    $.ajax({
        method: "POST",
        url: "/project/getAllJson",
        data: {projectIds: getAllProjectIds()}
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        $.LoadingOverlay("hide");
    }).done(async function (result) {
        loadAllProjectData(result.jsons);
        $.LoadingOverlay("hide");
    });

}

async function loadAllProjectData(allJsons) {

    $.LoadingOverlay("show");

    $("#tablePendencies").html("");

    var evcRankings = new Array();

    for(var json of allJsons) {

        var jsonObject = JSON.parse(json);

        var projectId = jsonObject.projectId;
        var projectName = jsonObject.projectName;

        var projectData = await getFullProjectData(json, false, projectId);

        $("#tablePendencies").append(`<td colspan="2" class="background-row-pendencies"><b>PROJETO:</b> ${projectName}</td>`);

        await generateProjectPendencies(projectData, false);

        evcRankings.push(await getEvcRankingsFromFullData(projectData));

    }

    var allUsersEvc = new Array();
    var allCoursesEvcWithDuplicates = new Array();
    var allCoursesEvc = new Array();

    var allGeneral = new Array();
    var allUsers = new Array();
    var allCourses = new Array();

    for(var evcRanking of evcRankings) {

        allGeneral.push(evcRanking.generalEvc);
        allUsers.push(evcRanking.allUsersEvc);
        allCourses.push(evcRanking.allCoursesEvc);

    }

    var evc = (_.reduce(_.map(allGeneral, (o) => Number(o.evc)), function(x, y){ return (x + y); }, 0)/allGeneral.length).toFixed(2);
    var e = (_.reduce(_.map(allGeneral, (o) => Number(o.e)), function(x, y){ return (x + y); }, 0)/allGeneral.length).toFixed(2);
    var v = (_.reduce(_.map(allGeneral, (o) => Number(o.v)), function(x, y){ return (x + y); }, 0)/allGeneral.length).toFixed(2);
    var c = (_.reduce(_.map(allGeneral, (o) => Number(o.c)), function(x, y){ return (x + y); }, 0)/allGeneral.length).toFixed(2);

    var generalEvc = {id: 0, label: "Geral", evc: evc, e: e, v: v, c: c};

    for(var users of allUsers) allUsersEvc = allUsersEvc.concat(users);
    for(var courses of allCourses) allCoursesEvcWithDuplicates = allCoursesEvcWithDuplicates.concat(courses);

    allCoursesEvc = _.uniq(allCoursesEvcWithDuplicates, (o) => o.id);

    var newAllCoursesEvc = new Array();

    for(var course of allCoursesEvc) {

        var id = course.id;
        var label = course.label;
        var duplicates = _.filter(allCoursesEvcWithDuplicates, (o) => o.id === id);
        var itemsCount = duplicates.length;

        var evc = (_.reduce(_.map(duplicates, (o) => Number(o.evc)), function(x, y){ return (x + y); }, 0)/itemsCount).toFixed(2);
        var e = (_.reduce(_.map(duplicates, (o) => Number(o.e)), function(x, y){ return (x + y); }, 0)/itemsCount).toFixed(2);
        var v = (_.reduce(_.map(duplicates, (o) => Number(o.v)), function(x, y){ return (x + y); }, 0)/itemsCount).toFixed(2);
        var c = (_.reduce(_.map(duplicates, (o) => Number(o.c)), function(x, y){ return (x + y); }, 0)/itemsCount).toFixed(2);

        newAllCoursesEvc.push({id: id, label: label, evc: evc, e: e, v: v, c: c});

    }

    allCoursesEvc = newAllCoursesEvc;

    var allData = {generalEvc: generalEvc, allUsersEvc: allUsersEvc, allCoursesEvc: allCoursesEvc};

    generateEvcChartsFromEvcRankings(allData);
    generateLineCharts(allData, true);

    $.LoadingOverlay("hide");

}

function generateEvcChartsFromEvcRankings(allData) {

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

}

async function getEvcRankingsFromFullData(fullData) {

    var queryAllUsers = `[$distinct(decisions.stakeholders.$.{"idUser": idUser, "stakeholderName": stakeholderName, "courseName": courseName, "idCourse": idCourse})]`;
    var allUsers = await jsonata(queryAllUsers).evaluate(fullData);

    var queryAllCourses = `[$distinct(decisions.stakeholders.$.{"courseName": courseName, "idCourse": idCourse})]`;
    var allCourses = await jsonata(queryAllCourses).evaluate(fullData);

    var allUsersEvc = [];

    for(var user of allUsers) {

        var queryUserEvc = "${\"evc\": $average(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.evc[%.UserId="+user.idUser+"]), \"e\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.e[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.v[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.c[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5}))}";
        var userEvc = await jsonata(queryUserEvc).evaluate(fullData);

        if(!userEvc.evc) userEvc = {evc: 0, e: 0, v: 0, c: 0};

        allUsersEvc.push({id: user.idUser, label: user.stakeholderName, evc: userEvc.evc.toFixed(2), e: userEvc.e.toFixed(2), v: userEvc.v.toFixed(2), c: userEvc.c.toFixed(2)})

    }

    var allCoursesEvc = [];

    for(var course of allCourses) {

        var queryCourseEvc = "${\"evc\": $average(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.evc[%.CourseId="+course.idCourse+"]), \"e\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.e[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.v[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.c[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5}))}";
        var courseEvc = await jsonata(queryCourseEvc).evaluate(fullData);

        if(!courseEvc.evc) courseEvc = {evc: 0, e: 0, v: 0, c: 0};

        allCoursesEvc.push({id: course.idCourse, label: course.courseName, evc: courseEvc.evc.toFixed(2), e: courseEvc.e.toFixed(2), v: courseEvc.v.toFixed(2), c: courseEvc.c.toFixed(2)})

    }

    var queryAllUsersOrderedByEvc = `[*^(>evc, label)]`;
    allUsersEvc = await jsonata(queryAllUsersOrderedByEvc).evaluate(allUsersEvc);

    var queryAllCoursesOrderedByEvc = `[*^(>evc, label)]`;
    allCoursesEvc = await jsonata(queryAllCoursesOrderedByEvc).evaluate(allCoursesEvc);

    var generalEvc = allUsersEvc.length > 0 ? {evc: math.mean(allUsersEvc.map((o)=>o.evc)), e: math.mean(allUsersEvc.map((o)=>o.e)), v: math.mean(allUsersEvc.map((o)=>o.v)), c: math.mean(allUsersEvc.map((o)=>o.c))} : {evc: 0, e: 0, v: 0, c: 0};

    generalEvc = {id: 0, label: "Geral", evc: generalEvc.evc.toFixed(2), e: generalEvc.e.toFixed(2), v: generalEvc.v.toFixed(2), c: generalEvc.c.toFixed(2)};

    return {generalEvc: generalEvc, allUsersEvc: allUsersEvc, allCoursesEvc: allCoursesEvc}

}

$('#selectProjectNames').change(function() {

    var selectedProjectId = $('#selectProjectNames').val();

    $.LoadingOverlay("show");

    $.ajax({
        method: "POST",
        url: "/project/setCurrent",
        data: { idProject: selectedProjectId }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        $.LoadingOverlay("hide");
    }).done(async function (result) {
        await load(result);
        $.LoadingOverlay("hide");
    });

});

configEditor.zoom_out_by_value(0.3);

$('#buttonResults').hide();
$('#divCardSankeyChart').hide();
$('#divCardProjectConfig').hide();

importProjectNames();
importDefaultDataDashboard();