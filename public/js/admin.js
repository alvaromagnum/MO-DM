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

    console.log(JSON.stringify(allProjectData, null, "\t"));

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

    clearCharts();
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

        $.LoadingOverlay("show");

        $.ajax({

            method: "GET",
            url: "/project/motivation/history",

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

    for(var json of allJsons) {

        var jsonObject = JSON.parse(json);
        var projectId = jsonObject.projectId;
        var projectData = await getFullProjectData(json, false, projectId);

        generateProjectPendencies(projectData, false);

    }

    $.LoadingOverlay("hide");

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