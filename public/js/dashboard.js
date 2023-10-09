import Drawflow from '../js/drawflow.js';

var sankeyChartRoot = am5.Root.new("sankeyChartDiv");

darkMode(true);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.toast').toast();
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

    $.ajax({
        method: "POST",
        url: "/project/saveConfig",
        data: { jsonConfig: JSON.stringify(configEditor.export()) }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (msg) {
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

    var configData = await getConfigData(configEditor.getJson());
    var linksNodes = await getSankeyChartDataFromConfig(configData);

    // console.log(JSON.stringify(JSON.parse(configEditor.getJson()),null,'\t'));
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

    nodes.push({ id: -1, type: "DECISAO", name: "SEM DECISÕES", info : "---", fill: am5.color(0x000000) });
    nodes.push({ id: 0, type: "STAKEHOLDER", name: "SEM STAKEHOLDERS", info : "---", fill: am5.color(0x000000) });

    for(const step of steps) {

        nodes.push({ id: step.id, type: "ETAPA", name: step.stepName, info : `Decisões: ${step.decisions.length}`, fill: am5.color(0x1a2035) });

        if(step.decisions.length === 0) {
            links.push({ from: step.id, to: -1, value: 1 });
            links.push({ from: -1, to: 0, value: 1 });
        }

        for(const decision of step.decisions) {

            decision.stakeholders = _.uniq(decision.stakeholders, true, (o)=>{return o.idUser});

            for(const stakeholder of decision.stakeholders) {
                allStakeholders.push(stakeholder);
            }

            nodes.push({ id: decision.id, type: "DECISAO", name: decision.question, info : `Stakeholders: ${decision.stakeholders.length}`, fill: am5.color(0x1a2035) });
            links.push({ from: step.id, to: decision.id, value: Math.max(decision.stakeholders.length, 1) });

            if(decision.stakeholders.length === 0) {
                links.push({ from: decision.id, to: 0, value: 1 });
            }

            allStakeholders = _.uniq(allStakeholders, true, (o)=>{return o.idUser});

            for(const stakeholder of allStakeholders) {
                nodes.push({ id: stakeholder.id, type: "STAKEHOLDER", name: stakeholder.stakeholderName, info : "", fill: am5.color(0x1a2035) });
                if(decision.stakeholders.length > 0) links.push({ from: decision.id, to: stakeholder.id, value: decision.stakeholders.length });
            }

        }

    }

    nodes = _.uniq(nodes, true, (o)=> {return o.id});

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

function importDefaultData() {

    $.ajax({
        method: "GET",
        url: "/project/loadConfig",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        if(dataToImport) {
            configEditor.import(JSON.parse(dataToImport));
            processProjectConfig();
        }
    });

}

async function getConfigData(json) {

    var querySteps = '[drawflow.Home.data.*[name=\'step\'].[${\'id\': id, \'stepName\': data.step_name, \'previousStepId\' : inputs.input_1.connections.node & \'\', \'nextStepId\': outputs.output_1.connections.node & \'\', \'decisions\': []}].*]';
    var steps = await jsonata(querySteps).evaluate(JSON.parse(json));

    for(const step of steps) {

        var queryDecisions = `[drawflow.Home.data.*[name='decision']['${step.id}' in inputs.input_1.connections.node].[\${'id':id, 'question':data.question, 'stakeholders': []}].*]`;
        step.decisions = await jsonata(queryDecisions).evaluate(JSON.parse(json));

        for(const decision of step.decisions) {

            var queryStakeholders = `[drawflow.Home.data.*[name='stakeholder' and '${decision.id}' in inputs.input_1.connections.node].[\${'id': id, 'idUser':$number(data.user_id), 'stakeholderName': 'STAKEHOLDER ' & data.user_id}].*]`;
            var stakeholders = await jsonata(queryStakeholders).evaluate(JSON.parse(json));

            decision.stakeholders = _.uniq(stakeholders, true, (o)=>{return o.idUser});

        }

    }

    return steps;

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
        paddingRight: 200
    }));

    series.nodes.setAll({
        nameField: "name"
    });

    series.links.template.setAll({
        tooltipText: "[bold]{source.name}[/]\n{target.name}"
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
        tooltipText: "[bold]{name}[/]\n{info}",
    });

    series.nodes.data.setAll(nodes)

    series.data.setAll(links);

    series.appear(1000, 500);

}

configEditor.zoom_out_by_value(0.3);

importDefaultData();