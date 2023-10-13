darkMode(true);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.toast').toast();
});

function importDefaultData() {

    $.ajax({
        method: "GET",
        url: "/users/get/loggedUserData",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (dataToImport) {
        if(dataToImport) {
            var userName = dataToImport.userName;
            $("#labelUserName").text(userName);
        }
    });

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
                                            <h6 class="mb-0 text-sm">${decision.question}</h6>
                                          </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="mt-2">
                                          <select id="selectExpectancy_${decision.decisionId}" class="star-rating">
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
                                          <select id="selectValue_${decision.decisionId}" class="star-rating">
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
                                          <select id="selectCost_${decision.decisionId}" class="star-rating">
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
                                        <button id="btZoomOut" class="btn btn-outline-white align-bottom margin-top-10" data-toggle="tooltip" title="Adicionar Opção"><i class="material-icons icon-button">add</i></button>
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

    $.ajax({

        method: "GET",
        url: "/project/loadConfig",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (dataToImport) {

        if(dataToImport) {

            var projectName = dataToImport.projectName;
            var jsonConfig = dataToImport.jsonConfig;

            $("#labelProjectName").text(projectName);

            if(!jsonConfig) return;

            processDecisions(jsonConfig).then(()=>{

                var starRatingControl = new StarRating('.star-rating',{
                    tooltip: false,
                    clearable: true,
                });

            });

        }

    });

}

importDefaultData();