function generateBubbleChart(divId, allEvc) {

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

    for(var evcData of allEvc) {
        var value = (evcData.evc * 100).toFixed(0);
        data.children.push({ id: evcData.id, userName: evcData.label, name: `${evcData.label}\n[bold]${value}[/]`, value: value });
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
            dataField: "value",
            valueField: "value",
            categoryField: "name",
            childDataField: "children",
            manyBodyStrength: -13,
            centerStrength: 0.8
        })
    );

    series.nodes.template.setAll({
        cursorOverStyle: "pointer",
        tooltipText: `{userName}: [bold]{value}[/]`
    });

    series.circles.template.adapters.add("radius", function(radius, target) {
        return Math.max(target.dataItem.dataContext.value, 10);
    });

    series.labels.template.setAll({
        fill: am5.color(0x000000),
        minScale: 0.5,
        textAlign: "center",
        isMeasured: true,
        oversizedBehavior: "none"
    });

    series.data.setAll([data]);

    series.appear(1000, 100);

}