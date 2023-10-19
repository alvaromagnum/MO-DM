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
                        //console.log(JSON.stringify(steps, null, "\t"));
                        //console.log(JSON.stringify(optionsWithEvaluations, null, "\t"));
                        joinDataAddScores(steps, optionsWithEvaluations).then((result)=>{
                            //console.log(JSON.stringify(result, null, "\t"))
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

async function joinDataAddScores(steps, optionsWithEvaluations) {

    for(var step of steps) {

        var decisions = step.decisions;

        for(var decision of decisions) {

            console.log("ENTRANDO EM " + decision.question);

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

            console.log(weights);

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

Sortable.create(sortable1, {animation: 150, filter: '.filtered', preventOnFilter: true, draggable: ".dragable",});
Sortable.create(sortable2, {animation: 150, filter: '.filtered', preventOnFilter: true, draggable: ".dragable",});

importDefaultData();
activateTooltips();