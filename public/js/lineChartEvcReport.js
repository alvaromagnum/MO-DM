async function generateLineChart(divId, snapshots) {

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

    var userSeries = await processSnapshots(snapshots);

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

    var xRenderer = am5xy.AxisRendererX.new(root, {});

    xRenderer.grid.template.set("location", 0.5);
    xRenderer.labels.template.setAll({location: 0.5, multiLocation: 0.5});

    var xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
            baseInterval: {timeUnit: "hour", count: 1},
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

    for(var userSerie of userSeries) {

        var data = userSerie;

        var series = chart.series.push(
            am5xy.LineSeries.new(root, {
                // fill: am5.color(0x095256),
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

        var i = -1;

        series.bullets.push(function () {

            i++;

            //var id = data[i].id;

            var container = am5.Container.new(root, {
                centerX: am5.p50,
                centerY: am5.p50
            });

            container.children.push(
                am5.Circle.new(root, {radius: 20, fill: series.get("fill")})
            );

            container.children.push(
                am5.Picture.new(root, {
                    centerX: am5.p50,
                    centerY: am5.p50,
                    width: 23,
                    height: 23,
                    // src: "https://amcharts.com/wp-content/uploads/assets/timeline/timeline" + 1 + ".svg"
                    src: "/img/student-avatar-bubble.png"
                })
            );

            return am5.Bullet.new(root, {
                sprite: container
            });

        });

        series.data.setAll(data);

        series.appear(1000);

    }

    chart.appear(1000, 100);

}

async function processSnapshots(snapshots) {

    var userData = [];
    var point = 0;

    var queryAllUsers = `[$distinct(jsonSnapshot.allUsersEvc.id)]`;
    var allUsersIds = await jsonata(queryAllUsers).evaluate(snapshots);

    for(var snapshot of snapshots) {

        var date = date = moment(snapshot.createdAt).format("DD-MM-YYYY HH:mm:ss");

        for(var user of snapshot.jsonSnapshot.allUsersEvc) {
            userData.push({point: point, id: user.id, label: user.label, date: date, value: Number((user.evc*100).toFixed(2))});
        }

        point++;

    }

    var userSeries = [];

    for(var userId of allUsersIds) {

        var queryUserSerie = `[*[id=${userId}]^(point)]`;
        var userSerie = await jsonata(queryUserSerie).evaluate(userData);

        userSeries.push(userSerie);

    }

    return userSeries;

}