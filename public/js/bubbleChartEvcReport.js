function generateGaugeChart(divId, allEvc) {

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

    var data = {
        value: -1,
        children: []
    }

    allEvc = Array.from(allEvc);

    console.log(JSON.stringify(allEvc, null, "\t"));

    for(var evcData of allEvc) {
        console.log("entrou");
        data.children.push({ name: evcData.label, value: evcData.evc * 100 });
    }

    var container = root.container.children.push(
        am5.Container.new(root, {
            width: am5.percent(100),
            height: am5.percent(100),
            layout: root.verticalLayout
        })
    );

    var series = container.children.push(
        am5hierarchy.ForceDirected.new(root, {
            singleBranchOnly: false,
            downDepth: 1,
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

    series.circles.template.set("forceHidden", true);
    series.outerCircles.template.set("forceHidden", true);

    series.nodes.template.setup = function(target) {
        target.events.on("dataitemchanged", function(ev) {
            var icon = target.children.push(am5.Picture.new(root, {
                width: ev.target.dataItem.dataContext.value,
                height: ev.target.dataItem.dataContext.value,
                centerX: am5.percent(50),
                centerY: am5.percent(50),
                //src: ev.target.dataItem.dataContext.image,
                // src: "https://assets.codepen.io/t-160/star.svg",
                src: "/img/student-avatar-bubble.png",
            }));
        });
    }

    series.labels.template.setAll({
        fill: am5.color(0x000000),
        y: 45,
    });

    series.data.setAll([data]);

    series.appear(1000, 500);

}