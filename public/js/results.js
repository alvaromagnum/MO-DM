var evaluationData;

function importDefaultData() {

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

            getFullProjectData(jsonConfig, true).then((result)=>{
                generateRankings(result);
            });

        }

        $.LoadingOverlay("hide");

    });

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

}

async function getImpactsFrom(id, option) {

    var queryImpactResults = `[decisions.options.Evaluations[EvaluationOptionId="${id}"]]`;
    var impactResultsIncomplete = await jsonata(queryImpactResults).evaluate(evaluationData);

    $.LoadingOverlay("show");

    $.ajax({
        method: "POST",
        url: "/project/getImpacts",
        data: { impactResultsIncomplete: JSON.stringify(impactResultsIncomplete) }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (impactResultsComplete) {
        $.LoadingOverlay("hide");
        generateAndShowImpactsPopup(impactResultsComplete, option);
    });

}

function generateAndShowImpactsPopup(allData, option) {

    $("#labelImpactOption").text(option);

    $("#tableImpacted").html("");

    for(data of allData) {

        var classE = "bg-gradient-success";

        if(data.e < 70) classE = "bg-gradient-warning";
        if(data.e < 40) classE = "bg-gradient-danger";

        var classV = "bg-gradient-success";

        if(data.v < 70) classV = "bg-gradient-warning";
        if(data.v < 40) classV = "bg-gradient-danger";

        var classC = "bg-gradient-danger";

        if(data.c < 70) classC = "bg-gradient-warning";
        if(data.c < 40) classC = "bg-gradient-success";

        var classEVC = "bg-gradient-success";

        if(data.evc < 70) classEVC = "bg-gradient-warning";
        if(data.evc < 40) classEVC = "bg-gradient-danger";

        var row = $("<tr></tr>").html(`
          <td>
            <div class="d-flex px-2 py-1">
              <div>
                <a href="javascript:;" class="avatar avatar-xs rounded-circle" data-toggle="tooltip" title="${data.user}">
                  <img src="/img/student-avatar.jpg" alt="user5">
                </a>
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">&nbsp;${data.user}</h6>
              </div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold">${data.e}%</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classE}" role="progressbar" style="width: ${data.e}%!important" aria-valuenow="${data.e}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold">${data.v}%</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classV}" role="progressbar" style="width: ${data.v}%!important" aria-valuenow="${data.v}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold">${data.c}%</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classC}" role="progressbar" style="width: ${data.c}%!important" aria-valuenow="${data.c}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold">${data.evc}%</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classEVC}" role="progressbar" style="width: ${data.evc}%!important" aria-valuenow="${data.evc}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
        `);

        $("#tableImpacted").append(row);

        activateTooltips();

    }

    $('#resultsPerUserModal').modalJ({
        fadeDuration: 100
    });

}

async function generateRankings(data) {

    evaluationData = data;

    for(var step of data) {

        var decisions = step.decisions;

        for(var decision of decisions) {

            var idDecision = decision.id;

            var queryWeightRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>weight).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var weightRankingItems = await jsonata(queryWeightRanking).evaluate(data);

            var queryEvcRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>meanEvc).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var evcRankingItems = await jsonata(queryEvcRanking).evaluate(data);

            var queryAgreementRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>agreement).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var agreementRankingItems = await jsonata(queryAgreementRanking).evaluate(data);

            var queryCurrentDecisionId = `$filter(decisions.options.Decision[%.%.id=${idDecision}], function($v, $i, $a) {$v != null}).EvaluationOptionId`;
            var currentDecisionId = await jsonata(queryCurrentDecisionId).evaluate(evaluationData);

            var currentDecicionOnWeightRanking = _.find(weightRankingItems, (o)=>o.id === currentDecisionId);
            var currentDecicionOnEvcRanking = _.find(evcRankingItems, (o)=>o.id === currentDecisionId);

            var oldWeightRankingIndex = _.indexOf(weightRankingItems, currentDecicionOnWeightRanking);
            var oldEvcRankingIndex = _.indexOf(evcRankingItems, currentDecicionOnEvcRanking);

            _.move(weightRankingItems, oldWeightRankingIndex, 0);
            _.move(evcRankingItems, oldEvcRankingIndex, 0);

            var dashboard = $("<div></div>").html(`
            
                <div class="row">
                  <div class="col-xl-12 col-sm-6 mb-xl-0 mb-4">
                    <div class="card">
                      <div class="card-header p-3 pt-2">
                        <div class="icon icon-lg icon-shape bg-gradient-dark shadow-dark text-center border-radius-xl mt-n4 position-absolute">
                          <i class="material-icons opacity-10">workspace_premium</i>
                        </div>
                        <div class="padding-left-80 pt-1 text-2xl text-uppercase">
                          ${decision.question}&nbsp;<b>[<span id="span${decision.id}">---</span>]</b><br/>
                        </div>
                        <div class="padding-left-80 pt-1 text-2xl text-uppercase text-gray">
                          DECISÃO ATUAL:&nbsp;<b>[<span id="span2${decision.id}">---</span>]</b><br/>
                        </div>
                      </div>
                      <div class="card-body">
                        <hr class="dark horizontal my-0">
                        <div class="col-lg-12 col-md-6 mb-md-0 mb-4"></div>
                        <div class="div-results-1">
                          <div class="container-fluid div-results-2">
                            <div class="container container-results">
                              <div class="row row-results-header">
                                <div class="col-sm text-xl-center">
                                  <b>MAIS DESEJADOS</b>
                                </div>
                                <div class="col-sm text-xl-center">
                                  <b>MAIS MOTIVAÇÃO/ENGAJAMENTO</b>
                                </div>
                                <div class="col-sm text-xl-center">
                                  <b>CONCORDÂNCIA</b>
                                </div>
                              </div>
                              <div class="row row-results">
                                <div class="col-sm">
                                  <ol id="weightRanking${decision.id}" idDecision="${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                                <div class="col-sm">
                                  <ol id="evcRanking${decision.id}" idDecision="${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                                <div class="col-sm">
                                  <ol id="agreementRanking${decision.id}" idDecision="${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <br/>
                        <div class="text-center">
                          <button id="btAcceptConvergence${decision.id}" onclick="acceptConvergence(${decision.id})" class="btn btn-outline-white" data-toggle="tooltip" title="Clique para aceitar a convergência"><i class="material-icons icon-button">adjust</i></button>
                          <button id="btDecide${decision.id}" onclick="showDecisionModal(${decision.id})" class="btn btn-outline-white" data-toggle="tooltip" title="Clique para escolher"><i class="material-icons icon-button">ads_click</i></button>
                        </div>
                        <br/>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Em caso de empate no topo dos rankings, é possível segurar e arrastar as opções para reordená-las e alcançar a convergência. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Uma concordância a partir de 65% é considerada boa. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Quando a primeira opção dos dois rankings forem iguais e a condordância do item do topo for maior ou igual a 65%, haverá convergência. Caso contrário, existe divergência. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Em caso de divergências, pode-se evetuar uma nova rodada de avaliações pelos usuários, ou pode-se fazer uma escolha divergente. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> A ausência de opções no ranking possui duas justificativas: (1) ela ainda não foi avaliada por todos os stakeholder, ou (2) existe alguma avaliação inválida/incompleta (com zero estrela). </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            
            `);

            $("#divResults").append(dashboard);
            $("#divResults").append("<br/><br/>");

            var draggable = false;

            var firstWeight = weightRankingItems[0] ? weightRankingItems[0].weight : undefined;

            for(var weightRankingItem of weightRankingItems) {
                draggable = firstWeight === weightRankingItem.weight;
                $("#weightRanking" + decision.id).append(generateRankingItem(`weight_${weightRankingItem.id}`, weightRankingItem.option, weightRankingItem.weight, draggable));
            }

            var firstEvc = evcRankingItems[0] ? evcRankingItems[0].meanEVC : undefined;

            for(var evcRankingItem of evcRankingItems) {
                draggable = firstEvc === evcRankingItem.meanEVC;
                $("#evcRanking" + decision.id).append(generateRankingItem(`evc_${evcRankingItem.id}`, evcRankingItem.option, evcRankingItem.meanEVC, draggable));
            }

            for(var agreementRankingItem of agreementRankingItems) {
                $("#agreementRanking" + decision.id).append(generateRankingItem(`agreement_${agreementRankingItem.id}`, agreementRankingItem.option, agreementRankingItem.agreement, false));
            }

            Sortable.create(document.getElementById("weightRanking" + decision.id), {animation: 350, filter: '.filtered', preventOnFilter: true, draggable: ".draggable",});
            Sortable.create(document.getElementById("evcRanking" + decision.id), {animation: 350, filter: '.filtered', preventOnFilter: true, draggable: ".draggable",});

            checkConvergence(decision.id);
            processCurrentDecision(decision.id);

            var popup = $("<div></div>").html(`
                <div class="card modal modal-decision" id="decisionModal${decision.id}">
                    <br/>
                    <br/>
                    <div class="container-fluid text-center">
                      <label for="selectChosenOption${decision.id}">OPÇÃO ESCOLHIDA:</label>
                      <select id="selectChosenOption${decision.id}" class="select-decision">
                      </select>
                      <br/>
                      <br/>
                      <button id="btMakeChoice${decision.id}" onclick="makeDecisionFor(${decision.id})" type="button" class="btn bg-gradient-light w-100 my-4 mb-2">DECIDIR</button>
                    </div>
                  </div>
            `);

            $("#divPopups").append(popup);

            for(var item of evcRankingItems) {
                $('#selectChosenOption'+decision.id).append($('<option/>').val(item.id).text(item.option));
            }

            activateTooltips();

        }

    }

    $('li.li-ranking').click(function(event){

        var id = $(event.currentTarget).attr("uuid");
        var option = $(event.currentTarget).attr("option");

        getImpactsFrom(id, option);

    });

    document.addEventListener("update", (e) => {
        checkConvergence(Number($("#"+e.from.id).attr("idDecision")));
    });

}

