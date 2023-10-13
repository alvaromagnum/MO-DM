darkMode(true);

function activateTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

function activateEditables() {
    $('.input').jinplace({});
}

var projectId;
var userId;

var starRatingControl;
function activateStarRating() {
    starRatingControl = new StarRating('.star-rating',{
        tooltip: false,
        clearable: true,
    });
}

async function processDecisions(jsonConfig) {

    var configData = await getConfigData(jsonConfig);

    var queryDecisions = '[*.[${"stepId": id, "decisions": decisions[1 in stakeholders.idUser].[${"stepId": %.id, "decisionId": id, "question": question}].*}][$count(decisions)>0]]';
    var allData = await jsonata(queryDecisions).evaluate(configData);

    for(var data of allData) {

        for(var decision of data.decisions) {

            var card = $("<div></div>").html(`
                    <div class="card">
                      <div class="card-body px-0 pb-2">
                        <div class="table-responsive">
                          <table class="table align-items-center mb-0">
                            <thead>
                            <tr>
                              <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7">Decisão</th>
                              <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 ps-2">Expectativa</th>
                              <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 ps-2">Valor</th>
                              <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 ps-2">Custo</th>
                              <th class="text-uppercase text-secondary text-xx font-weight-bolder opacity-7 ps-2">Opções</th>
                            </tr>
                            </thead>
                            <tbody id="tableQuestions_${decision.decisionId}">
                                <tr>
                                    <td>
                                        <div class="d-flex px-2 py-1">
                                          <div>
                                            <i class="material-icons opacity-10">not_listed_location</i>&nbsp;
                                          </div>
                                          <div class="d-flex flex-column justify-content-center">
                                            <h6 class="mb-0 text-sm">${decision.question.toUpperCase()}</h6>
                                          </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="mt-2">
                                          ---
                                    </td>
                                    <td>
                                        <div class="mt-2">
                                          ---
                                        </div>
                                    </td>
                                    <td>
                                        <div class="mt-2">
                                          ---
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <button onclick="addNewDecisionOption(${"tableQuestions_"+decision.decisionId}, ${decision.decisionId})" class="btn btn-outline-white align-bottom margin-top-10" data-toggle="tooltip" title="Adicionar Opção"><i class="material-icons icon-button">add</i></button>
                                    </td>
                                </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <br/><br/>
                    <hr class="horizontal light mt-0 mb-2">
                    <br/><br/>
                `);

            $("#decisionCards").append(card);

        }

    }

}

function importDefaultData() {

    $.ajax({
        method: "GET",
        url: "/users/get/loggedUserData",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        if(dataToImport) {
            var userName = dataToImport.userName;
            userId = dataToImport.userId;
            $("#labelUserName").text(userName);
        }
    });

    $.ajax({

        method: "GET",
        url: "/project/loadConfig",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (dataToImport) {

        if(dataToImport) {

            projectId = dataToImport.projectId;

            var projectName = dataToImport.projectName;
            var jsonConfig = dataToImport.jsonConfig;

            $("#labelProjectName").text(projectName);

            if(!jsonConfig) {

                $("#labelInfo").text("SEM DECISÕES CADASTRADAS!");

                Swal.fire({

                    title: 'Atenção!',
                    text: "Não existem decisões cadastradas para você.",
                    icon: 'info',
                    showCancelButton: false,
                    cancelButtonText: "CANCELAR",
                    confirmButtonText: 'OK'

                });

                return;

            }

            processDecisions(jsonConfig).then(()=>{activateTooltips();});

        }

    });

}

function removeDecisionOption(row) {


    Swal.fire({

        title: 'Atenção!',
        text: "Tem certeza de que deseja remover a opção de decisão?",
        icon: 'info',
        showCancelButton: true,
        cancelButtonText: "CANCELAR",
        confirmButtonText: 'SIM'

    }).then((result) => {

        if (result.isConfirmed) {
            row.remove();
            $.notify("Operação realizada com sucesso!", "success");
        }

    });

}

function addNewDecisionOption(table, decisionId) {

    var elementId = crypto.randomUUID();

    var row = $("<tr></tr>").html(`
        <td>
            <div class="d-flex px-2 py-1">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <div>
                <i class="material-icons opacity-10">psychology_alt</i>&nbsp;
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm input" id="${elementId}">Clique aqui para mudar o título da opção de decisão</h6>
              </div>
            </div>
        </td>
        <td>
            <div class="mt-2">
              <select id="selectExpectancy_${decisionId}_${elementId}" decisionId="${decisionId}" uuid="${elementId}" class="star-rating">
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
            <div class="mt-2">
              <select id="selectValue_${decisionId}_${elementId}" decisionId="${decisionId}" uuid="${elementId}" class="star-rating">
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
            <div class="mt-2">
              <select id="selectCost_${decisionId}_${elementId}" decisionId="${decisionId}" uuid="${elementId}" class="star-rating">
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

    $("#"+table.id).append(row);

    activateStarRating();
    activateTooltips();
    activateEditables();

}

$("#btSave").click(function() {

    var evaluations = [];

    $( "select[id^='selectExpectancy_']" ).each(function(index, el){

        var id = $(el).attr("uuid");
        var decisionId = $(el).attr("decisionId");
        var option = $("#"+id).text();
        var e = $(el).val();
        var v = $( "#selectValue_" + decisionId + "_" + id).val();
        var c = $( "#selectCost_" + decisionId + "_" + id).val();

        e = e ? e : 0;
        v = v ? v : 0;
        c = c ? c : 0;

        evaluations.push({projectId: projectId, decisionId: decisionId, userId: userId, option: option, optionId: id, e: e, v: v, c: c});

    });

    console.log(evaluations);

    $.notify("Operação realizada com sucesso!", "success");

});

importDefaultData();