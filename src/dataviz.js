const width = 960; //3000;
const height = 600; //1250;

var projection = d3
	.geoMercator()
	.center([0, 15])
	.scale(width / (2 * Math.PI))
	.translate([width / 2, height / 2]);

var path = d3
	.geoPath()
	.projection(projection);

// var div = document.getElementById("map-holder")

var svg = d3
	.select("#map-holder")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	// .attr("width", $("#map-holder").width())
	// .attr("height", $("#map-holder").height())

var infoLabel = d3
	.select("body")
	.append("div")
	.attr("class", "hidden infoLabel");

var world;
var corruption = {};

d3.json("data/world.json")
	.then((data) => {
		world = data;
		return d3.csv("data/corruption.csv");
	})
	.then((data) => {
		var max  = 0;
		for (var i = 0; i < data.length; ++i) {
			corruption[data[i].Jurisdiction] = parseFloat(data[i]["2005"]);
		}

		console.log(corruption);
		var countriesGroup = svg
			.append("g")
			.attr("id", "map");

		countriesGroup
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height);

		var countries = countriesGroup
			.selectAll("path")
			.data(world.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", (d) => {
			   return "country" + d.id;
			})
			.attr("class", "country")
			.on("mousemove", (d) => {
				var left = d3.event.pageX + 50;
				var top = d3.event.pageY;
				var corruptionData = corruption[d.properties.name];
				if (isNaN(corruptionData))
					corruptionData = "Info Manquante";
				infoLabel
					.classed("hidden", false)
					.attr("style", "left:" + left + "px; top:" + top + "px")
					.html("<b>" + d.properties.name + "</b>"
						+ "<br>Corruption : " + corruptionData);
					
			 })
			 .on("mouseout", (d) => {
				infoLabel.classed("hidden", true);
			 })
	});
