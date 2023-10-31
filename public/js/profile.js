function importDefaultDataProfile() {

    $.LoadingOverlay("show");

    $.ajax({

        method: "GET",
        url: "/users/get/loggedUserData",

    }).fail(function(jqXHR, textStatus, errorThrown) {

        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');

    }).done(function (user) {

        if(user) {

            var userName = user.userName;

            $("#userAvatar").attr("src", `/avatars/${user.userId}.jpg`);

            $("#labelUserName").text(userName);

            $("#inputTextName").val(userName);
            $("#inputTextLogin").val(user.login);
            $('#selectGender').val(user.gender);

            var birthdayDate = moment(user.birthdayDate).format("DD/MM/YYYY");

            $('#inputBirthdayDate').val(birthdayDate !== "Invalid date" ? birthdayDate : "");

        }

        checkAvatarImage();

        $.LoadingOverlay("hide");

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

        }).then((result) => {

            if (result.isConfirmed) {
                window.location.href = '/users/profile';
            }

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

function checkAvatarImage() {
    $('#avatarContainer').imagesLoaded().fail( function() {
        $("#userAvatar").attr("src", "/img/0.jpg");
    });
}

$('#inputBirthdayDate').Zebra_DatePicker();

importDefaultDataProfile();