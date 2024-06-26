darkMode(true);

var sankeyChartRoot = null;
var pageAllUsersEvc = null;
var pageAllCoursesEvc = null;
var pageGeneralEvc = null;
var allProjectData = null;
var configCanvas = null;
var configEditor = null;
var projectZoom = null;
var projectPositionX = null;
var projectPositionY = null;
var projectId = null;
var userId = null;
var starRatingControl = null;
var evaluationData = null;
var jsonConfig = null;
var pageJsonConfig = null;
var projectCurrentJson = null;
var myId = null;

$('#loginButton').click(function () {

    $.LoadingOverlay("show");

    var login = $('#inputLogin').val();
    var password = $('#inputPassword').val();
    var key = $('#inputKey').val();

    $.ajax({

        method: "POST",
        url: "/login",
        data: { login: login, password: password, key: key }

    }).done(function (msg) {
        window.location.href = '/dashboard';
        $.LoadingOverlay("hide");
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        $.LoadingOverlay("hide");
    });

});

$("#formLogin").keypress(function(e){
    if(e.keyCode == 13) {
        e.preventDefault();
        $('#loginButton').click();
        return false;
    }
});