function acceptConvergence(idDecision) {

    var idOption = checkConvergence(idDecision);

    if(!idOption) {

        Swal.fire({

            title: 'Atenção!',
            html: `Só é possível fazer a aceitação em caso de CONVERGÊNCIA!`,
            icon: 'info',
            showCancelButton: false,
            cancelButtonText: "NÃO",
            confirmButtonText: 'OK'

        });

        return;

    }

    $('#selectChosenOption'+idDecision).val(idOption);

    makeDecisionFor(idDecision);

}

async function processCurrentDecision(idDecision) {

    var queryCurrentDecision = `$filter(decisions.options.Decision[%.%.id=${idDecision}], function($v, $i, $a) {$v != null}).option`;
    var currentDecision = await jsonata(queryCurrentDecision).evaluate(evaluationData);

    $("#span2"+idDecision).text(currentDecision);

}

function checkConvergence(idDecision) {

    var optionRanking1 = $("#weightRanking"+idDecision+" li:first-child");
    var optionRanking2 = $("#evcRanking"+idDecision+" li:first-child");

    var uuid1 = optionRanking1.attr("uuid");
    var uuid2 = optionRanking2.attr("uuid");

    var percentual = Number($("#agreementRanking"+idDecision+" li[uuid='"+uuid1+"']").attr("percentual"));

    var option = optionRanking1.attr("option");

    var labelConvergence = $("#span"+idDecision);

    labelConvergence.removeClass();

    var result = (uuid1 === uuid2) && percentual >= 65;

    if(result) {
        labelConvergence.addClass("text-success");
        labelConvergence.text(`CONVERGENTE - ${option}`);
    }
    else {
        labelConvergence.addClass("text-danger");
        labelConvergence.text("DIVERGENTE");
    }

    return result ? uuid1 : undefined;

}

