function generateLineChart(divId) {

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

    var root = am5.Root.new(divId);

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

    var data = [
        {
            id: 1,
            date: "2021-12-31 18:00",
            value: 0
        },
        {
            id: 2,
            date: "2021-12-31 19:00",
            value: 0
        },
        {
            id: 3,
            date: "2021-12-31 20:00",
            value: 0
        },
        {
            id: 4,
            date: "2021-12-31 21:00",
            value: 0.3
        },
        {
            id: 5,
            date: "2021-12-31 22:00",
            value: 0.8
        },
        {
            id: 6,
            date: "2021-12-31 23:00",
            value: 1.2
        },
        {
            id: 7,
            date: "2022-01-01 00:00",
            value: 2.2
        },
        {
            id: 8,
            date: "2022-01-01 01:00",
            value: 2.5
        },
        {
            id: 9,
            date: "2022-01-01 02:00",
            value: 2.2
        }
    ];

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

    var series = chart.series.push(
        am5xy.LineSeries.new(root, {
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value",
            valueXField: "date",
            maskBullets: false,
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "vertical",
                dy: -20,
                labelText: "{valueY}"
            })
        })
    );

    series.data.processor = am5.DataProcessor.new(root, {
        dateFormat: "yyyy-MM-dd HH:mm",
        dateFields: ["date"]
    });

    series.strokes.template.setAll({strokeDasharray: [3, 3], strokeWidth: 2});

    var i = -1;

    series.bullets.push(function () {

        i++;

        var id = data[i].id;

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

    chart.appear(1000, 100);

}