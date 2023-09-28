$('#loginButton').click(function () {

    var login = $('#inputLogin').val();
    var password = $('#inputPassword').val();
    var key = $('#inputKey').val();

    $('#inputLogin').val('');
    $('#inputPassword').val('');
    $('#inputKey').val('');

    $.ajax({

        method: "POST",
        url: "/login",
        data: { login: login, password: password, key: key }

    }).done(function (msg) {
        window.location.href = '/dashboard';
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    });

});

$("#formLogin").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#loginButton').click();
        return false;
    }
});