async function generateLineChartStudents(divId, snapshots, evcRankings, pageAllUsersEvc) {

    am5.array.each(am5.registry.rootElements,
        function(root) {
            try{
                if (root.dom.id == divId) {
                    root.dispose();
                }
            }
            catch(err){}
        }
    );

    var userSeries = await processSnapshotsStudents(snapshots, evcRankings, pageAllUsersEvc);

    var root = am5.Root.new(divId);

    root.locale = am5locales_pt_BR;

    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            layout: root.verticalLayout,
            pinchZoomX: true
        })
    );

    var cursor = chart.set(
        "cursor",
        am5xy.XYCursor.new(root, {
            behavior: "none"
        })
    );

    cursor.lineY.set("visible", false);

    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));

    chart.set("scrollbarY", am5.Scrollbar.new(root, {
        orientation: "vertical"
    }));

    var xRenderer = am5xy.AxisRendererX.new(root, {});

    xRenderer.grid.template.set("location", 0.5);
    xRenderer.labels.template.setAll({location: 0.5, multiLocation: 0.5});

    var xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
            baseInterval: {timeUnit: "minute", count: 1},
            renderer: xRenderer,
            tooltip: am5.Tooltip.new(root, {})
        })
    );

    var yRenderer = am5xy.AxisRendererY.new(root, {});

    yRenderer.grid.template.set("forceHidden", true);
    yRenderer.labels.template.set("minPosition", 0.05);

    var yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            maxPrecision: 0,
            extraMin: 0.1,
            renderer: yRenderer
        })
    );

    var colors = [];

    for(var m = 0; m < userSeries.length; m++) {

        let c = chroma.random();

        while(_.contains(colors, c)) c = chroma.random();

        colors.push(c);

    }

    var circleColors = [];

    var j = 0;

    for(var userSerie of userSeries) {

        var data = userSerie;

        //if(data.length === 0) continue;

        var color = colors[j++];

        var series = chart.series.push(
            am5xy.LineSeries.new(root, {
                name: data[0].label,
                fill: null,
                stroke: color,
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "value",
                valueXField: "date",
                maskBullets: false,
                tooltip: am5.Tooltip.new(root, {
                    pointerOrientation: "vertical",
                    dy: -20,
                    labelText: "{label} - {valueY}",
                    keepTargetHover: true
                })
            })
        );

        series.data.processor = am5.DataProcessor.new(root, {
            dateFormat: "dd-MM-yyyy HH:mm:ss",
            dateFields: ["date"]
        });

        series.strokes.template.setAll({strokeDasharray: [3, 3], strokeWidth: 2});

        series.data.setAll(data);

        var i = -1;

        series.bullets.push(function () {

            i++;

            var container = am5.Container.new(root, {
                centerX: am5.p50,
                centerY: am5.p50
            });

            container.children.push(am5.Circle.new(root, {radius: 10, fill: circleColors[i]}));

            return am5.Bullet.new(root, { sprite: container });

        });

        if(userSeries.length === colors.length) {
            fillCircleColors(circleColors, colors, userSeries);
        }

        series.appear(1000);

    }

    chart.appear(1000, 100);

    var legend = chart.children.push(am5.Legend.new(root, {}));

    legend.data.setAll(chart.series.values);

}

function fillCircleColors(circleColors, colors, userSeries) {

    var legendsNumber = userSeries.length;

    for(var i = 0; i < legendsNumber; i++) {
        circleColors.push(colors[i]);
    }

    var j = 0;

    for(var userSerie of userSeries) {

        for(var k = 0; k < userSerie.length; k++) {
            circleColors.push(colors[j]);
        }

        j++;

    }

}

