darkMode(true);

$('#signUpButton').click(function () {

    var loginInput = $('#inputTextLogin').val();
    var nameInput = $('#inputTextName').val();
    var courseInput = Number($('#selectCourse').val());

    var passwordInput1 = $('#inputTextPassword1').val();
    var passwordInput2 = $('#inputTextPassword2').val();

    $('#selectCourse').val(0);

    checkSelectedCourse();

    $.LoadingOverlay("show");

    $.ajax({

        method: "POST",
        url: "/register/user",
        data: { name: nameInput, login: loginInput, password1: passwordInput1, password2: passwordInput2, idCourse: courseInput }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');
        $.LoadingOverlay("hide");

    }).done(function (msg) {

        Swal.fire({

            title: 'Sucesso!',
            text: msg,
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK! Fazer Login!'

        }).then((result) => {

            if (result.isConfirmed) {
                window.location.href = '/';
            }

        });

        $.LoadingOverlay("hide");

    });

});

$("#formSignup").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#signUpButton').click();
        return false;
    }
});

function getCourses() {

    $.ajax({
        method: "GET",
        url: "/users/get/courses",
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (courses) {
        for(var courses of courses) {
            addCourse(courses.name, courses.id);
        }
    });

}

function addCourse(optionText, optionValue) {
    $('#selectCourse').append(`<option value="${optionValue}">${optionText} </option>`);
}

function checkSelectedCourse() {

    var courseId = Number($('#selectCourse').val());

    switch (courseId) {

        case 0:
            $('#selectCourse').removeClass("select-course-selected");
            break;

        default:
            $('#selectCourse').addClass("select-course-selected");
            break;

    }

}

getCourses();