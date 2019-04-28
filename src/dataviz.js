const width = 960;
const height = 600;

//Color scales
var shades_red = ["#ffe6e6", "#ffcccc", "#ffb3b3", "#ff9999", "#ff8080", "#ff6666", "#ff4d4d", "#ff3333", "#ff1a1a", "#ff0000", "#e60000", "#cc0000", "#b30000", "#990000", "#800000", "#660000", /*"#004d00", "#003300"*/];
shades_red = shades_red.reverse();

var shades_basel2 = ["#e5feff", "#d1f0f6", "#a9d1e5", "#80B3D3", "#5995C2", "#2CA02C"];

var colorsCorruption = d3
	.scaleQuantize()
	.domain([0, 100])
	.range(shades_red);

var colorsBasel2 = d3
	.scaleQuantize()
	.domain([0, 10])
	.range(shades_basel2);

//Map generation
var projection = d3
	.geoMercator()
	.center([0, 15])
	.scale(width / (2 * Math.PI))
	.translate([width / 2, height / 2]);

var path = d3
	.geoPath()
	.projection(projection);

var svgCorruption = d3
	.select("#corruption-map-holder")
	.append("svg")
	.attr("width", width)
	.attr("height", height)

var svgBasel2 = d3
	.select("#basel2-map-holder")
	.append("svg")
	.attr("width", width)
	.attr("height", height)

var svgInstitutions = d3
	.select("#institutions-map-holder")
	.append("svg")
	.attr("width", width)
	.attr("height", height)

var infoLabel = d3
	.select("body")
	.append("div")
	.attr("class", "hidden infoLabel");

var world;
var countriesCorruption;
var corruption = {};
var countriesBasel2;
var basel2 = {};
var banks = {};
var institutions = {};
var bri = {};
var ocde = {};
var bale = {};
var csf = {};
var fmi = {};
var gafi = {};

d3.json("data/world.json")
	.then(data => {
		world = data;
		return d3.csv("data/corruption.csv");
	})
	// Corruption map
	.then(data => {
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

		var countriesGroup = svgCorruption
			.append("g")
			.attr("id", "corruption-map");

		countriesGroup
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height);

		countriesCorruption = countriesGroup
			.selectAll("path")
			.data(world.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", (d) => {
			   return "corruption-country" + d.id;
			})
			.attr("class", "country")
			.on("mousemove", (d) => {
				d3.select("#corruption-country" + d.id)
					.style("stroke-width", 2);

				var left = d3.event.pageX + 50;
				var top = d3.event.pageY;

				var corruptionData = "Info Manquante";
				if (corruption.hasOwnProperty(d.id) && !isNaN(corruption[d.id][sliderTime.value()]))
					corruptionData = corruption[d.id][sliderTime.value()];

				infoLabel
					.classed("hidden", false)
					.attr("style", "left:" + left + "px; top:" + top + "px")
					.html("<b>" + d.properties.name + "</b>"
						+ "<br>Corruption: " + corruptionData);
					
			})
			.on("mouseout", (d) => {
				infoLabel.classed("hidden", true);
				d3.select("#corruption-country" + d.id)
					.style("stroke-width", 1);
			})

		setCorruptionColor(countriesCorruption);

		return d3.csv("data/Basel-II-components-2015.csv");
	})
	//Basel II map
	.then(data => {
		for (var i = 0; i < data.length; ++i) {
			basel2[data[i].ISO] = data[i];
		}
		return d3.csv("data/Banques-systémiques.csv");		
	})
	.then(data => {
		var countriesGroup = svgBasel2
			.append("g")
			.attr("id", "map-basel2");

		countriesGroup
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height);

		countriesBasel2 = countriesGroup
			.selectAll("path")
			.data(world.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", (d) => {
			   return "basel2-country" + d.id;
			})
			.attr("class", "country")
			.on("mousemove", (d) => {
				d3.select("#basel2-country" + d.id)
					.style("stroke-width", 2);

				if (!basel2.hasOwnProperty(d.id))
					return;

				var left = d3.event.pageX + 50;
				var top = d3.event.pageY;

				var legend = "";
				if (basel2[d.id]["Credit risk"] != "")
					legend += "<br>Credit risk: " + basel2[d.id]["Credit risk"];
				if (basel2[d.id]["Operational risk"] != "")
					legend += "<br>Operational risk: " + basel2[d.id]["Operational risk"];
				if (basel2[d.id]["Market risk"] != "")
					legend += "<br>Market risk: " + basel2[d.id]["Market risk"];
				if (basel2[d.id]["Pillar II"] != "")
					legend += "<br>" + basel2[d.id]["Pillar II"];
				if (basel2[d.id]["Pillar III"] != "")
					legend += "<br>" + basel2[d.id]["Pillar III"];

				infoLabel
					.classed("hidden", false)
					.attr("style", "left:" + left + "px; top:" + top + "px")
					.html("<b>" + d.properties.name + "</b>" + legend);
					
			})
			.on("mouseout", (d) => {
				infoLabel.classed("hidden", true);
				d3.select("#basel2-country" + d.id)
					.style("stroke-width", 1);
			})

		var bankLocations = {};
		for (var i = 0; i < data.length; ++i) {
			if (banks.hasOwnProperty(data[i]["Siège social"]))
				banks[data[i]["Siège social"]].push(data[i]);
			else
				banks[data[i]["Siège social"]] = [data[i]];
			// bankLocations.push([data[i].Longitude, data[i].Latitude]);
		}
		console.log(banks);

		svgBasel2.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", function (d) { console.log(projection([d.Longitude, d.Latitude])); return projection([d.Longitude, d.Latitude])[0]; })
			.attr("cy", function (d) { return projection([d.Longitude, d.Latitude])[1]; })
			.attr("r", "5px")
			.attr("fill", "red")
			.on("mousemove", (d) => {
				var left = d3.event.pageX + 50;
				var top = d3.event.pageY;

				var legend = "";
				var localBanks = banks[d["Siège social"]];
				for (var i = 0; i < localBanks.length; ++i) {
					legend += "<b>" + localBanks[i]["Systemic bank"] + "</b>";
					legend += "<br>Bucket: " + localBanks[i].Bucket + "<br>";
				}


				infoLabel
					.classed("hidden", false)
					.attr("style", "left:" + left + "px; top:" + top + "px")
					.html(legend);
					
			})
			.on("mouseout", (d) => {
				infoLabel.classed("hidden", true);
			})
		
		setBasel2Color(countriesBasel2);
	})
	.then()

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
		setCorruptionColor(countriesCorruption);
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

//Update countries color
function setCorruptionColor(countries) {
	countries.style("fill", (d) => {
		if (!corruption.hasOwnProperty(d.id) || isNaN(corruption[d.id][sliderTime.value()]))
			return "#d0d0d0";
		else
			return colorsCorruption(corruption[d.id][sliderTime.value()]);
	});
}

function setBasel2Color(countries) {
	countries.style("fill", (d) => {
		if (!basel2.hasOwnProperty(d.id))
			return "#d0d0d0";
		else
			return colorsBasel2(basel2[d.id].Statute);
	});
}