async function processSnapshotsStudents(snapshots, evcRankings, pageAllUsersEvc) {

    var userData = [];
    var point = 0;

    var queryAllUsers1 = `[$distinct(jsonSnapshot.allUsersEvc.id)]`;
    var allUsersIds1 = await jsonata(queryAllUsers1).evaluate(snapshots);

    var queryAllUsers2 = `[$distinct(allUsersEvc.id)]`;
    var allUsersIds2 = await jsonata(queryAllUsers2).evaluate(evcRankings);

    var allUsersIds = _.uniq(allUsersIds1.concat(allUsersIds2));

    for(var snapshot of snapshots) {

        var date = date = moment(snapshot.createdAt).format("DD-MM-YYYY HH:mm:ss");

        for(var user of snapshot.jsonSnapshot.allUsersEvc) {
            userData.push({point: point, id: user.id, label: user.label, date: date, value: Number((user.evc*100).toFixed(2))});
        }

        point++;

    }

    var date = moment().format("DD-MM-YYYY HH:mm:ss");

    if(userData.length === 0) {

        for(var user of pageAllUsersEvc) {
            userData.push({point: 1, id: user.id, label: user.label, date: date, value: 0});
        }

    }

    // var currentEvcs = evcRankings.allUsersEvc;
    //
    // if(currentEvcs) {
    //
    //     //var date = moment().add(5, 'm').format("DD-MM-YYYY HH:mm:ss");
    //     var date = moment().format("DD-MM-YYYY HH:mm:ss");
    //
    //     for(var user of currentEvcs) {
    //         userData.push({point: point, id: user.id, label: user.label, date: date, value: Number((user.evc*100).toFixed(2))});
    //     }
    //
    // }

    var userSeries = [];

    snapshots = _.sortBy(snapshots, function(o){ return o.createdAt; });

    for(var userId of allUsersIds) {

        var queryUserSerie = `[*[id=${userId}]^(point)]`;
        var userSerie = await jsonata(queryUserSerie).evaluate(userData);

        if(userSerie.length === 0) {

            var pointNumber = 0;

            for(var item of snapshots) {

                userSerie.push({
                    "point": pointNumber++,
                    "id": userId,
                    "label": _.filter(pageAllUsersEvc, function(o){ return o.id === userId; })[0].label,
                    "date": moment(item.createdAt).format("DD-MM-YYYY HH:mm:ss"),
                    "value": 0
                });

            }

        }

        userSeries.push(userSerie);

    }

    return userSeries;

}

async function generateLineChartGeneral(divId, snapshots, evcRankings) {

    am5.array.each(am5.registry.rootElements,
        function(root) {
            try{
                if (root.dom.id == divId) {
                    root.dispose();
                }
            }
            catch(err){}
        }
    );

    var generalSerie = await processSnapshotsGeneral(snapshots, evcRankings);

    var root = am5.Root.new(divId);

    root.locale = am5locales_pt_BR;

    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            layout: root.verticalLayout,
            pinchZoomX: true
        })
    );

    var cursor = chart.set(
        "cursor",
        am5xy.XYCursor.new(root, {
            behavior: "none"
        })
    );

    cursor.lineY.set("visible", false);

    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));

    chart.set("scrollbarY", am5.Scrollbar.new(root, {
        orientation: "vertical"
    }));

    var xRenderer = am5xy.AxisRendererX.new(root, {});

    xRenderer.grid.template.set("location", 0.5);
    xRenderer.labels.template.setAll({location: 0.5, multiLocation: 0.5});

    var xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
            baseInterval: {timeUnit: "minute", count: 1},
            renderer: xRenderer,
            tooltip: am5.Tooltip.new(root, {})
        })
    );

    var yRenderer = am5xy.AxisRendererY.new(root, {});

    yRenderer.grid.template.set("forceHidden", true);
    yRenderer.labels.template.set("minPosition", 0.05);

    var yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            maxPrecision: 0,
            extraMin: 0.1,
            renderer: yRenderer
        })
    );

    var data = generalSerie;

    var series = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: data[0].label,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value",
            valueXField: "date",
            maskBullets: false,
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "vertical",
                dy: -20,
                labelText: "{label} - {valueY}"
            })
        })
    );

    series.data.processor = am5.DataProcessor.new(root, {
        dateFormat: "dd-MM-yyyy HH:mm:ss",
        dateFields: ["date"]
    });

    series.strokes.template.setAll({strokeDasharray: [3, 3], strokeWidth: 2});

    series.bullets.push(function () {

        var container = am5.Container.new(root, {
            centerX: am5.p50,
            centerY: am5.p50
        });

        container.children.push(
            am5.Circle.new(root, {radius: 10, fill: series.get("fill")})
        );

        return am5.Bullet.new(root, {
            sprite: container
        });

    });

    series.data.setAll(data);

    series.appear(1000);

    chart.appear(1000, 100);

}

async function processSnapshotsGeneral(snapshots, evcRankings) {

    var generalSerie = [];

    for(var snapshot of snapshots) {

        var date = date = moment(snapshot.createdAt).format("DD-MM-YYYY HH:mm:ss");

        var generalEvc = snapshot.jsonSnapshot.generalEvc;

        generalSerie.push({id: generalEvc.id, label: generalEvc.label, date: date, value: Number((generalEvc.evc*100).toFixed(2))});

    }

    var date = moment().format("DD-MM-YYYY HH:mm:ss");

    if(generalSerie.length === 0) {
        generalSerie.push({id: 0, label: "GERAL", date: date, value: 0});
    }

    // var currentEvc = evcRankings.generalEvc;
    //
    // if(currentEvc) {
    //
    //     // var date = moment().add(5, 'm').format("DD-MM-YYYY HH:mm:ss");
    //     var date = moment().format("DD-MM-YYYY HH:mm:ss");
    //
    //     generalSerie.push({id: currentEvc.id, label: currentEvc.label, date: date, value: Number((currentEvc.evc*100).toFixed(2))});
    //
    // }

    return generalSerie;

}