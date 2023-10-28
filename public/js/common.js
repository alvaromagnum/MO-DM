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

    var fullData = await getFullProjectData(editorJson, true);

    var queryAllUsers = `[$distinct(decisions.stakeholders.$.{"idUser": idUser, "stakeholderName": stakeholderName, "courseName": courseName, "idCourse": idCourse})]`;
    var allUsers = await jsonata(queryAllUsers).evaluate(fullData);

    var queryAllCourses = `[$distinct(decisions.stakeholders.$.{"courseName": courseName, "idCourse": idCourse})]`;
    var allCourses = await jsonata(queryAllCourses).evaluate(fullData);

    var allUsersEvc = [];

    for(var user of allUsers) {

        var queryUserEvc = "${\"evc\": $average(decisions.options.Evaluations.evc[%.UserId="+user.idUser+"]), \"e\": $average($map(decisions.options.Evaluations.e[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options.Evaluations.v[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options.Evaluations.c[%.UserId="+user.idUser+"], function($v, $k) {($v-1)/5}))}";
        var userEvc = await jsonata(queryUserEvc).evaluate(fullData);

        if(!userEvc.evc) userEvc = {evc: 0, e: 0, v: 0, c: 0};

        allUsersEvc.push({id: user.idUser, label: user.stakeholderName, evc: userEvc.evc.toFixed(2), e: userEvc.e.toFixed(2), v: userEvc.v.toFixed(2), c: userEvc.c.toFixed(2)})

    }

    var allCoursesEvc = [];

    for(var course of allCourses) {

        var queryCourseEvc = "${\"evc\": $average(decisions.options.Evaluations.evc[%.CourseId="+course.idCourse+"]), \"e\": $average($map(decisions.options.Evaluations.e[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options.Evaluations.v[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options.Evaluations.c[%.CourseId="+course.idCourse+"], function($v, $k) {($v-1)/5}))}";
        var courseEvc = await jsonata(queryCourseEvc).evaluate(fullData);

        if(!courseEvc.evc) courseEvc = {evc: 0, e: 0, v: 0, c: 0};

        allCoursesEvc.push({id: course.idCourse, label: course.courseName, evc: courseEvc.evc.toFixed(2), e: courseEvc.e.toFixed(2), v: courseEvc.v.toFixed(2), c: courseEvc.c.toFixed(2)})

    }

    var queryAllUsersOrderedByEvc = `[*^(>evc, label)]`;
    allUsersEvc = await jsonata(queryAllUsersOrderedByEvc).evaluate(allUsersEvc);

    var queryAllCoursesOrderedByEvc = `[*^(>evc, label)]`;
    allCoursesEvc = await jsonata(queryAllCoursesOrderedByEvc).evaluate(allCoursesEvc);

    var queryGeneralEvc = "${\"evc\": $average(decisions.options.Evaluations.evc), \"e\": $average($map(decisions.options.Evaluations.e, function($v, $k) {($v-1)/5})), \"v\": $average($map(decisions.options.Evaluations.v, function($v, $k) {($v-1)/5})), \"c\": $average($map(decisions.options.Evaluations.c, function($v, $k) {($v-1)/5}))}";
    var generalEvc = await jsonata(queryGeneralEvc).evaluate(fullData);

    if(!generalEvc.evc) generalEvc = {evc: 0, e: 0, v: 0, c: 0};

    generalEvc = {id: 0, label: "Geral", evc: generalEvc.evc.toFixed(2), e: generalEvc.e.toFixed(2), v: generalEvc.v.toFixed(2), c: generalEvc.c.toFixed(2)};

    return {generalEvc: generalEvc, allUsersEvc: allUsersEvc, allCoursesEvc: allCoursesEvc}

}

async function getFullProjectData(projectJson, showLoading) {

    if(showLoading) $.LoadingOverlay("show");

    var steps = await getConfigData(projectJson);

    var result = [];

    var optionsWithEvaluations = await $.ajax({
        method: "POST",
        url: "/project/results",
    }).fail(function (jqXHR, textStatus, errorThrown) {
        Swal.fire('Erro!', jqXHR.responseText, 'error');
        return result;
    }).done(async function (optionsWithEvaluations) {
        return optionsWithEvaluations;
    });

    if (optionsWithEvaluations) {
        result = await joinDataAddScores(steps, optionsWithEvaluations);
    }

    if(showLoading) $.LoadingOverlay("hide");

    return result;

}

async function joinDataAddScores(steps, optionsWithEvaluations) {

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
                return {id: o.id, weight: math.mean(o.allV)};
            });

            var queryEvcMeans = "[*.[${\"id\": id, \"meanEvc\": $average(Evaluations.evc)}].*]";
            var evcMeans = await jsonata(queryEvcMeans).evaluate(options);

            var queryAllEvc = "[*.[${\"id\": id, \"allE\": [Evaluations.e], \"allV\": [Evaluations.v], \"allC\": [Evaluations.c]}].*]";
            var allEvc = await jsonata(queryAllEvc).evaluate(options);

            for(var singleEvc of allEvc) {

                var var_e = math.variance(singleEvc.allE, 'uncorrected');
                var var_v = math.variance(singleEvc.allV, 'uncorrected');
                var var_c = math.variance(singleEvc.allC, 'uncorrected');

                var mvar = math.mean(var_e, var_v, var_c);

                var denominator = 6.25;

                var agreement = 1 - (mvar/denominator);

                singleEvc.agreement = agreement;

            }

            for(var option of options) {

                var hasZero = _.some(option.Evaluations, (o)=> o.e === 0 || o.v === 0 || o.c === 0);
                var hasEvaluations = option.Evaluations.length > 0;
                var hasAllStakeholders = option.Evaluations.length === numberOfStakeholders;

                option.isComplete = !hasZero && hasEvaluations && hasAllStakeholders;

                option.weight = _.find(weights, (o)=>o.id === option.id).weight.toFixed(2);
                option.meanEvc = _.find(evcMeans, (o)=>o.id === option.id).meanEvc.toFixed(2);
                option.agreement = _.find(allEvc, (o)=>o.id === option.id).agreement.toFixed(2);

                if(option.Decision) {
                    option.Decision.option = option.option;
                }

            }

            decision.options = options;

        }

    }

    return steps;

}

function activateTooltips() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

function activateEditables() {
    $('.input').jinplace({"inputClass": "editable-input"});
}

$("#btLogout").click(function() {

    Swal.fire({

        title: 'Atenção!',
        html: "Tem certeza de que deseja sair ?",
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