function makeDecisionFor(decisionId) {

    var optionId = $('#selectChosenOption'+decisionId).val();
    var option = $('#selectChosenOption'+decisionId+" option:selected").text();

    Swal.fire({

        title: 'Atenção!',
        html: `Tem certeza que deseja decidir por esta opção?<br/><b class='text-2xl'>[${option}]</b>`,
        icon: 'info',
        showCancelButton: true,
        cancelButtonText: "NÃO",
        confirmButtonText: 'SIM'

    }).then((result) => {

        if (result.isConfirmed) {

            $.LoadingOverlay("show");

            $.ajax({

                method: "POST",
                url: "/project/makeDecision",
                data: { idDecision: decisionId, idOption: optionId }

            }).fail(function(jqXHR, textStatus, errorThrown) {

                $.LoadingOverlay("hide");
                Swal.fire('Erro!', jqXHR.responseText, 'error');

            }).done(function (msg) {

                $("#span2"+decisionId).text(option);

                $.modalJ.close();
                $.LoadingOverlay("hide");
                $.notify(msg, "success");

            });

        }

    });

}

function showDecisionModal(id) {

    $('#decisionModal'+id).modalJ({
        fadeDuration: 100
    });

}

function generateRankingItem(id, label, value, draggable) {

    var uuid = id;

    uuid = uuid.replace("evc_", "");
    uuid = uuid.replace("agreement_", "");
    uuid = uuid.replace("weight_", "");

    var itemClass = draggable ? "draggable" : "filtered";

    var percentual = (value * 100).toFixed(2);

    return `
        <li id="li_${id}" uuid="${uuid}" option="${label}" percentual="${percentual}" class="li-ranking cursor-pointer ${itemClass}" style="--i: ${value}">
          <div class="h3-ranking">${label} &nbsp;<b>${percentual}%</b></div>
        </li>
    `;

}

function activateTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

importDefaultData();
activateTooltips();