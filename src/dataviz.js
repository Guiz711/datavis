const width = 960; //3000;
const height = 600; //1250;

//Color scale
var shades_red = ["#ffe6e6", "#ffcccc", "#ffb3b3", "#ff9999", "#ff8080", "#ff6666", "#ff4d4d", "#ff3333", "#ff1a1a", "#ff0000", "#e60000", "#cc0000", "#b30000", "#990000", "#800000", "#660000", /*"#004d00", "#003300"*/];
shades_red = shades_red.reverse();

var colors = d3
	.scaleQuantize()
	.domain([0, 100])
	.range(shades_red);

//Map generation
var projection = d3
	.geoMercator()
	.center([0, 15])
	.scale(width / (2 * Math.PI))
	.translate([width / 2, height / 2]);

var path = d3
	.geoPath()
	.projection(projection);

var svg = d3
	.select("#map-holder")
	.append("svg")
	.attr("width", width)
	.attr("height", height)

var infoLabel = d3
	.select("body")
	.append("div")
	.attr("class", "hidden infoLabel");

var world;
var countries;
var corruption = {};

d3.json("data/world.json")
	.then((data) => {
		world = data;
		return d3.csv("data/corruption.csv");
	})
	.then((data) => {
		for (var i = 0; i < data.length; ++i) {
			corruption[data[i].ISO] = data[i];
			for(var property in corruption[data[i].ISO]) {
				var date = parseInt(property);
				if (!isNaN(date)) {
					corruption[data[i].ISO][property] = parseFloat(corruption[data[i].ISO][property]);
					if (date < 2012)
						corruption[data[i].ISO][property] = Math.round(corruption[data[i].ISO][property] * 10);
				}
			}
		}

		var countriesGroup = svg
			.append("g")
			.attr("id", "map");

		countriesGroup
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height);

		countries = countriesGroup
			.selectAll("path")
			.data(world.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", (d) => {
			   return "country" + d.id;
			})
			.attr("class", "country")
			.style("fill", (d) => {
				if (!corruption.hasOwnProperty(d.id) || isNaN(corruption[d.id][sliderTime.value()]))
					return "#d0d0d0";
				else
					return colors(corruption[d.id][sliderTime.value()]);
			})
			.on("mousemove", (d) => {
				var left = d3.event.pageX + 50;
				var top = d3.event.pageY;

				var corruptionData = "Info Manquante";
				if (corruption.hasOwnProperty(d.id) && !isNaN(corruption[d.id][sliderTime.value()]))
					corruptionData = corruption[d.id][sliderTime.value()];

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

//Date slider
var dataTime = d3.range(0, 19).map(function(d) {
	return (1998 + d);
});
	
var sliderTime = d3
	.sliderBottom()
	.min(d3.min(dataTime))
	.max(d3.max(dataTime))
	.step(1)
	.width(500)
	.tickFormat(d3.format("4"))
	.tickValues(dataTime)
	.default("1998")
	.on('onchange', val => {
		d3.select('p#value-time').text(val);
		countries.style("fill", (d) => {
			if (!corruption.hasOwnProperty(d.id) || isNaN(corruption[d.id][sliderTime.value()]))
				return "#d0d0d0";
			else
				return colors(corruption[d.id][sliderTime.value()]);
		});
	});

var gTime = d3
	.select('div#slider-time')
	.append('svg')
	.attr('width', 700)
	.attr('height', 100)
	.append('g')
	.attr('transform', 'translate(30,30)');

gTime.call(sliderTime);

d3.select('p#value-time').text(sliderTime.value());
