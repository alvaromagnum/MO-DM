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

async function getFullProjectData(projectJson) {

    $.LoadingOverlay("show");

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

    $.LoadingOverlay("hide");

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

            }

            decision.options = options;

        }

    }

    return steps;

}