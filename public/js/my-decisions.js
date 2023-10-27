darkMode(true);

var projectId;
var userId;
var starRatingControl;

function activateStarRating() {
    starRatingControl.rebuild();
}

function processNoDecision() {

    $("#labelInfo").text("SEM DECISÕES CADASTRADAS!");

    Swal.fire({

        title: 'Atenção!',
        text: "Não existem decisões cadastradas para você.",
        icon: 'info',
        showCancelButton: false,
        cancelButtonText: "CANCELAR",
        confirmButtonText: 'OK'

    });

}

async function processDecisions(jsonConfig) {

    var configData = await getConfigData(jsonConfig);

    var queryDecisions = '[*.[${"stepId": id, "decisions": [decisions['+userId+' in stakeholders.idUser].[${"stepId": %.id, "decisionId": id, "question": question}].*]}][$count(decisions)>0]]';
    var allData = await jsonata(queryDecisions).evaluate(configData);

    var queryStepIds = '[stepId]';
    var stepIds = await jsonata(queryStepIds).evaluate(allData);

    stepIds = _.uniq(stepIds);

    var queryDecisionIds = '[decisions.decisionId]';
    var decisionIds = await jsonata(queryDecisionIds).evaluate(allData);

    decisionIds = _.uniq(decisionIds);

    if(decisionIds.length == 0 ) {
        processNoDecision();
        return;
    }

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/project/getEvaluations",
        data: {stepIds: stepIds, decisionIds: decisionIds}

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(async function (evaluations) {

        if(evaluations) {

            for(var step of allData) {

                for(var decision of step.decisions) {

                    var card = $("<div></div>").html(`
                        <div class="card card-white">
                          <div class="card-body px-0 pb-2">
                            <div class="table-responsive hide-scroll">
                              <table class="table align-items-center mb-0">
                                <thead>
                                <tr>
                                  <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 header-decisions"><i class="material-icons opacity-10 text-dark-yellow">not_listed_location</i>&nbsp;<span class="text-dark-yellow">${decision.question.toUpperCase()}</span></th>
                                  <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7">Expectativa<sup><i data-toggle="tooltip" title="O quanto você acredita que essa opção é exequível" class="material-icons text-sm my-auto me-1">info</i></sup></th>
                                  <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7">Valor<sup><i data-toggle="tooltip" title="O quanto você deseja essa opção" class="material-icons text-sm my-auto me-1">info</i></sup></th>
                                  <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7">Custo<sup><i data-toggle="tooltip" title="O quão custosa você acha que é essa opção" class="material-icons text-sm my-auto me-1">info</i></sup></th>
                                  <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 text-center"><button onclick="addNewDecisionOption('${"#tableQuestions_"+decision.decisionId}', ${decision.decisionId}, ${step.stepId}, crypto.randomUUID(), 'Clique aqui para mudar o título da opção de decisão')" class="btn btn-outline-white align-bottom margin-top-10" data-toggle="tooltip" title="Adicionar Opção"><i class="material-icons icon-button">add</i></button></th>
                                </tr>
                                </thead>
                                <tbody id="tableQuestions_${decision.decisionId}"></tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <br/><br/>
                        <hr class="horizontal light mt-0 mb-2">
                        <br/><br/>
                    `);

                    $("#decisionCards").append(card);

                    var queryEvaluatedEvaluations = `[*[idDecision=${decision.decisionId} and idStep=${step.stepId}]]`;
                    var evaluatedEvaluations = await jsonata(queryEvaluatedEvaluations).evaluate(evaluations);

                    _.each(evaluatedEvaluations, (evaluatedEvaluation)=> {

                        addNewDecisionOption("#tableQuestions_" + evaluatedEvaluation.idDecision, evaluatedEvaluation.idDecision, evaluatedEvaluation.idStep, evaluatedEvaluation.id, evaluatedEvaluation.option);

                        var sufixId = evaluatedEvaluation.idDecision + "_" + evaluatedEvaluation.id;

                        var selectExpectancy = _.find(starRatingControl.widgets, function(item){ return item.el.id === "selectExpectancy_" + sufixId });
                        var selectValue = _.find(starRatingControl.widgets, function(item){ return item.el.id === "selectValue_" + sufixId });
                        var selectCost = _.find(starRatingControl.widgets, function(item){ return item.el.id === "selectCost_" + sufixId });

                        selectExpectancy.selectValue(evaluatedEvaluation.e - 1);
                        selectValue.selectValue(evaluatedEvaluation.v - 1);
                        selectCost.selectValue(evaluatedEvaluation.c - 1);

                    });

                }

            }

        }

        $.LoadingOverlay("hide");

    });

}

