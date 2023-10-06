$('#createProjectButton').click(function () {

    var projectName = $('#inputProjectName').val();
    var key = crypto.randomUUID();

    $('#inputProjectName').val('');

    $.ajax({

        method: "POST",
        url: "/register/project",
        data: { projectName: projectName, key: key }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (msg) {

        Swal.fire({

            title: 'Sucesso!',
            html: msg,
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

$("#formProject").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#createProjectButton').click();
        return false;
    }
});