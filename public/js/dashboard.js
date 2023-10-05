import Drawflow from '../js/drawflow.js';

darkMode(true);

$(function () {
    console.log( "entrou");
    $('[data-toggle="tooltip"]').tooltip();
})

var configCanvas = document.getElementById("projectConfigCanvas");
const editor = new Drawflow(configCanvas);

editor.start();

$('#btSave').click(function(){
    console.log(JSON.stringify(editor.export(), null, '\t'));
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

    });
});

$('#btImport').click(function(){
    importDefaultData();
});

$('#btGetDados').click(function(){
    processData(editor.getJson())
});

function importDefaultData() {
    //var dataToImport = {"drawflow":{"Home":{"data":{"1":{"id":1,"name":"step","data":{"step_name":"Início"},"class":"step-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: rebeccapurple; padding: 5px; color: white\">\n            <i class=\"bi-arrow-right-square\"></i> Etapa\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-step_name/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[]}},"outputs":{"output_1":{"connections":[{"node":"2","output":"input_1"}]},"output_2":{"connections":[{"node":"4","output":"input_1"},{"node":"5","output":"input_1"},{"node":"6","output":"input_1"}]}},"pos_x":-282,"pos_y":-52.57142857142857},"2":{"id":2,"name":"step","data":{"step_name":"Meio"},"class":"step-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: rebeccapurple; padding: 5px; color: white\">\n            <i class=\"bi-arrow-right-square\"></i> Etapa\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-step_name/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"1","input":"output_1"}]}},"outputs":{"output_1":{"connections":[{"node":"3","output":"input_1"}]},"output_2":{"connections":[{"node":"7","output":"input_1"},{"node":"8","output":"input_1"}]}},"pos_x":147,"pos_y":-64.57142857142857},"3":{"id":3,"name":"step","data":{"step_name":"Fim"},"class":"step-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: rebeccapurple; padding: 5px; color: white\">\n            <i class=\"bi-arrow-right-square\"></i> Etapa\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-step_name/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"2","input":"output_1"}]}},"outputs":{"output_1":{"connections":[]},"output_2":{"connections":[{"node":"9","output":"input_1"}]}},"pos_x":658,"pos_y":-78.85714285714286},"4":{"id":4,"name":"decision","data":{"question":"Qual projeto será trabalhado?"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"1","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"13","output":"input_1"},{"node":"14","output":"input_1"},{"node":"15","output":"input_1"}]}},"pos_x":70,"pos_y":138},"5":{"id":5,"name":"decision","data":{"question":"Quem será o líder do projeto?"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"1","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"14","output":"input_1"},{"node":"15","output":"input_1"}]}},"pos_x":71.42857142857143,"pos_y":298},"6":{"id":6,"name":"decision","data":{"question":"Qual a linguagem de programação utilizada?"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"1","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"15","output":"input_1"}]}},"pos_x":73,"pos_y":465},"7":{"id":7,"name":"decision","data":{"question":"Decisão 1?"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"2","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"11","output":"input_1"},{"node":"12","output":"input_1"}]}},"pos_x":978,"pos_y":201.57142857142858},"8":{"id":8,"name":"decision","data":{"question":"Decisão 2?"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"2","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"12","output":"input_1"},{"node":"11","output":"input_1"}]}},"pos_x":998,"pos_y":420},"9":{"id":9,"name":"decision","data":{"question":"Decisão 3"},"class":"decision-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: #0f5132; padding: 5px; color: white\">\n            <i class=\"bi-patch-question\"></i> Decisão\n        </div>\n        <div><br/></div>\n        <div>\n            <input class=\"rounded\" type=\"text\" df-question/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"3","input":"output_2"}]}},"outputs":{"output_1":{"connections":[{"node":"10","output":"input_1"}]}},"pos_x":1017.4285714285714,"pos_y":-65.14285714285714},"10":{"id":10,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"9","input":"output_1"}]}},"outputs":{},"pos_x":1325,"pos_y":-77.57142857142857},"11":{"id":11,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"7","input":"output_1"},{"node":"8","input":"output_1"}]}},"outputs":{},"pos_x":1340.4285714285713,"pos_y":203},"12":{"id":12,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"8","input":"output_1"},{"node":"7","input":"output_1"}]}},"outputs":{},"pos_x":1343,"pos_y":408.57142857142856},"13":{"id":13,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"4","input":"output_1"}]}},"outputs":{},"pos_x":418.42857142857144,"pos_y":130},"14":{"id":14,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"4","input":"output_1"},{"node":"5","input":"output_1"}]}},"outputs":{},"pos_x":423,"pos_y":316},"15":{"id":15,"name":"stakeholder","data":{"user_id":"2"},"class":"stakeholder-node","html":"\n    <div class=\"container\">\n        <div class=\"col rounded\" style=\"background-color: steelblue; padding: 5px; color: white; width: 250px\">\n            <i class=\"bi-person\"></i> Stakeholder\n        </div>\n        <div><br/></div>\n        <div class=\"text-center\">\n            <input type=\"hidden\" df-user_id>\n            <img src=\"/img/userPlaceholder.png\" style=\"width: 50px; height: 50px\"/>\n        </div>\n    </div>\n","typenode":false,"inputs":{"input_1":{"connections":[{"node":"4","input":"output_1"},{"node":"5","input":"output_1"},{"node":"6","input":"output_1"}]}},"outputs":{},"pos_x":424.57142857142856,"pos_y":495}}}}};
    $.ajax({
        method: "GET",
        url: "/project/loadConfig",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        if(dataToImport) editor.import(JSON.parse(dataToImport));
    });
}

