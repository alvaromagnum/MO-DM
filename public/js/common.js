var allProjectData;
var pageGeneralEvc;
var pageAllCoursesEvc = [];
var pageAllUsersEvc = [];

var evaluationData;
var jsonConfig;
var myId;

function clearAllUsersTable() {

    $("#tableAllUsers").html("");
    $("#tableAllUsers").append(`<tr class='allUsers-row text-2xl'><td colspan='2'><center>-- SEM MEMBROS --</center></td></tr>`);

}

function loadAllUsers(projectUsers) {

    clearAllUsersTable();

    projectUsers = _.sortBy(projectUsers, (o) => o.name);

    if(projectUsers.length >0) $("#tableAllUsers").html("");

    for(var projectUser of projectUsers) {

        var row = $("<tr class='pendency-row'></tr>").html(`
            <td class="align-middle text-sm width-30 avatar-container">
              <img id="userAvatar${projectUser.id}" src="/avatars/${projectUser.id}.jpg" alt="userAvatar" class="avatar avatar-sm rounded-circle-black-mini"/>
              &nbsp;${projectUser.name}
            </td>
            <td class="align-middle text-sm">
              <div class="pendencies-container">
                <a href="#" id="buttonRemoveMember" onclick="confirmRemoveUserFromProject(${projectUser.id}, '${projectUser.name}')" idToRemove="${projectUser.id}" style="cursor: pointer!important" data-toggle="tooltip" title="Clique para REMOVER ${projectUser.name.toUpperCase()} da equipe.">[REMOVER VÍNCULO]</a>
              </div>
            </td>
        `);

        $("#tableAllUsers").append(row);

    }

}

function confirmRemoveUserFromProject(userId, userName) {

    Swal.fire({

        title: 'Atenção!',
        html: `Tem certeza de que deseja REMOVER O VÍNCULO DE ${userName.toUpperCase()} com a equipe?`,
        icon: 'info',
        showCancelButton: true,
        cancelButtonText: "NÃO",
        confirmButtonText: 'SIM'

    }).then((result) => {

        if (result.isConfirmed) removeUserFromProject(userId);

    });

}

