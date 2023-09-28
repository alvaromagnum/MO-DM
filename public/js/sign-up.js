$('#signUpButton').click(function () {

    var loginInput = $('#inputTextLogin').val();

    var passwordInput1 = $('#inputTextPassword1').val();
    var passwordInput2 = $('#inputTextPassword2').val();

    $('#inputTextLogin').val('');
    $('#inputTextPassword1').val('');
    $('#inputTextPassword2').val('');

    $.ajax({

        method: "POST",
        url: "/register/user",
        data: { login: loginInput, password1: passwordInput1, password2: passwordInput2 }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

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

    });

});

$("#formSignup").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#signUpButton').click();
        return false;
    }
});