function generateGaugeChart(divId, evc1, evc2, colors, caption1, caption2, hideData1) {

    // am5.array.each(am5.registry.rootElements,
    //     function(root) {
    //         if (root.dom.id == divId) {
    //             root.dispose();
    //         }
    //     }
    // );

    var root = am5.Root.new(divId);

    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var chart = root.container.children.push(am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: 160,
        endAngle: 380
    }));

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

    var color1 = am5.color(colors[0]);

    var axisRenderer1 = am5radar.AxisRendererCircular.new(root, {
        radius: -10,
        stroke: color1,
        strokeOpacity: 0,
        strokeWidth: 6,
        inside: true
    });

    axisRenderer1.grid.template.setAll({
        forceHidden: true
    });

    axisRenderer1.ticks.template.setAll({
        stroke: color1,
        visible: true,
        length: 10,
        strokeOpacity: 1,
        inside: true
    });

    axisRenderer1.labels.template.setAll({
        radius: 15,
        inside: true
    });

    var axisDataItem1 = xAxis.makeDataItem({
        value: 0,
        fill: color1,
        name: caption1 + " | " + evc1
    });

    var clockHand1 = am5radar.ClockHand.new(root, {
        pinRadius: 14,
        radius: am5.percent(98),
        bottomWidth: 10
    });

    clockHand1.pin.setAll({
        fill: color1
    });

    clockHand1.hand.setAll({
        fill: color1
    });

    var bullet1 = axisDataItem1.set("bullet", am5xy.AxisBullet.new(root, {
        sprite: clockHand1
    }));

    xAxis.createAxisRange(axisDataItem1);

    axisDataItem1.get("grid").set("forceHidden", true);
    axisDataItem1.get("tick").set("forceHidden", true);

    var color2 = am5.color(colors[1]);

    var axisRenderer2 = am5radar.AxisRendererCircular.new(root, {
        stroke: color2,
        strokeOpacity: 0,
        strokeWidth: 6
    });

    axisRenderer2.grid.template.setAll({
        forceHidden: true
    });

    axisRenderer2.ticks.template.setAll({
        stroke: color2,
        visible: true,
        length: 10,
        strokeOpacity: 1
    });

    axisRenderer2.labels.template.setAll({
        radius: 15
    });

    var axisDataItem2 = xAxis.makeDataItem({
        value: 0,
        fill: color2,
        name: caption2 + " | " + evc2
    });

    var clockHand2 = am5radar.ClockHand.new(root, {
        pinRadius: 10,
        radius: am5.percent(98),
        bottomWidth: 10
    });

    clockHand2.pin.setAll({
        fill: color2
    });

    clockHand2.hand.setAll({
        fill: color2
    });

    var bullet2 = axisDataItem2.set("bullet", am5xy.AxisBullet.new(root, {
        sprite: clockHand2
    }));

    xAxis.createAxisRange(axisDataItem2);

    axisDataItem2.get("grid").set("forceHidden", true);
    axisDataItem2.get("tick").set("forceHidden", true);

    var legend = chart.children.push(am5.Legend.new(root, {}));
    legend.data.setAll([axisDataItem1, axisDataItem2]);
    legend.valueLabels.template.set("forceHidden", true);

    legend.labels.template.setAll({
        fontSize: 12,
        fontWeight: "400"
    });

    var value1 = evc1;
    axisDataItem1.animate({
        key: "value",
        to: value1,
        duration: 1000,
        easing: am5.ease.out(am5.ease.cubic)
    });
    var value2 = evc2;
    axisDataItem2.animate({
        key: "value",
        to: value2,
        duration: 1000,
        easing: am5.ease.out(am5.ease.cubic)
    });

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

    chart.appear(1000, 100);

    if(hideData1) setTimeout(()=>{axisDataItem1.hide();}, 1);

}