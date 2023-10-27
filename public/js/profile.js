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

    var loginInput = $('#inputTextLogin').val();
    var nameInput = $('#inputTextName').val();
    var genderInput = $('#selectGender').val();
    var courseInput = Number($('#selectCourse').val());
    var birthdayDateInput = moment($('#inputBirthdayDate').val(), "DD/MM/YYYY").toDate();

    var passwordInput1 = $('#inputTextPassword1').val();
    var passwordInput2 = $('#inputTextPassword2').val();

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/register/updateUser",
        data: { name: nameInput, login: loginInput, password1: passwordInput1, password2: passwordInput2, idCourse: courseInput, gender: genderInput, birthdayDate: birthdayDateInput }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');
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