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

            //configEditor.import(JSON.parse(jsonConfig));

            //processProjectConfig();

        }

    });

}

var starRatingControl = new StarRating('.star-rating',{
    tooltip: false,
    clearable: true,
});

importDefaultData();