function removeUserFromProject(userId) {

    $.LoadingOverlay("show");

    $.ajax({
        method: "POST",
        url: "/project/remove/user",
        data: {userId: userId}
    }).fail(function (jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (result) {

        if(result) {

            Swal.fire({

                title: 'Sucesso!',
                html: `Membro removido da equipe com sucesso!`,
                icon: 'success',
                confirmButtonText: 'OK'

            }).then((result) => {

                window.location.href = "/dashboard";

            });

        }

        $.LoadingOverlay("hide");

    });

}

async function getImpactsFrom(id, option) {

    var queryImpactResults = `[decisions.options.Evaluations[EvaluationOptionId="${id}"]]`;
    var impactResultsIncomplete = await jsonata(queryImpactResults).evaluate(evaluationData);

    $.LoadingOverlay("show");

    $.ajax({
        method: "POST",
        url: "/project/getImpacts",
        data: {impactResultsIncomplete: JSON.stringify(impactResultsIncomplete)}
    }).fail(function (jqXHR, textStatus, errorThrown) {
        $.LoadingOverlay("hide");
        Swal.fire('Erro!', jqXHR.responseText, 'error');
    }).done(function (impactResultsComplete) {
        $.LoadingOverlay("hide");
        generateAndShowImpactsPopup(impactResultsComplete, option);
    });

}

function generateAndShowImpactsPopup(allData, option) {

    $("#labelImpactOption").text(option.toUpperCase());

    $("#tableImpacted").html("");

    var meanV = math.mean(allData.map((o) => o.v)).toFixed(1);

    var classMean = "bg-gradient-success";

    if (meanV < 70) classMean = "bg-gradient-warning";
    if (meanV < 40) classMean = "bg-gradient-danger";

    for (data of allData) {

        var classE = "bg-gradient-success";

        if (data.e < 70) classE = "bg-gradient-warning";
        if (data.e < 40) classE = "bg-gradient-danger";

        var classV = "bg-gradient-success";

        if (data.v < 70) classV = "bg-gradient-warning";
        if (data.v < 40) classV = "bg-gradient-danger";

        var classC = "bg-gradient-danger";

        if (data.c < 70) classC = "bg-gradient-warning";
        if (data.c < 40) classC = "bg-gradient-success";

        var classEVC = "bg-gradient-success";

        if (data.evc < 70) classEVC = "bg-gradient-warning";
        if (data.evc < 40) classEVC = "bg-gradient-danger";

        var row = $("<tr></tr>").html(`
          <td>
            <div class="d-flex px-2 py-1">
              <div>
                <a href="javascript:;" class="avatar avatar-xs rounded-circle" data-toggle="tooltip" title="${data.user}">
                  <img src="/img/student-avatar.jpg" alt="user5">
                </a>
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">&nbsp;${data.user}</h6>
              </div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold ${classE}-text">${data.e} PONTO(S)</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classE}" role="progressbar" style="width: ${data.e}%!important" aria-valuenow="${data.e}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold ${classV}-text">${data.v} PONTO(S)</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classV}" role="progressbar" style="width: ${data.v}%!important" aria-valuenow="${data.v}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold ${classC}-text">${data.c} PONTO(S)</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classC}" role="progressbar" style="width: ${data.c}%!important" aria-valuenow="${data.c}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td>
            <div class="progress-info">
              <div class="progress-percentage">
                <span class="text-xs font-weight-bold ${classEVC}-text">${data.evc} PONTO(S)</span>
              </div>
            </div>
            <div class="progress">
              <div class="progress-bar ${classEVC}" role="progressbar" style="width: ${data.evc}%!important" aria-valuenow="${data.evc}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
        `);

        $("#tableImpacted").append(row);

    }

    var endRow = $("<tr></tr>").html(`
      <td>
        <br/>
        <div class="progress-info">
          <div class="progress-percentage">
            <span class="text-xl ${classMean}-text">PONTUAÇÃO DE VALORIZAÇÃO: <b>${meanV}</b></span>
          </div>
        </div>
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    `);

    $("#tableImpacted").append(endRow);

    activateTooltips();

    $('#resultsPerUserModal').modalJ({
        fadeDuration: 100
    });

}

function showAllDecisions() {
    $(".decision-row").removeClass("none");
}

function checkConvergence(idDecision) {

    // var optionRanking1 = $("#weightRanking"+idDecision+" li:first-child");
    var optionRanking2 = $("#evcRanking" + idDecision + " li:first-child");

    // var uuid1 = optionRanking1.attr("uuid");
    var uuid2 = optionRanking2.attr("uuid");

    var points = Number($("#evcRanking" + idDecision + " li[uuid='" + uuid2 + "']").attr("percentual"));
    var agreement = Number($("#agreementRanking" + idDecision + " li[uuid='" + uuid2 + "']").attr("percentual"));

    //var option = optionRanking2.attr("option");

    //var labelConvergence = $("#span" + idDecision);

    //labelConvergence.removeClass();

    var convergence = points >= 60 && agreement >= 65;

    return convergence ? uuid2 : undefined;

}

async function processCurrentDecision(idDecision) {

    var queryCurrentDecision = `$filter(decisions.options.Decision[%.%.id=${idDecision}], function($v, $i, $a) {$v != null}).option`;
    var currentDecision = await jsonata(queryCurrentDecision).evaluate(evaluationData);

    $("#span2" + idDecision).text(currentDecision);

}

function showDecisionModal(id) {

    $('#decisionModal' + id).modalJ({
        fadeDuration: 100
    });

}

$(".temp-class").click(function(){
    $('#divChartsComparison').modalJ({
        fadeDuration: 100
    });
});

$("#btShowCustomChart").click(function(){

    var id1 = $('#selectChart1Content').val();
    var group1 = $('#selectChart1Content option:selected').attr("group");

    var id2 = $('#selectChart2Content').val();
    var group2 = $('#selectChart2Content option:selected').attr("group");

    var data1;
    var data2;

    switch(group1) {

        case "user":
            data1 = _.find(pageAllUsersEvc, (o)=>id1 == o.id);
            break;

        case "course":
            data1 = _.find(pageAllCoursesEvc, (o)=>id1 == o.id);
            break;

        default:
            data1 = pageGeneralEvc;
            break;

    }

    switch(group2) {

        case "user":
            data2 = _.find(pageAllUsersEvc, (o)=>id2 == o.id);
            break;

        case "course":
            data2 = _.find(pageAllCoursesEvc, (o)=>id2 == o.id);
            break;

        default:
            data2 = pageGeneralEvc;
            break;

    }

    generateRadarChart("customRadarChartDiv", [data1.e*100, data1.v*100, data1.c*100], [data2.e*100, data2.v*100, data2.c*100], [0x000000, 0x767676], data1.label, data2.label, false);
    generateGaugeChart("customGaugeChartDiv", data1.evc*100, data2.evc*100, [0x000000, 0x767676], data1.label,  data2.label, false);

});

function generateProjectSankeyChart(nodes, links) {

    am5.array.each(am5.registry.rootElements,
        function(root) {
            try{
                if (root.dom.id == "sankeyChartDiv") {
                    root.dispose();
                }
            }
            catch(err){}
        }
    );

    var sankeyChartRoot = am5.Root.new("sankeyChartDiv");

    sankeyChartRoot.setThemes([
        am5themes_Animated.new(sankeyChartRoot)
    ]);

    var series = sankeyChartRoot.container.children.push(am5flow.Sankey.new(sankeyChartRoot, {
        sourceIdField: "from",
        targetIdField: "to",
        valueField: "value",
        paddingRight: 450,
        nodeWidth: 10
    }));

    series.nodes.setAll({
        nameField: "name",
    });

    series.links.template.setAll({
        tooltipText: "[bold]{source.name}[/]\n{target.name}",
        fillOpacity: 0.2
    });

    series.nodes.labels.template.setAll({
        fill: am5.color(0xffffff)
    });

    series.nodes.nodes.template.setAll({
        draggable: false,
    });

    series.nodes.rectangles.template.setAll({
        fillOpacity: 0.5,
        stroke: am5.color(0x000000),
        strokeWidth: 1,
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        cornerRadiusBL: 4,
        cornerRadiusBR: 4,
        tooltipText: "[bold]{name}[/]\n{info}"
    });

    series.nodes.data.setAll(nodes)

    series.data.setAll(links);

    series.appear(1000, 100);

}

function snapshotsToJson(snapshots) {

    for(var snapshot of snapshots) {
        snapshot.jsonSnapshot = JSON.parse(snapshot.jsonSnapshot)
    }

    return snapshots;

}

function generateEvcCharts(editorJson) {

    getEvcRankings(editorJson).then((allData)=> {

        var countStudents = allData.allUsersEvc.length;
        var countCourses = allData.allCoursesEvc.length;

        var moreMotivatedStudent = countStudents > 0 ? allData.allUsersEvc[0] : {label: "---", id: 0, evc: 0, e: 0, v: 0, c: 0};
        var lessMotivatedStudent = countStudents > 0 ? allData.allUsersEvc[countStudents - 1] : {label: "---", id: 0, evc: 0, e: 0, v: 0, c: 0};

        var moreMotivatedCourse = countCourses > 0 ? allData.allCoursesEvc[0] : {label: "---" , evc: 0, e: 0, v: 0, c: 0};
        var lessMotivatedCourse = countCourses > 0 ? allData.allCoursesEvc[countCourses - 1] : {label: "---", id: 0, evc: 0, e: 0, v: 0, c: 0};

        var generalEvc = allData.generalEvc ? allData.generalEvc : {label: "Geral", id: 0, evc: 0, e: 0, v: 0, c: 0};

        pageAllUsersEvc = allData.allUsersEvc;
        pageAllCoursesEvc = allData.allCoursesEvc;
        pageGeneralEvc = generalEvc;

        generateBubbleChart("allStudentsBubbleMotivationDiv", pageAllUsersEvc);

        populateCustomChartsSelect(generalEvc, pageAllUsersEvc, pageAllCoursesEvc);

        $('#labelMoreMotivatedStudent').text(moreMotivatedStudent.label);
        $('#labelLessMotivatedStudent').text(lessMotivatedStudent.label);

        $('#labelMoreMotivatedCourse').text(moreMotivatedCourse.label);
        $('#labelLessMotivatedCourse').text(lessMotivatedCourse.label);

        generateRadarChart("moreMotivatedStudentDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [moreMotivatedStudent.e*100, moreMotivatedStudent.v*100, moreMotivatedStudent.c*100], [0x000000, 0x767676], generalEvc.label,  moreMotivatedStudent.label, false);
        generateRadarChart("lessMotivatedStudentDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [lessMotivatedStudent.e*100, lessMotivatedStudent.v*100, lessMotivatedStudent.c*100], [0x000000, 0x767676], generalEvc.label, lessMotivatedStudent.label, false);
        generateRadarChart("moreMotivatedCoursetDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [moreMotivatedCourse.e*100, moreMotivatedCourse.v*100, moreMotivatedCourse.c*100], [0x000000, 0x767676], generalEvc.label, moreMotivatedCourse.label, false);
        generateRadarChart("lessMotivatedCoursetDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [lessMotivatedCourse.e*100, lessMotivatedCourse.v*100, lessMotivatedCourse.c*100], [0x000000, 0x767676], generalEvc.label, lessMotivatedCourse.label, false);

        generateGaugeChart("moreMotivatedStudentDiv2", generalEvc.evc*100, moreMotivatedStudent.evc*100, [0x000000, 0x767676], generalEvc.label,  moreMotivatedStudent.label, false);
        generateGaugeChart("lessMotivatedStudentDiv2", generalEvc.evc*100, lessMotivatedStudent.evc*100, [0x000000, 0x767676], generalEvc.label, lessMotivatedStudent.label, false);
        generateGaugeChart("moreMotivatedCoursetDiv2", generalEvc.evc*100, moreMotivatedCourse.evc*100, [0x000000, 0x767676], generalEvc.label, moreMotivatedCourse.label, false);
        generateGaugeChart("lessMotivatedCoursetDiv2", generalEvc.evc*100, lessMotivatedCourse.evc*100, [0x000000, 0x767676], generalEvc.label, lessMotivatedCourse.label, false);

        generateRadarChart("customRadarChartDiv", [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [generalEvc.e*100, generalEvc.v*100, generalEvc.c*100], [0x000000, 0x767676], generalEvc.label, generalEvc.label, false);
        generateGaugeChart("customGaugeChartDiv", generalEvc.evc*100, generalEvc.evc*100, [0x000000, 0x767676], generalEvc.label,  generalEvc.label, false);

    });

}

async function generateProjectPendencies(allProjectData, clearTable) {

    var queryDecisions = `[*.decisions]`;
    var decisions = await jsonata(queryDecisions).evaluate(allProjectData);

    var queryAllStakeholders = `[$distinct(*.decisions.stakeholders)]`;
    var allStakeholders = await jsonata(queryAllStakeholders).evaluate(allProjectData);

    var dictionary = [];

    for(var stakeholder of allStakeholders) {
        dictionary.push({id: stakeholder.idUser, name: stakeholder.stakeholderName, pendencies: []});
    }

    for(var decision of decisions) {

        var id = decision.id;

        var queryOptions = `[*.decisions.options[%.id=${id}]]`;
        var options = await jsonata(queryOptions).evaluate(allProjectData);

        var queryStakeholders = `[*.decisions.stakeholders[%.id=${id}]]`;
        var stakeholders = await jsonata(queryStakeholders).evaluate(allProjectData);

        var queryEvaluations = `[*.decisions.options.Evaluations[%.%.id=${id}]]`;
        var evaluations = await jsonata(queryEvaluations).evaluate(allProjectData);

        if(options.length === 0) {

            for(var stakeholder of stakeholders) {

                var stakeholderPendencies = _.findWhere(dictionary, {id: stakeholder.idUser}).pendencies;
                stakeholderPendencies.push(`<b CLASS="text-yellow">🠞 DECISÃO "${decision.question}" [PENDENTE]</b>`);

            }

        }

        for(var option of options) {

            for(var stakeholder of stakeholders) {

                var stakeholderEvaluations = _.where(evaluations, {UserId: stakeholder.idUser, EvaluationOptionId: option.id});

                var missingEvaluation = stakeholderEvaluations.length === 0;
                var incompleteEvaluation = _.findWhere(stakeholderEvaluations, {e: 0}) !== undefined || _.findWhere(stakeholderEvaluations, {v: 0}) !== undefined || _.findWhere(stakeholderEvaluations, {c: 0}) !== undefined;

                if(missingEvaluation || incompleteEvaluation) {
                    var stakeholderPendencies = _.findWhere(dictionary, {id: stakeholder.idUser}).pendencies;
                    stakeholderPendencies.push(`<b class="text-yellow">🠞 DECISÃO "${decision.question}"</b><br/>- <u>OPÇÃO "${option.option.toUpperCase()}" PENDENTE</u><br/>`);
                }

            }

        }

    }

    var noPendenciesText = "<b>-- SEM PENDÊNCIAS --</b>";

    for(var user of dictionary) if(user.pendencies.length === 0) user.pendencies.push();

    if(clearTable) $("#tablePendencies").html("");

    var dictionaryUnique = _.uniq(dictionary, (o)=> o.id);

    for(var itemDictionary of dictionaryUnique) {

        var repeatedItems = _.filter(dictionary, function(o){ return o.id === itemDictionary.id; });
        var currentUserPendencies = [];

        for(var repeatedItem of repeatedItems) currentUserPendencies = currentUserPendencies.concat(repeatedItem.pendencies);

        if(_.every(currentUserPendencies, function(i) { return i === noPendenciesText; })) currentUserPendencies = [noPendenciesText];
        else currentUserPendencies = _.filter(currentUserPendencies, function(i){ return i !== noPendenciesText; });

        itemDictionary.pendencies = currentUserPendencies;

    }

    dictionaryUnique = _.sortBy(dictionaryUnique, (o)=>o.name);

    for(var user of dictionaryUnique) {

        var row = $("<tr class='pendency-row'></tr>").html(`
            <td class="align-middle text-sm width-30 avatar-container">
              <img id="userAvatar${user.id}" src="/avatars/${user.id}.jpg" alt="userAvatar" class="avatar avatar-sm rounded-circle-black-mini"/>
              &nbsp;${user.name}
            </td>
            <td class="align-middle text-sm">
              <div class="pendencies-container">
                ${user.pendencies.join("<br/><br/>")}
              </div>
            </td>
        `);

        $("#tablePendencies").append(row);

    }

    checkAvatarImages();

}

function addOptionToSelectCustomChart(idChart, value, text, group) {
    $('#'+idChart).append(`<option group="${group}" value="${value}">${text}&nbsp;&nbsp;&nbsp;</option>`);
}

async function getSankeyChartDataFromConfig(steps) {

    var nodes = [];
    var links = [];
    var allStakeholders = [];

    nodes.push({ id: -1, type: "DECISAO", name: "SEM DECISÕES", info : "---", fill: am5.color(0x1a2035) });
    nodes.push({ id: 0, type: "STAKEHOLDER", name: "SEM STAKEHOLDERS", info : "---", fill: am5.color(0x1a2035) });

    for(const step of steps) {

        nodes.push({ id: step.id, type: "ETAPA", name: step.stepName, info : `Decisões: ${step.decisions.length}`, fill: am5.color(0x1a2035) });

        if(step.decisions.length === 0) {
            links.push({ from: step.id, to: -1, value: 1 });
            links.push({ from: -1, to: 0, value: 1 });
        }

        for(const decision of step.decisions) {

            decision.stakeholders = _.uniq(decision.stakeholders, false, (o)=>{return o.idUser});

            for(const stakeholder of decision.stakeholders) {
                allStakeholders.push(stakeholder);
            }

            allStakeholders = _.uniq(allStakeholders, false, (o)=>{return o.idUser});

            var isDecisionFinished = await isFinished(decision.id);
            var hasEvaluations = await hasAnyEvaluation(decision.id);

            var nodeColor = 0x1a2035;

            if(isDecisionFinished) nodeColor = 0x90EE90;
            else if(hasEvaluations) nodeColor = 0xFFA500;

            var queryCurrentDecision = `$filter(decisions.options.Decision[%.%.id=${decision.id}], function($v, $i, $a) {$v != null}).option`;
            var currentDecision = await jsonata(queryCurrentDecision).evaluate(allProjectData);

            var info = currentDecision ? `ESCOLHA: ${currentDecision}` : "ESCOLHA: ---";

            nodes.push({ id: decision.id, type: "DECISAO", name: decision.question, info : `Stakeholders: ${decision.stakeholders.length}\n\n${info}`, fill: am5.color(nodeColor) });
            links.push({ from: step.id, to: decision.id, value: Math.max(1, decision.stakeholders.length) });

            if(decision.stakeholders.length === 0) {
                links.push({ from: decision.id, to: 0, value: 1 });
            }

            for(const stakeholder of allStakeholders) {
                nodes.push({ id: stakeholder.id, idUser: stakeholder.idUser, type: "STAKEHOLDER", name: stakeholder.stakeholderName, info : "", fill: am5.color(0x1a2035) });
                if(_.contains(decision.stakeholders.map((o)=>{return o.idUser}), stakeholder.idUser)) links.push({ from: decision.id, to: stakeholder.id, value: 1 }); //baba
            }

        }

    }

    nodes = _.uniq(nodes, false, (o)=> {return o.id});
    links = _.uniq(links, false, (o)=> {return o.from + "_" + o.to});

    var stakeholdersQuery = `[*[type='STAKEHOLDER']]`;
    var uniqueStakeholders = await jsonata(stakeholdersQuery).evaluate(nodes);

    for(const stakeholder of uniqueStakeholders) {

        if(stakeholder.id === 0) continue;

        var stakeholderDecisionsCountQuery = `$count(*[to=${stakeholder.id}])`;
        var count = await jsonata(stakeholderDecisionsCountQuery).evaluate(links);

        var queryStakeholderCourse = `*[idUser=${stakeholder.idUser}].courseName`;
        var stakeholderCourse = await jsonata(queryStakeholderCourse).evaluate(allStakeholders);

        stakeholder.info = `\n\Curso: ${stakeholderCourse}\n\nDecisões: ${count}`;

    }

    var noDecisionsCount = `$count(*[to=-1])`;
    var count = await jsonata(noDecisionsCount).evaluate(links);

    if(count === 0) {
        nodes = _.without(nodes, _.findWhere(nodes, {id: -1}));
    }

    var noStakeholdersCount = `$count(*[to=0])`;
    var count = await jsonata(noStakeholdersCount).evaluate(links);

    if(count === 0) {
        nodes = _.without(nodes, _.findWhere(nodes, {id: 0}));
    }

    return({nodes: nodes, links: links});

}

async function hasAnyEvaluation(idDecision) {

    return $.ajax({
        method: "POST",
        url: "/project/hasAnyEvaluation",
        data: { idDecision: idDecision }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return false;
    }).done(function (result) {
        return result;
    });

}

async function isFinished(idDecision) {

    return $.ajax({
        method: "POST",
        url: "/project/isDecisionFinished",
        data: { idDecision: idDecision }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return false;
    }).done(function (result) {
        return result;
    });

}

async function populateCustomChartsSelect(generalEvc, usersOtionsSelect, coursesOptionsSelect) {

    var queryOrderedOptions = `[*^(label)]`;

    usersOtionsSelect = await jsonata(queryOrderedOptions).evaluate(usersOtionsSelect);
    coursesOptionsSelect = await jsonata(queryOrderedOptions).evaluate(coursesOptionsSelect);

    $('#selectChart1Content').empty();
    $('#selectChart2Content').empty();

    addOptionToSelectCustomChart("selectChart1Content", generalEvc.id, generalEvc.label, "general");
    addOptionToSelectCustomChart("selectChart2Content", generalEvc.id, generalEvc.label, "general");

    addOptionToSelectCustomChart("selectChart1Content", -1, "--------------------", "none");
    addOptionToSelectCustomChart("selectChart2Content", -1, "--------------------", "none");

    for(var item of usersOtionsSelect) {
        addOptionToSelectCustomChart("selectChart1Content", item.id, item.label, "user");
        addOptionToSelectCustomChart("selectChart2Content", item.id, item.label, "user");
    }

    addOptionToSelectCustomChart("selectChart1Content", -1, "--------------------", "none");
    addOptionToSelectCustomChart("selectChart2Content", -1, "--------------------", "none");

    for(var item of coursesOptionsSelect) {
        addOptionToSelectCustomChart("selectChart1Content", item.id, item.label, "course");
        addOptionToSelectCustomChart("selectChart2Content", item.id, item.label, "course");
    }

}

async function getConfigData(json) {

    var querySteps = '[drawflow.Home.data.*[name=\'step\'].[${\'id\': id, \'stepName\': data.step_name, \'idPreviousStep\' : inputs.input_1.connections.node & \'\', \'idNextStep\': outputs.output_1.connections.node & \'\', \'decisions\': []}].*]';

    var steps = await jsonata(querySteps).evaluate(JSON.parse(json));

    for(const step of steps) {

        var queryDecisions = `[drawflow.Home.data.*[name='decision']['${step.id}' in inputs.input_1.connections.node].[\${'id':id, 'question':data.question, 'stakeholders': []}].*]`;

        step.decisions = await jsonata(queryDecisions).evaluate(JSON.parse(json));

        for(const decision of step.decisions) {

            var queryStakeholders = `[drawflow.Home.data.*[name='stakeholder' and '${decision.id}' in inputs.input_1.connections.node].[\${'id': id, 'idUser':$number(data.user_id), 'stakeholderName': data.user_name, 'courseName': data.course_name, 'idCourse': data.course_id}].*]`;

            var stakeholders = await jsonata(queryStakeholders).evaluate(JSON.parse(json));

            decision.stakeholders = _.uniq(stakeholders, false, (o)=>{return o.idUser});

        }

    }

    return steps;

}

async function getEvcRankings(editorJson) {

    var fullData = await getFullProjectData(editorJson, true, 0);

    var queryAllUsers = `[$distinct(decisions.stakeholders.$.{"idUser": idUser, "stakeholderName": stakeholderName, "courseName": courseName, "idCourse": idCourse})]`;
    var allUsers = await jsonata(queryAllUsers).evaluate(fullData);

    var queryAllCourses = `[$distinct(decisions.stakeholders.$.{"courseName": courseName, "idCourse": idCourse})]`;
    var allCourses = await jsonata(queryAllCourses).evaluate(fullData);

    var allUsersEvc = [];

    for(var user of allUsers) {

        var queryUserEvc = "${\"evc\": $average(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.evc[%.UserId="+user.idUser+"]), \"e\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.e[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.v[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.c[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5}))}";
        var userEvc = await jsonata(queryUserEvc).evaluate(fullData);

        if(!userEvc.evc) userEvc = {evc: 0, e: 0, v: 0, c: 0};

        allUsersEvc.push({id: user.idUser, label: user.stakeholderName, evc: userEvc.evc.toFixed(2), e: userEvc.e.toFixed(2), v: userEvc.v.toFixed(2), c: userEvc.c.toFixed(2)})

    }

    var allCoursesEvc = [];

    for(var course of allCourses) {

        var queryCourseEvc = "${\"evc\": $average(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.evc[%.CourseId="+course.idCourse+"]), \"e\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.e[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.v[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options[isComplete=true and isSelectedChoice=true].Evaluations.c[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5}))}";
        var courseEvc = await jsonata(queryCourseEvc).evaluate(fullData);

        if(!courseEvc.evc) courseEvc = {evc: 0, e: 0, v: 0, c: 0};

        allCoursesEvc.push({id: course.idCourse, label: course.courseName, evc: courseEvc.evc.toFixed(2), e: courseEvc.e.toFixed(2), v: courseEvc.v.toFixed(2), c: courseEvc.c.toFixed(2)})

    }

    var queryAllUsersOrderedByEvc = `[*^(>evc, label)]`;
    allUsersEvc = await jsonata(queryAllUsersOrderedByEvc).evaluate(allUsersEvc);

    var queryAllCoursesOrderedByEvc = `[*^(>evc, label)]`;
    allCoursesEvc = await jsonata(queryAllCoursesOrderedByEvc).evaluate(allCoursesEvc);

    // var queryGeneralEvc = "${\"evc\": $average(decisions.options[isComplete=true].Evaluations.evc), \"e\": $average($map(decisions.options[isComplete=true].Evaluations.e, function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options[isComplete=true].Evaluations.v, function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options[isComplete=true].Evaluations.c, function($v, $k) {($v-1)/5}))}";
    // var generalEvc = await jsonata(queryGeneralEvc).evaluate(fullData);

    var generalEvc = allUsersEvc.length > 0 ? {evc: math.mean(allUsersEvc.map((o)=>o.evc)), e: math.mean(allUsersEvc.map((o)=>o.e)), v: math.mean(allUsersEvc.map((o)=>o.v)), c: math.mean(allUsersEvc.map((o)=>o.c))} : {evc: 0, e: 0, v: 0, c: 0};

    // if(!generalEvc.evc) generalEvc = {evc: 0, e: 0, v: 0, c: 0};

    generalEvc = {id: 0, label: "Geral", evc: generalEvc.evc.toFixed(2), e: generalEvc.e.toFixed(2), v: generalEvc.v.toFixed(2), c: generalEvc.c.toFixed(2)};

    return {generalEvc: generalEvc, allUsersEvc: allUsersEvc, allCoursesEvc: allCoursesEvc}

}

async function getFullProjectData(projectJson, showLoading, projectId) {

    if(showLoading) $.LoadingOverlay("show");

    var steps = await getConfigData(projectJson);
    var result = [];

    var optionsWithEvaluations = await $.ajax({
        method: "POST",
        url: "/project/results",
        data: {projectId: projectId}
    }).fail(function (jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return result;
    }).done(async function (optionsWithEvaluations) {
        return optionsWithEvaluations;
    });

    if (optionsWithEvaluations) {
        result = await joinDataAddScores(steps, optionsWithEvaluations, projectId);
    }

    if(showLoading) $.LoadingOverlay("hide");

    return result;

}

async function joinDataAddScores(steps, optionsWithEvaluations, projectId) {

    for(var step of steps) {

        var decisions = step.decisions;

        for(var decision of decisions) {

            var numberOfStakeholders = decision.stakeholders.length;

            var queryOptions = `[*[idDecision=${decision.id}]]`;
            var options = await jsonata(queryOptions).evaluate(optionsWithEvaluations);

            var queryAllvs = "[*.[${\"id\": id, \"allV\": [Evaluations.v]}].*]";
            var allVs = await jsonata(queryAllvs).evaluate(options);

            var newVs = allVs.map((o)=> {
                return {id: o.id, allV: o.allV.map((x)=>(x-1)/5)}
            });

            var weights = newVs.map((o)=>{
                return {id: o.id, weight: math.mean(o.allV.length > 0 ? o.allV : 0.00)};
            });

            var queryEvcMeans = "[*.[${\"id\": id, \"meanEvc\": $average(Evaluations.evc)}].*]";
            var evcMeans = await jsonata(queryEvcMeans).evaluate(options);

            var queryAllEvc = "[*.[${\"id\": id, \"allE\": [Evaluations.e], \"allV\": [Evaluations.v], \"allC\": [Evaluations.c]}].*]";
            var allEvc = await jsonata(queryAllEvc).evaluate(options);

            for(var singleEvc of allEvc) {

                if(singleEvc.allE.length === 0 || singleEvc.allV.length === 0 || singleEvc.allC.length === 0) {

                    singleEvc.agreement = 0.00;

                }
                else {

                    var var_e = math.variance(singleEvc.allE, 'uncorrected');
                    var var_v = math.variance(singleEvc.allV, 'uncorrected');
                    var var_c = math.variance(singleEvc.allC, 'uncorrected');

                    var mvar = math.mean(var_e, var_v, var_c);

                    var denominator = 6.25;

                    var agreement = 1 - (mvar/denominator);

                    singleEvc.agreement = agreement;

                }

            }

            for(var option of options) {

                var hasZero = _.some(option.Evaluations, (o)=> o.e === 0 || o.v === 0 || o.c === 0);
                var hasEvaluations = option.Evaluations.length > 0;
                var hasAllStakeholders = option.Evaluations.length === numberOfStakeholders;

                option.isComplete = !hasZero && hasEvaluations && hasAllStakeholders;

                if(!option.isComplete) {

                    option.weight = 0.00;
                    option.meanEvc = 0.00;
                    option.agreement = 0.00;

                    continue;

                }

                try{
                    option.weight = Number(_.find(weights, (o)=>o.id === option.id).weight.toFixed(2));
                }
                catch(e) {
                    option.weight = 0.00;
                }

                try {
                    option.meanEvc = Number(_.find(evcMeans, (o)=>o.id === option.id).meanEvc.toFixed(2));
                }
                catch(e) {
                    option.meanEvc = 0.00;
                }

                try {
                    option.agreement = Number(_.find(allEvc, (o)=>o.id === option.id).agreement.toFixed(2));
                }
                catch(e) {
                    option.agreement = 0.00;
                }

                if(option.Decision) {
                    option.Decision.option = option.option;
                }

                option.isSelectedChoice = await checkIsChoice(option.id, projectId);

            }

            decision.options = options;

        }

    }

    return steps;

}

async function checkIsChoice(evaluationOptionId, projectId) {

    return $.ajax({
        method: "POST",
        url: "/project/decisions/choice/check",
        data: { evaluationOptionId: evaluationOptionId, projectId: projectId }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return false;
    }).done(function (result) {
        return result;
    });

}

function activateTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

function hideTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
    });
}

function activateEditables() {
    $('.input').jinplace({"inputClass": "editable-input"});
}

$("#btLogout").click(function() {

    Swal.fire({

        title: 'Atenção!',
        html: "Tem certeza de que deseja sair?",
        icon: 'info',
        showCancelButton: true,
        cancelButtonText: "NÃO",
        confirmButtonText: 'SIM'

    }).then((result) => {

        if (result.isConfirmed) {
            window.location.href = "/login/out";
        }

    });

});

function checkAvatarImages() {
    $('.avatar-container').each(function() {
        var avatarImage = $(this).find("img");
        $(this).imagesLoaded().fail( function() {
            avatarImage.attr("src", "/img/0.jpg");
        });
    });
}

function setDrawFlowTooltip(el) {

    var id = $(el).parent().parent().parent().parent()[0].id;
    var val = $(el).val();

    $('#'+id).attr("data-bs-original-title", val);

}

function setDrawFlowTooltipImport(el, tooltipId) {
    $('#'+tooltipId).attr("data-bs-original-title", $(el).val());
}

async function clearAllCharts() {

    am5.array.each(am5.registry.rootElements,
        function(root) {
            try{
                root.dispose();
            }
            catch(err){}
        }
    );

    return true;

}

async function clearCharts(numberOfCharts) {
    for(var i = 1; i <= numberOfCharts; i++) await clearAllCharts();
    return true;
}