var root = am5.Root.new("lessMotivatedCoursetDiv");

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

var chartLessMotivatedCourse = root.container.children.push(
    am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        wheelX: false,
        wheelY: false
    })
);

var cursor = chartLessMotivatedCourse.set("cursor", am5radar.RadarCursor.new(root, {}));

cursor.lineX.set("visible", false);
cursor.lineY.set("visible", false);

var xRenderer = am5radar.AxisRendererCircular.new(root, {
    cellStartLocation: 0.2,
    cellEndLocation: 0.8
});

xRenderer.labels.template.setAll({
    radius: 10
});

var xAxis = chartLessMotivatedCourse.xAxes.push(
    am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "category",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
    })
);

xAxis.data.setAll(data);

var yAxis = chartLessMotivatedCourse.yAxes.push(
    am5xy.ValueAxis.new(root, {
        renderer: am5radar.AxisRendererRadial.new(root, {})
    })
);

var names = ["Geral", "Física"];

for (var i = 1; i <= 2; i++) {

    var series = chartLessMotivatedCourse.series.push(
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

chartLessMotivatedCourse.appear(1000, 100);

var legend = chartLessMotivatedCourse.children.push(am5.Legend.new(root, {}));

legend.data.setAll(chartLessMotivatedCourse.series.values);
legend.valueLabels.template.set("forceHidden", true);

setTimeout(()=>{chartLessMotivatedCourse.series.getIndex(0).hide()}, 1);
