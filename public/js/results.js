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