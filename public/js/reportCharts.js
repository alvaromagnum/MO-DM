var root = am5.Root.new("chartdiv");

root.setThemes([
    am5themes_Animated.new(root)
]);

var data = [{
    category: "E",
    value1: 80,
    value2: 84
}, {
    category: "V",
    value1: 79,
    value2: 81
}, {
    category: "C",
    value1: 23,
    value2: 17
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

var names = ["Geral", "Aluno"];

for (var i = 1; i <= 2; i++) {

    var series = chart.series.push(
        am5radar.RadarColumnSeries.new(root, {
            name: names[i-1],
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

//chart.series.getIndex(1).hide();
