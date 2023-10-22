generateGaugeChart("moreMotivatedStudentDiv2");
generateGaugeChart("lessMotivatedStudentDiv2");
generateGaugeChart("moreMotivatedCoursetDiv2");
generateGaugeChart("lessMotivatedCoursetDiv2");

function generateGaugeChart(divId) {

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new(divId);


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([
        am5themes_Animated.new(root)
    ]);


// Create chart
// https://www.amcharts.com/docs/v5/charts/radar-chart/
    var chart = root.container.children.push(am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: 160,
        endAngle: 380
    }));


// Create axis and its renderer
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Axes
    var axisRenderer = am5radar.AxisRendererCircular.new(root, {
        innerRadius: -40
    });

    axisRenderer.grid.template.setAll({
        stroke: root.interfaceColors.get("background"),
        visible: true,
        strokeOpacity: 0
    });

    var xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        max: 100,
        strictMinMax: true,
        renderer: axisRenderer
    }));


// Add clock hand
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Clock_hands
    var axisDataItem = xAxis.makeDataItem({});

    var clockHand = am5radar.ClockHand.new(root, {
        pinRadius: am5.percent(20),
        radius: am5.percent(100),
        bottomWidth: 40
    })

    var bullet = axisDataItem.set("bullet", am5xy.AxisBullet.new(root, {
        sprite: clockHand
    }));

    xAxis.createAxisRange(axisDataItem);

    var label = chart.radarContainer.children.push(am5.Label.new(root, {
        fill: am5.color(0x000000),
        centerX: am5.percent(50),
        textAlign: "center",
        centerY: am5.percent(50),
        fontSize: "14pt"
    }));

    axisDataItem.set("value", 50);
    bullet.get("sprite").on("rotation", function () {
        var value = axisDataItem.get("value");
        var text = Math.round(axisDataItem.get("value")).toString();
        var fill = am5.color(0x000000);
        xAxis.axisRanges.each(function (axisRange) {
            if (value >= axisRange.get("value") && value <= axisRange.get("endValue")) {
                fill = axisRange.get("axisFill").get("fill");
            }
        })

        label.set("text", Math.round(value).toString());

        clockHand.pin.animate({ key: "fill", to: fill, duration: 500, easing: am5.ease.out(am5.ease.cubic) })
        clockHand.hand.animate({ key: "fill", to: fill, duration: 500, easing: am5.ease.out(am5.ease.cubic) })
    });

    setInterval(function () {
        axisDataItem.animate({
            key: "value",
            to: Math.round(Math.random() * 100 - 0),
            duration: 500,
            easing: am5.ease.out(am5.ease.cubic)
        });
    }, 2000)

    chart.bulletsContainer.set("mask", undefined);


// Create axis ranges bands
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Bands
    var bandsData = [{
        title: "BAIXO",
        color: "#ee1f25",
        lowScore: 0,
        highScore: 40
    }, {
        title: "MÉDIO",
        color: "#f3eb0c",
        lowScore: 40,
        highScore: 70
    }, {
        title: "ALTO",
        color: "#0f9747",
        lowScore: 70,
        highScore: 100
    }];

    am5.array.each(bandsData, function (data) {
        var axisRange = xAxis.createAxisRange(xAxis.makeDataItem({}));

        axisRange.setAll({
            value: data.lowScore,
            endValue: data.highScore
        });

        axisRange.get("axisFill").setAll({
            visible: true,
            fill: am5.color(data.color),
            fillOpacity: 0.8
        });

        axisRange.get("label").setAll({
            text: data.title,
            inside: true,
            radius: 15,
            fontSize: "0.9em",
            fill: am5.color(0x000000)
        });
    });


// Make stuff animate on load
    chart.appear(1000, 100);

}