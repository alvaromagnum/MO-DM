import Drawflow from '../js/drawflow.js';

var root = am5.Root.new("sankeyChartDiv");

darkMode(true);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
})

var configCanvas = document.getElementById("projectConfigCanvas");
const editor = new Drawflow(configCanvas);

editor.start();

$('#btSave').click(function(){

    //console.log(JSON.stringify(editor.export(), null, '\t'));

    $.ajax({

        method: "POST",
        url: "/project/saveConfig",
        data: { jsonConfig: JSON.stringify(editor.export()) }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (msg) {

        Swal.fire({

            title: 'Sucesso!',
            html: msg,
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK'

        });

        processProjectConfig();

    });

});

$('#btImport').click(function(){
    importDefaultData();
});

function processProjectConfig() {

    processData(editor.getJson()).then((steps)=>{

        var nodes = [];
        var links = [];
        var repeatedStakeholders = [];

        for(const step of steps) {

            nodes.push({ id: step.id, name: step.stepName, fill: am5.color(0x1a2035) });

            for(const decision of step.decisions) {

                nodes.push({ id: decision.id, name: decision.question, fill: am5.color(0x1a2035) });
                links.push({ from: step.id, to: decision.id, value: decision.stakeholders.length });

                for(const stakeholder of decision.stakeholders) {
                    repeatedStakeholders.push(stakeholder);
                }

                var stakeholders = _.uniq(repeatedStakeholders, true, (o)=>{return o.idUser});

                for(const stakeholder of stakeholders) {
                    nodes.push({ id: stakeholder.id, name: stakeholder.stakeholderName, fill: am5.color(0x1a2035) });
                    links.push({ from: decision.id, to: stakeholder.id, value: decision.stakeholders.length });
                }

            }

        }

        nodes = _.uniq(nodes, true, (o)=> {return o.id});

        generateProjectSankeyChart(nodes, links);

        // console.log(JSON.stringify(editor.export(),null,'\t'));
        // console.log(JSON.stringify(steps,null,'\t'));
        // console.log(JSON.stringify(nodes,null,'\t'));
        // console.log(JSON.stringify(links,null,'\t'));

    });

}

function importDefaultData() {

    $.ajax({
        method: "GET",
        url: "/project/loadConfig",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        if(dataToImport) {
            editor.import(JSON.parse(dataToImport));
            processProjectConfig();
        }
    });

}

async function processData(json) {

    var querySteps = '[drawflow.Home.data.*[name=\'step\'].[${\'id\': id, \'stepName\': data.step_name, \'previousStepId\' : inputs.input_1.connections.node & \'\', \'nextStepId\': outputs.output_1.connections.node & \'\', \'decisions\': []}].*]';
    var steps = await jsonata(querySteps).evaluate(JSON.parse(json));

    for(const step of Array.from(steps)) {

        var queryDecisions = `[drawflow.Home.data.*[name='decision'][inputs.input_1.connections.node='${step.id}'].[\${'id':id, 'question':data.question, 'stakeholders': []}].*]`;
        step.decisions = await jsonata(queryDecisions).evaluate(JSON.parse(json));

        for(const decision of step.decisions) {

            var queryStakeholders = `[drawflow.Home.data.*[name='stakeholder' and '${decision.id}' in inputs.input_1.connections.node].[\${'id': id, 'idUser':$number(data.user_id), 'stakeholderName': 'STAKEHOLDER ' & data.user_id}].*]`;
            var stakeholders = await jsonata(queryStakeholders).evaluate(JSON.parse(json));

            decision.stakeholders = _.uniq(stakeholders, true, (o)=>{return o.idUser});

        }

    }

    //console.log(JSON.stringify(steps,null,'\t'));

    return steps;

}

$('#btZoomIn').click(function(){
    editor.zoom_in_by_value(0.05);
});

$('#btZoomOut').click(function(){
    editor.zoom_out_by_value(0.05);
});

$('#btZoomReset').click(function(){
    editor.zoom_reset();
});

$('#btReset').click(function(){
    editor.clear();
});

editor.zoom_out_by_value(0.3);

importDefaultData();

/************************************************** Sankey Diagram */



function generateProjectSankeyChart(nodes, links) {

    root.container.children.clear();

    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var series = root.container.children.push(am5flow.Sankey.new(root, {
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
        cornerRadiusBR: 4
    });

    series.nodes.data.setAll(nodes)

    series.data.setAll(links);

    series.appear(1000, 500);

}