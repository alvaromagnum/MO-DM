am5.ready(function() {

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    var data = {
        value: 0,
        children: []
    }

    for (var i = 0; i < 15; i++) {
        data.children.push({ name: "node " + i, value: Math.floor(Math.random() * 101) })
    }

// Create wrapper container
    var container = root.container.children.push(
        am5.Container.new(root, {
            width: am5.percent(100),
            height: am5.percent(100),
            layout: root.verticalLayout
        })
    );

// Create series
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Adding
    var series = container.children.push(
        am5hierarchy.ForceDirected.new(root, {
            singleBranchOnly: false,
            downDepth: 2,
            topDepth: 1,
            initialDepth: 1,
            maxRadius: 60,
            minRadius: 20,
            valueField: "value",
            categoryField: "name",
            childDataField: "children",
            manyBodyStrength: -13,
            centerStrength: 0.8
        })
    );

// Hide circles
    series.circles.template.set("forceHidden", true);
    series.outerCircles.template.set("forceHidden", true);

// Add an icon to node
    series.nodes.template.setup = function(target) {
        target.events.on("dataitemchanged", function(ev) {
            console.log(ev.target.dataItem.dataContext);
            var icon = target.children.push(am5.Picture.new(root, {
                width: ev.target.dataItem.dataContext.value,
                height: ev.target.dataItem.dataContext.value,
                centerX: am5.percent(50),
                centerY: am5.percent(50),
                //src: ev.target.dataItem.dataContext.image
                src: "https://assets.codepen.io/t-160/star.svg"
            }));
        });
    }

    series.labels.template.setAll({
        fill: am5.color(0x000000),
        y: 45,
    });

    series.data.setAll([data]);

// Make stuff animate on load
    series.appear(1000, 100);

}); // end am5.ready()