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

            getConfigData(jsonConfig).then((steps)=> {

                $.LoadingOverlay("show");

                $.ajax({
                    method: "POST",
                    url: "/project/results",
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    $.LoadingOverlay("hide");
                    Swal.fire('Erro!', jqXHR.responseText, 'error');
                }).done(function (optionsWithEvaluations) {
                    $.LoadingOverlay("hide");
                    if(optionsWithEvaluations) {
                        joinDataAddScores(steps, optionsWithEvaluations).then((result)=>{
                            generateRankings(result);
                        });
                    }
                });

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

async function generateRankings(data) {

    for(var step of data) {

        var decisions = step.decisions;

        for(var decision of decisions) {

            var idDecision = decision.id;

            var queryWeightRanking = `[decisions.options[idDecision=${idDecision}]^(>weight).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var weightRankingItems = await jsonata(queryWeightRanking).evaluate(data);

            var queryEvcRanking = `[decisions.options[idDecision=${idDecision}]^(>meanEvc).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var evcRankingItems = await jsonata(queryEvcRanking).evaluate(data);

            var queryAgreementRanking = `[decisions.options[idDecision=${idDecision}]^(>agreement).$.{"id": id, "option": option, "weight": weight, "meanEVC": meanEvc, "agreement": agreement}]`;
            var agreementRankingItems = await jsonata(queryAgreementRanking).evaluate(data);

            var dashboard = $("<div></div>").html(`
            
                <div class="row">
                  <div class="col-xl-12 col-sm-6 mb-xl-0 mb-4">
                    <div class="card">
                      <div class="card-header p-3 pt-2">
                        <div class="icon icon-lg icon-shape bg-gradient-dark shadow-dark text-center border-radius-xl mt-n4 position-absolute">
                          <i class="material-icons opacity-10">workspace_premium</i>
                        </div>
                        <div class="padding-left-80 pt-1 text-yellow">
                          ${decision.question}
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
                                  <ol id="weightRanking${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                                <div class="col-sm">
                                  <ol id="evcRanking${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                                <div class="col-sm">
                                  <ol id="agreementRanking${decision.id}" class="ol-ranking" style="--length: 1" role="list"></ol>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <br/>
                        <div class="text-center">
                          <button id="btDecide${decision.id}" class="bt-decide btn btn-outline-white" data-toggle="tooltip" title="Clique para fazer a escolha da decisão"><i class="material-icons icon-button">ads_click</i></button>
                        </div>
                        <br/>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Em caso de empate nos rankings, é possível segurar e arrastar as opções para reordená-las. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Uma concordância a partir de 65% é considerada boa. </p>
                        </div>
                        <div class="d-flex">
                          <i class="material-icons text-sm my-auto me-1">info</i>
                          <p class="mb-0 text-sm"> Quando a primeira opção dos dois rankings forem iguais e a condordância for maior ou igual a 65%, será possível tomar uma decisão. </p>
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
                $("#weightRanking" + decision.id).append(generateRankingItem(weightRankingItem.id, weightRankingItem.option, weightRankingItem.weight, draggable));
            }

            var firstEvc = evcRankingItems[0] ? evcRankingItems[0].meanEVC : undefined;

            for(var evcRankingItem of evcRankingItems) {
                draggable = firstEvc === evcRankingItem.meanEVC;
                $("#evcRanking" + decision.id).append(generateRankingItem(evcRankingItem.id, evcRankingItem.option, evcRankingItem.meanEVC, draggable));
            }

            for(var agreementRankingItem of agreementRankingItems) {
                $("#agreementRanking" + decision.id).append(generateRankingItem(agreementRankingItem.id, agreementRankingItem.option, agreementRankingItem.agreement, false));
            }

            Sortable.create(document.getElementById("weightRanking" + decision.id), {animation: 350, filter: '.filtered', preventOnFilter: true, draggable: ".draggable",});
            Sortable.create(document.getElementById("evcRanking" + decision.id), {animation: 350, filter: '.filtered', preventOnFilter: true, draggable: ".draggable",});

            activateTooltips();

        }

    }

}

function generateRankingItem(id, label, value, draggable) {

    var itemClass = draggable ? "draggable" : "filtered";

    var percentual = (value * 100).toFixed(2);

    return `
        <li id="li_${id}" uuid="${id}" class="li-ranking cursor-pointer ${itemClass}" style="--i: ${value}">
          <div class="h3-ranking">${label} |&nbsp;<b>${percentual}%</b></div>
        </li>
    `;

}

async function joinDataAddScores(steps, optionsWithEvaluations) {

    for(var step of steps) {

        var decisions = step.decisions;

        for(var decision of decisions) {

            var queryOptions = `[*[idDecision=${decision.id}]]`;
            var options = await jsonata(queryOptions).evaluate(optionsWithEvaluations);

            var queryAllvs = "[*.[${\"id\": id, \"allV\": [Evaluations.v]}].*]";
            var allVs = await jsonata(queryAllvs).evaluate(options);

            var newVs = allVs.map((o)=> {
                return {id: o.id, allV: o.allV.map((x)=>(x-1)/5)}
            });

            var weights = newVs.map((o)=>{
                return {id: o.id, weight: math.mean(o.allV)};
            });

            var queryEvcMeans = "[*.[${\"id\": id, \"meanEvc\": $average(Evaluations.evc)}].*]";
            var evcMeans = await jsonata(queryEvcMeans).evaluate(options);

            var queryAllEvc = "[*.[${\"id\": id, \"allE\": [Evaluations.e], \"allV\": [Evaluations.v], \"allC\": [Evaluations.c]}].*]";
            var allEvc = await jsonata(queryAllEvc).evaluate(options);

            for(var singleEvc of allEvc) {

                var var_e = math.variance(singleEvc.allE, 'uncorrected');
                var var_v = math.variance(singleEvc.allV, 'uncorrected');
                var var_c = math.variance(singleEvc.allC, 'uncorrected');

                var mvar = math.mean(var_e, var_v, var_c);

                var denominator = 6.25;

                var agreement = 1 - (mvar/denominator);

                singleEvc.agreement = agreement;

            }

            for(var option of options) {

                option.weight = _.find(weights, (o)=>o.id === option.id).weight.toFixed(2);
                option.meanEvc = _.find(evcMeans, (o)=>o.id === option.id).meanEvc.toFixed(2);
                option.agreement = _.find(allEvc, (o)=>o.id === option.id).agreement.toFixed(2);

            }

            decision.options = options;

        }

    }

    return steps;

}

function activateTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

$(".bt-decide").click(function() {

    Swal.fire({

        title: 'Atenção!',
        html: "Tem certeza que deseja decidir por esta opção? <b class='text-2xl'>[ESCOLHA]</b>",
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
                data: { data: "" }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                $.LoadingOverlay("hide");
                Swal.fire('Erro!', jqXHR.responseText, 'error');
            }).done(function (msg) {
                $.LoadingOverlay("hide");
                $.notify(msg, "success");
            });

        }

    });

});

importDefaultData();
activateTooltips();