import Drawflow from '../js/drawflow.js';

var sankeyChartRoot = am5.Root.new("sankeyChartDiv");

darkMode(true);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

var configCanvas = document.getElementById("projectConfigCanvas");
const configEditor = new Drawflow(configCanvas);

configEditor.start();

configEditor.on("nodeCreated", processProjectConfigDelayed);
configEditor.on("connectionCreated", processProjectConfigDelayed);
configEditor.on("nodeRemoved", processProjectConfigDelayed);
configEditor.on("connectionRemoved", processProjectConfigDelayed);
configEditor.on("nodeDataChanged", processProjectConfigDelayed);

$('#btTest').click(function(){
    processProjectConfig().then((data)=>{$.notify('Teste realizado!', "success");});
});

$('#btSave').click(function(){

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/project/saveConfig",
        data: { jsonConfig: JSON.stringify(configEditor.export()) }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (msg) {

        $.LoadingOverlay("hide");
        $.notify(msg, "success");

        processProjectConfig();

    });

});

$('#btImport').click(function(){
    importDefaultData();
});

// Give time to remove all the connections. Avoid exhibition of old data.
function processProjectConfigDelayed() {

    var delayInMilliseconds = 500; //1 second

    setTimeout(function() {
        processProjectConfig();
    }, delayInMilliseconds);

}

async function processProjectConfig() {

    var editorJson = configEditor.getJson();
    var configData = await getConfigData(editorJson);
    var linksNodes = await getSankeyChartDataFromConfig(configData);

    // console.log(JSON.stringify(JSON.parse(editorJson),null,'\t'));
    // console.log(JSON.stringify(configData,null,'\t'));
    // console.log(JSON.stringify(linksNodes.nodes,null,'\t'));
    // console.log(JSON.stringify(linksNodes.links,null,'\t'));

    generateProjectSankeyChart(linksNodes.nodes, linksNodes.links);

    return({configData: configData, nodes: linksNodes.nodes, links: linksNodes.links});

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

            nodes.push({ id: decision.id, type: "DECISAO", name: decision.question, info : `Stakeholders: ${decision.stakeholders.length}`, fill: am5.color(nodeColor) });
            links.push({ from: step.id, to: decision.id, value: Math.max(1, decision.stakeholders.length) });

            if(decision.stakeholders.length === 0) {
                links.push({ from: decision.id, to: 0, value: 1 });
            }

            for(const stakeholder of allStakeholders) {
                nodes.push({ id: stakeholder.id, type: "STAKEHOLDER", name: stakeholder.stakeholderName, info : "", fill: am5.color(0x1a2035) });
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

        stakeholder.info = `Decisões: ${count}`;

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
            addUserNode(`${user.name} - ${user.courseName}`, user.id)
        }
        $.LoadingOverlay("hide");
    });

}

function addUserNode(optionText, optionValue) {
    $('#selectNodeType').append(`<option value="${optionValue}">${optionText}&nbsp;&nbsp;&nbsp;</option>`);
}

function importDefaultData() {

    $.LoadingOverlay("show");

    $.ajax({
        method: "GET",
        url: "/users/get/loggedUserData",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        $.LoadingOverlay("hide");
        if(dataToImport) {
            var userName = dataToImport.userName;
            $("#labelUserName").text(userName);
        }
    });

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/project/loadConfig",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (dataToImport) {

        if(dataToImport) {

            var projectName = dataToImport.projectName;
            var jsonConfig = dataToImport.jsonConfig;

            $("#labelProjectName").text(projectName);

            if(!jsonConfig) {
                $.LoadingOverlay("hide");
                return;
            }

            configEditor.import(JSON.parse(jsonConfig));

            processProjectConfig();

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
        //fontSize: 20,
        //maxWidth: 150,
        fill: am5.color(0xffffff),
        //oversizedBehavior: "wrap"
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

    series.appear(1000, 500);

}

configEditor.zoom_out_by_value(0.3);

importUsersNodes();
importDefaultData();