async function processData(json) {

    var querySteps = '[drawflow.Home.data.*[name=\'step\'].[${\'id\': id, \'stepName\': data.step_name, \'previousStepId\' : inputs.input_1.connections.node & \'\', \'nextStepId\': outputs.output_1.connections.node & \'\', \'decisions\': []}].*]';

    var steps = await jsonata(querySteps).evaluate(JSON.parse(json));

    for(const step of Array.from(steps)) {

        var queryDecisions = `[drawflow.Home.data.*[name='decision'][inputs.input_1.connections.node='${step.id}'].[\${'id':id, 'question':data.question, 'stakeholders': []}].*]`;

        var decisions = await jsonata(queryDecisions).evaluate(JSON.parse(json));

        step.decisions = Array.from(decisions);

        for(const decision of step.decisions) {

            var queryStakeholders = `[drawflow.Home.data.*[name='stakeholder' and '${decision.id}' in inputs.input_1.connections.node].data.user_id]`;

            var stakeholders = await jsonata(queryStakeholders).evaluate(JSON.parse(json));
            var stakeholderIds = Array.from(stakeholders).map(Number);

            decision.stakeholders = _.uniq(stakeholderIds, false);

        }

    }

    var result = JSON.stringify(steps);

    console.log(result);
    console.log(JSON.stringify(steps,null,'\t'));

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

var root = am5.Root.new("sankeyChartDiv");

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

series.nodes.data.setAll([
    { id: 1, name: "ETAPA 1", fill: am5.color(0x1a2035) },
    { id: 2, name: "ETAPA 2", fill: am5.color(0x1a2035) },
    { id: 3, name: "ETAPA 3", fill: am5.color(0x1a2035) },
    { id: 4, name: "DECISÃO 1", fill: am5.color(0x3BB143) },
    { id: 5, name: "DECISÃO 2", fill: am5.color(0xFF9800) },
    { id: 6, name: "DECISÃO 3", fill: am5.color(0x1a2035) },
    { id: 7, name: "DECISÃO 4", fill: am5.color(0x6693F5) },
    { id: 8, name: "DECISÃO 5", fill: am5.color(0x1a2035) },
    { id: 9, name: "DECISÃO 6", fill: am5.color(0x1a2035) },
    { id: 10, name: "DECISÃO 7", fill: am5.color(0x1a2035) },
    { id: 11, name: "DECISÃO 8", fill: am5.color(0x1a2035) },
    { id: 12, name: "DECISÃO 9", fill: am5.color(0x1a2035) },
    { id: 13, name: "DECISÃO 10", fill: am5.color(0x1a2035) },
    { id: 14, name: "DECISÃO 11", fill: am5.color(0x1a2035) },
    { id: 15, name: "DECISÃO 12", fill: am5.color(0x1a2035) },
    { id: 16, name: "DECISÃO 13", fill: am5.color(0x1a2035) },
    { id: 17, name: "DECISÃO 14", fill: am5.color(0x1a2035) },
    { id: 18, name: "DECISÃO 15", fill: am5.color(0x1a2035) },
    { id: 19, name: "STAKEHOLDER 1", fill: am5.color(0x1a2035) },
    { id: 20, name: "STAKEHOLDER 2", fill: am5.color(0x1a2035) },
    { id: 21, name: "STAKEHOLDER 3", fill: am5.color(0x1a2035) },
    { id: 22, name: "STAKEHOLDER 4", fill: am5.color(0x1a2035) },
    { id: 23, name: "STAKEHOLDER 5", fill: am5.color(0x1a2035) },
])

series.data.setAll([
    { from: 1, to: 4, value: 3 }, // PERGUNTA 1 (ID 4) TEM 3 STAKEHOLDERS
    { from: 1, to: 5, value: 3 },
    { from: 1, to: 6, value: 3 },
    { from: 1, to: 7, value: 2 },
    { from: 2, to: 8, value: 3 },
    { from: 2, to: 9, value: 2 },
    { from: 2, to: 10, value: 2 },
    { from: 2, to: 11, value: 2 },
    { from: 3, to: 12, value: 1 },
    { from: 3, to: 13, value: 2 },
    { from: 3, to: 14, value: 3 },
    { from: 3, to: 15, value: 2 },
    { from: 3, to: 16, value: 5 },
    { from: 3, to: 17, value: 2 },
    { from: 3, to: 18, value: 1 },
    { from: 4, to: 19, value: 1 },
    { from: 4, to: 20, value: 1 },
    { from: 4, to: 21, value: 1 },
    { from: 5, to: 19, value: 1 },
    { from: 5, to: 20, value: 1 },
    { from: 5, to: 21, value: 1 },
    { from: 6, to: 19, value: 1 },
    { from: 6, to: 20, value: 1 },
    { from: 6, to: 21, value: 1 },
    { from: 7, to: 22, value: 1 },
    { from: 7, to: 23, value: 1 },
    { from: 8, to: 19, value: 1 },
    { from: 8, to: 20, value: 1 },
    { from: 8, to: 21, value: 1 },
    { from: 9, to: 22, value: 1 },
    { from: 9, to: 23, value: 1 },
    { from: 10, to: 20, value: 1 },
    { from: 10, to: 21, value: 1 },
    { from: 11, to: 19, value: 1 },
    { from: 11, to: 20, value: 1 },
    { from: 12, to: 21, value: 1 },
    { from: 13, to: 22, value: 1 },
    { from: 13, to: 23, value: 1 },
    { from: 14, to: 19, value: 1 },
    { from: 14, to: 20, value: 1 },
    { from: 14, to: 21, value: 1 },
    { from: 15, to: 22, value: 1 },
    { from: 15, to: 23, value: 1 },
    { from: 16, to: 19, value: 1 },
    { from: 16, to: 20, value: 1 },
    { from: 16, to: 21, value: 1 },
    { from: 16, to: 22, value: 1 },
    { from: 16, to: 23, value: 1 },
    { from: 17, to: 21, value: 1 },
    { from: 17, to: 22, value: 1 },
    { from: 18, to: 23, value: 1 },
]);

series.appear(2000, 500);