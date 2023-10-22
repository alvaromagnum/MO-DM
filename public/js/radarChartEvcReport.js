generateRadarChart("moreMotivatedStudentDiv", [78, 74, 23], [85, 92, 19], [0x0f52ba, 0x008ecc], "Fulano", false);
generateRadarChart("lessMotivatedStudentDiv", [78, 74, 23], [62, 67, 38], [0x627ccd, 0x2c375b], "Beltrano", false);
generateRadarChart("moreMotivatedCoursetDiv", [78, 74, 23], [82, 89, 21], [0x778899, 0xb2cbe5], "Computação", false);
generateRadarChart("lessMotivatedCoursetDiv", [78, 74, 23], [75, 70, 28], [0x67b7dc, 0x6794dc], "Física", false);

function generateRadarChart(divId, generalEvc, userEvc, colors, otherLabel, hideGeneral) {

    var root = am5.Root.new(divId);

    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var data = [{
        category: "E",
        value1: generalEvc[0],
        value2: userEvc[0]
    }, {
        category: "V",
        value1: generalEvc[1],
        value2: userEvc[1]
    }, {
        category: "C",
        value1: generalEvc[2],
        value2: userEvc[2]
    }];

    var chart = root.container.children.push(
        am5radar.RadarChart.new(root, {
            panX: false,
            panY: false,
            wheelX: false,
            wheelY: false
        })
    );

    var cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {}));

    cursor.lineX.set("visible", false);
    cursor.lineY.set("visible", false);

    var xRenderer = am5radar.AxisRendererCircular.new(root, {
        cellStartLocation: 0.2,
        cellEndLocation: 0.8
    });

    xRenderer.labels.template.setAll({
        radius: 10
    });

    var xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
            maxDeviation: 0,
            categoryField: "category",
            renderer: xRenderer,
            tooltip: am5.Tooltip.new(root, {})
        })
    );

    xAxis.data.setAll(data);

    var yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5radar.AxisRendererRadial.new(root, {})
        })
    );

    var names = ["Geral", otherLabel];

    for (var i = 1; i <= 2; i++) {

        var series = chart.series.push(
            am5radar.RadarColumnSeries.new(root, {
                name: names[i-1],
                fill: am5.color(colors[i-1]),
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "value" + i,
                categoryXField: "category"
            })
        );

        series.columns.template.setAll({
            tooltipText: "{name}: {valueY}",
            width: am5.percent(100)
        });

        series.data.setAll(data);

        series.appear(1000);

    }

    chart.appear(1000, 100);

    var legend = chart.children.push(am5.Legend.new(root, {}));

    legend.data.setAll(chart.series.values);
    legend.valueLabels.template.set("forceHidden", true);

    if(hideGeneral) setTimeout(()=>{chart.series.getIndex(0).hide()}, 1);

}