function importDefaultDataProfile() {

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/users/get/courses",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (courses) {

        for(var courses of courses) {
            addCourse(courses.name, courses.id);
        }

        $.LoadingOverlay("hide");

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

                $("#labelUserName").text(userName);

                $("#inputTextName").val(userName);
                $("#inputTextLogin").val(dataToImport.login);
                $('#selectCourse').val(dataToImport.courseId);
                $('#selectGender').val(dataToImport.gender);

                $('#inputBirthdayDate').val(moment(dataToImport.birthdayDate).format("DD/MM/YYYY"));

                $.LoadingOverlay("show");

                $.ajax({

                    method: "GET",
                    url: "/project/loadConfig",

                }).fail(function(jqXHR, textStatus, errorThrown) {

                    $.LoadingOverlay("hide");
                    Swal.fire('Erro!', jqXHR.responseText, 'error');

                }).done(function (dataToImport) {

                    if(dataToImport) {
                        $("#labelProjectName").text(dataToImport.projectName);
                    }

                    $.LoadingOverlay("hide");

                });

            }

            $.LoadingOverlay("hide");

        });

    });

}

$('#updateProfileButton').click(function () {

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/register/updateUser",
        data: new FormData($("#formProfile").get(0)),
        contentType : false,
        processData : false

    }).fail(function(jqXHR, textStatus, errorThrown) {

        var responseText = jqXHR.responseText;

        if(responseText.includes("Imagem no formato incorreto") || responseText.includes("File too large")) responseText = "Erro ao enviar a foto do perfil! Cheque o limite de tamanho (2MB) e o formato aceito (.JPG).";

        Swal.fire('Erro!', responseText, 'error');

        $.LoadingOverlay("hide");

    }).done(function (msg) {

        Swal.fire({

            title: 'Sucesso!',
            text: msg,
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK!'

        });

        $.LoadingOverlay("hide");

    });

});

$("#formSignup").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#updateProfileButton').click();
        return false;
    }
});

function addCourse(optionText, optionValue) {
    $('#selectCourse').append(`<option value="${optionValue}">${optionText} </option>`);
}

$('#inputBirthdayDate').Zebra_DatePicker();

importDefaultDataProfile();