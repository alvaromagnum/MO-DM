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

                var row = $("<tr></tr>").html(`
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
                          <select id="selectExpectancy${decision.decisionId}" class="star-rating">
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
                          <select id="selectValue${decision.decisionId}" class="star-rating">
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
                          <select id="selectCost${decision.decisionId}" class="star-rating">
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
                `);

                $("#tableQuestions").append(row);

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