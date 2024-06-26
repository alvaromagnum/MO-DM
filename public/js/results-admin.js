function importDefaultDataResults() {

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/users/get/loggedUserData",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (user) {

        myId = user.userId;

        $("#labelUserName").text(user.userName);

        $.ajax({

            method: "GET",
            url: "/project/loadConfig",

        }).fail(function (jqXHR, textStatus, errorThrown) {

            $.LoadingOverlay("hide");
            Swal.fire('Erro!', jqXHR.responseText, 'error');

        }).done(function (dataToImport) {

            if (dataToImport) {

                var projectName = dataToImport.projectName;

                jsonConfig = dataToImport.jsonConfig;

                $("#labelProjectName").text(projectName);

                if (!jsonConfig) {
                    $.LoadingOverlay("hide");
                    return;
                }

                getFullProjectData(jsonConfig, true, 0).then(async (result) => {
                    await generateRankings(result);
                    showAllDecisions();
                });

            }

            $.LoadingOverlay("hide");

        });

    });

}

function generateRankingItem(id, label, value, draggable) {

    var uuid = id;

    var isAgreement = uuid.toUpperCase().includes("AGREEMENT_");

    uuid = uuid.replace("evc_", "");
    uuid = uuid.replace("agreement_", "");
    uuid = uuid.replace("weight_", "");

    var itemClass = draggable ? "draggable" : "filtered";

    var percentual = Number((value * 100).toFixed(0));

    var colorClass = "li-ranking-default";

    if (!isAgreement) {

        if (percentual >= 70) {
            colorClass = "li-ranking-green";
        } else if (percentual >= 40) {
            colorClass = "li-ranking-yellow";
        } else {
            colorClass = "li-ranking-red";
        }

    } else {

        if (percentual >= 65) {
            colorClass = "li-ranking-green";
        } else {
            colorClass = "li-ranking-red";
        }

    }

    var sufix = isAgreement ? "%" : " PONTO(S)";

    return `
        <li id="li_${id}" uuid="${uuid}" option="${label}" percentual="${percentual}" class="li-ranking li-ranking-default ${colorClass} cursor-pointer ${itemClass}" style="--i: ${value}" data-toggle="tooltip" title="Clique para ver os impactos dessa escolha.">
          <div class="h3-ranking">${label.toUpperCase()}&nbsp;<b style="margin-left: 10px">${percentual}${sufix}</b></div>
        </li>
    `;

}

async function generateRankings(data) {

    evaluationData = data;

    for (var step of data) {

        var decisions = step.decisions;

        for (var decision of decisions) {

            var idDecision = decision.id;

            // var queryWeightRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>weight, option).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            // var weightRankingItems = await jsonata(queryWeightRanking).evaluate(data);

            var queryEvcRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>meanEvc, option).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var evcRankingItems = await jsonata(queryEvcRanking).evaluate(data);

            var queryAgreementRanking = `[decisions.options[idDecision=${idDecision} and isComplete=true]^(>agreement, option).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var agreementRankingItems = await jsonata(queryAgreementRanking).evaluate(data);

            var queryCurrentDecisionId = `$filter(decisions.options.Decision[%.%.id=${idDecision}], function($v, $i, $a) {$v != null}).EvaluationOptionId`;
            var currentDecisionId = await jsonata(queryCurrentDecisionId).evaluate(evaluationData);

            // var currentDecicionOnWeightRanking = _.find(weightRankingItems, (o)=>o.id === currentDecisionId);
            var currentDecicionOnEvcRanking = _.find(evcRankingItems, (o) => o.id === currentDecisionId);

            // var oldWeightRankingIndex = _.indexOf(weightRankingItems, currentDecicionOnWeightRanking);
            var oldEvcRankingIndex = _.indexOf(evcRankingItems, currentDecicionOnEvcRanking);

            // if(oldWeightRankingIndex !== -1) _.move(weightRankingItems, oldWeightRankingIndex, 0);
            if (oldEvcRankingIndex !== -1) _.move(evcRankingItems, oldEvcRankingIndex, 0);

            var isMine = _.find(decision.stakeholders, (o) => o.idUser === myId) !== undefined;

            var dashboard = $(`<div class='decision-row ${isMine ? "is-mine" : ""}'></div>`).html(`
            
                <div class="row">
                  <div class="col-xl-12 col-sm-6 mb-xl-0 mb-4">
                    <div class="card">
                      <div class="card-header p-3 pt-2">
                        <div class="icon icon-lg icon-shape bg-gradient-dark shadow-dark text-center border-radius-xl mt-n4 position-absolute">
                          <i class="material-icons opacity-10">workspace_premium</i>
                        </div>
                        <div class="padding-left-80 pt-1 text-2xl text-uppercase">
                          ${decision.question} <span class="text-danger cursor-pointer" id="span3${decision.id}" onclick="window.location.href='/project/decisions?pendencies=true'"
                                       data-toggle="tooltip" title="Clique para sanar as suas pendências, caso existam!"></span><br/>
                        </div>
                        <div class="padding-left-80 pt-1 text-2xl text-uppercase text-gray">
                          ESCOLHA ATUAL:&nbsp;<b>[<span id="span2${decision.id}">---</span>]</b><br/>
                        </div>
                      </div>
                      <div class="card-body">
                        <hr class="dark horizontal my-0">
                        <div class="col-lg-12 col-md-6 mb-md-0 mb-4"></div>
                        <div class="div-results-1">
                          <div id="divResult${decision.id}" class="container-fluid div-results-2">
                            <div class="container container-results">
                              <div class="row row-results-header">
                                <div class="col-sm text-xl-center">
                                  <b>MOTIVAÇÃO/ENGAJAMENTO</b>
                                </div>
                                <div class="col-sm text-xl-center">
                                  <b>CONCORDÂNCIA DA AVALIAÇÃO</b>
                                </div>
                              </div>
                              <div class="row row-results">
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
                          &nbsp;
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <br/><br/>
            `);

            $("#divResults").append(dashboard);

            var draggable = false;

            for (var evcRankingItem of evcRankingItems) {
                $("#evcRanking" + decision.id).append(generateRankingItem(`evc_${evcRankingItem.id}`, evcRankingItem.option, evcRankingItem.meanEVC, draggable));
            }

            for (var agreementRankingItem of agreementRankingItems) {
                $("#agreementRanking" + decision.id).append(generateRankingItem(`agreement_${agreementRankingItem.id}`, agreementRankingItem.option, agreementRankingItem.agreement, false));
            }

            var isComplete = _.every(decision.options, function(o) { return o.Evaluations.length == decision.stakeholders.length });

            if(evcRankingItems.length === 0 || !isComplete) {

                $("#span3"+decision.id).text("[COM PENDÊNCIAS]");

                $("#btDecide"+decision.id).hide();
                $("#btAcceptConvergence"+decision.id).hide();
                $("#divResult"+decision.id).hide();

            }

            Sortable.create(document.getElementById("evcRanking" + decision.id), {
                animation: 350,
                filter: '.filtered',
                preventOnFilter: true,
                draggable: ".draggable",
            });

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

            for (var item of evcRankingItems) {
                $('#selectChosenOption' + decision.id).append($('<option/>').val(item.id).text(item.option));
            }

            activateTooltips();

        }

    }

    $('li.li-ranking').click(function (event) {

        var id = $(event.currentTarget).attr("uuid");
        var option = $(event.currentTarget).attr("option");

        getImpactsFrom(id, option);

    });

    document.addEventListener("update", (e) => {
        checkConvergence(Number($("#" + e.from.id).attr("idDecision")));
    });

}

importDefaultDataResults();
activateTooltips();