import Drawflow from '../js/drawflow.js';

darkMode(true);
activateTooltips();

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

    var fullOldData = await getFullProjectData(JSON.stringify(currentProjectJson), true, 0);
    var fullNewData = await getFullProjectData(JSON.stringify(newJson), true, 0);

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

    allProjectData = await getFullProjectData(configEditor.getJson(), false, 0);

    var editorJson = configEditor.getJson();
    var configData = await getConfigData(editorJson);
    var linksNodes = await getSankeyChartDataFromConfig(configData);

    generateProjectSankeyChart(linksNodes.nodes, linksNodes.links);

    await generateProjectPendencies(allProjectData, true);

    return({configData: configData, nodes: linksNodes.nodes, links: linksNodes.links});

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
        if(user) $("#labelUserName").text(user.userName);
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

async function load(dataToImport) {

    clearCharts(11);

    if(dataToImport) {

        var projectName = dataToImport.projectName;
        var jsonConfig = dataToImport.jsonConfig;

        $("#labelProjectName").text(projectName);

        if (!jsonConfig) {
            $.LoadingOverlay("hide");
            return;
        }

        loadAllUsers(dataToImport.projectUsers);

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

                generateLineChartStudents("allStudentsMotivationDiv", snapshots, evcRankings, pageAllUsersEvc);
                generateLineChartGeneral("generalMotivationDiv", snapshots, evcRankings, false);

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

$('#btReset').click(function(){
    configEditor.clear();
    sankeyChartRoot.container.children.clear();
});

configEditor.zoom_out_by_value(0.3);

importUsersNodes();
importDefaultDataDashboard();