function importDefaultDataMyDecisions() {

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/users/get/loggedUserData",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (dataToImport) {

        if(dataToImport) {

            var userName = dataToImport.userName;

            userId = dataToImport.userId;

            $("#labelUserName").text(userName);

            $.LoadingOverlay("show");

            $.ajax({

                method: "GET",
                url: "/project/loadConfig",

            }).fail(function(jqXHR, textStatus, errorThrown) {

                $.LoadingOverlay("hide");
                Swal.fire('Erro!', jqXHR.responseText, 'error');

            }).done(function (dataToImport) {

                if(dataToImport) {

                    projectId = dataToImport.projectId;

                    var projectName = dataToImport.projectName;
                    var jsonConfig = dataToImport.jsonConfig;

                    $("#labelProjectName").text(projectName);

                    if(!jsonConfig) {

                        processNoDecision();
                        $.LoadingOverlay("hide");

                        return;

                    }

                    processDecisions(jsonConfig).then(()=>{activateTooltips();});

                }

                $.LoadingOverlay("hide");

            });

        }

        $.LoadingOverlay("hide");

    });

}

function removeDecisionOption(row) {

    Swal.fire({

        title: 'Atenção!',
        html: "Tem certeza de que deseja remover a opção de decisão?<br/><br/><i class='text-xs'>É importante destacar que todas as avaliações já realizadas por outros usuários, para esta opção, também serão removidas.</i>",
        icon: 'info',
        showCancelButton: true,
        cancelButtonText: "CANCELAR",
        confirmButtonText: 'SIM'

    }).then((result) => {

        if (result.isConfirmed) {

            $.LoadingOverlay("show");

            $.ajax({
                method: "POST",
                url: "/project/removeEvaluationOption",
                data: { idToRemove: $(row).attr("uuid") }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                $.LoadingOverlay("hide");
                Swal.fire('Erro!', jqXHR.responseText, 'error');
            }).done(function (msg) {
                row.remove();
                $.LoadingOverlay("hide");
                $.notify(msg, "success");
            });

        }

    });

}

function addNewDecisionOption(table, decisionId, stepId, elementId, title) {

    var row = $(`<tr uuid="${elementId}"></tr>`).html(`
        <td>
            <div class="d-flex px-2 py-1">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <div>
                <i class="material-icons opacity-10">psychology_alt</i>&nbsp;
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm input" id="${elementId}">${title}</h6>
              </div>
            </div>
        </td>
        <td>
            <div class="mt-2" onmouseover="$(\`#myForm\`).trigger(\`jip:submit\`)">
              <select  id="selectExpectancy_${decisionId}_${elementId}" decisionId="${decisionId}" stepId="${stepId}" uuid="${elementId}" class="star-rating">
                <option value="0">0</option>
                <option value="6">6</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>
        </td>
        <td>
            <div class="mt-2" onmouseover="$(\`#myForm\`).trigger(\`jip:submit\`)">
              <select id="selectValue_${decisionId}_${elementId}" decisionId="${decisionId}" stepId="${stepId}" uuid="${elementId}" class="star-rating">
                <option value="0">0</option>
                <option value="6">6</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>
        </td>
        <td>
            <div class="mt-2" onmouseover="$(\`#myForm\`).trigger(\`jip:submit\`)">
              <select id="selectCost_${decisionId}_${elementId}" decisionId="${decisionId}" stepId="${stepId}" uuid="${elementId}" class="star-rating">
                <option value="0">0</option>
                <option value="6">6</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>
        </td>
        <td class="text-center">
            <button onclick="removeDecisionOption(this.parentElement.parentElement)" class="btn btn-outline-white align-bottom margin-top-10" data-toggle="tooltip" title="Remover Opção"><i class="material-icons icon-button">remove</i></button>
        </td>
    `);

    $(table).append(row);

    activateStarRating();
    activateTooltips();
    activateEditables();

}

$("#btSave").click(function() {

    $.LoadingOverlay("show");

    var evaluations = [];

    $( "select[id^='selectExpectancy_']" ).each(function(index, el){

        var id = $(el).attr("uuid");
        var decisionId = $(el).attr("decisionId");
        var stepId = $(el).attr("stepId");
        var option = $("#"+id).text();

        var e = $(el).val();
        var v = $( "#selectValue_" + decisionId + "_" + id).val();
        var c = $( "#selectCost_" + decisionId + "_" + id).val();

        e = e ? e : 0;
        v = v ? v : 0;
        c = c ? c : 0;

        evaluations.push({projectId: projectId, decisionId: decisionId, stepId: stepId, userId: userId, option: option, optionId: id, e: e, v: v, c: c});

    });

    $.ajax({
        method: "POST",
        url: "/project/saveEvaluations",
        data: { evaluations: evaluations }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (msg) {
        $.LoadingOverlay("hide");
        $.notify(msg, "success");
    });

});

starRatingControl = new StarRating('.star-rating',{
    tooltip: false,
    clearable: true,
});

importDefaultDataMyDecisions();