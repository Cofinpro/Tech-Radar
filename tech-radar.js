//
// Heavily inspired by radar chart from Nadieh Bremer //
//	
function RadarChart(id, data) {
	var cfg = {
		w: 600,				//Width of the circle
		h: 600,				//Height of the circle
		margin: { top: 20, right: 40, bottom: 20, left: 20 }, //The margins of the SVG
		levels: 5,				//How many levels or inner circles should there be drawn
		labelFactor: 1.1, 	//How much farther than the radius of the outer circle should the labels be placed
		opacityArea: 0.35, 	//The opacity of the area of the blob
		dotRadius: 10, 			//The size of the colored circles of each blog
		opacityCircles: 0.2, 	//The opacity of the circles of each blob
		color: d3.schemeCategory10	//Color function
	};

	var axisLabels = ['', 'Adopt', 'Trail', 'Assess', 'Hold'].reverse();

	var allAxis = (d3.keys(data)),           	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w / 2, cfg.h / 2), 	//Radius of the outermost circle
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

	//Scale for the radius
	var rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, 1]);

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();

	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
		.attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
		.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
		.attr("class", "radar" + id);

	var g = svg.append("g")
		.attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");


	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////

	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");

	//Draw the background circles
	axisGrid.selectAll(".levels")
		.data(d3.range(1, (cfg.levels + 1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function (d, i) { return radius / cfg.levels * d; })
		.style("fill", "#CDCDCD")
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", cfg.opacityCircles)

	//Text indicating each stage
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1, (cfg.levels + 1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", function (d) { return -(d - 1) * radius / cfg.levels - 10; })
		.attr("dy", "0.4em")
		.style("font-size", "12px")
		.attr("fill", "#737373")
		.text(function (d, i) { return axisLabels[i]; });

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function (d, i) { return rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2); })
		.attr("y2", function (d, i) { return rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2); })
		.attr("class", "line")
		.style("stroke", "white")
		.style("stroke-width", "2px");

	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "14px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function (d, i) { return rScale(cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 4); })
		.attr("y", function (d, i) { return rScale(cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 4); })
		.text(function (d) { return d; });

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////

	console.log(data)

	enrichData(data);

	console.log(data)

	// Create a dot for each technology in it's sector
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper")
		.each(function (d, c) {
			d3.select(this).selectAll('.radarCircle')
				.data(d.items)
				.enter()
				.append('circle')
				.attr("class", "radarCircle")
				.attr("r", cfg.dotRadius)
				.attr("cx", function (innerData, i) {

					var position = determinePosition(c, d.circleCounts[innerData.circle], innerData.number);
					var scaleParam = determineScaleForSingleDot(innerData.circle, cfg, radius);

					return rScale(scaleParam) * Math.cos(position - Math.PI / 2);
				})
				.attr("cy", function (innerData, i) {

					var position = determinePosition(c, d.circleCounts[innerData.circle], innerData.number);
					var scaleParam = determineScaleForSingleDot(innerData.circle, cfg, radius);

					return rScale(scaleParam) * Math.sin(position - Math.PI / 2);
				})
				.style("fill", function (d, i, j) { return cfg.color[c]; })
				.style("fill-opacity", 0.8)
				.append("title").text(function (d) { return d.name; });
		});
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function enrichData(data) {
	for (var i = 0; i < data.length; i++) {

		var circleMap = {};

		for (var j = 0; j < data[i].items.length; j++) {
			if (circleMap[data[i].items[j].circle] === undefined) {
				circleMap[data[i].items[j].circle] = 1;
				data[i].items[j].number = 1;
			} else {
				data[i].items[j].number = circleMap[data[i].items[j].circle] + 1;
				circleMap[data[i].items[j].circle] = circleMap[data[i].items[j].circle] + 1;
			}
		}
		data[i].circleCounts = circleMap;
	}
}

function determinePosition(quarter, dotCountInArea, dotNumber) {

	var quarterStart = (Math.PI / 2) * quarter;
	var quarterEnd = (Math.PI / 2) * (quarter + 1);

	var quarterSize = quarterEnd - quarterStart;
	var quarterSpacePerDot = quarterSize / (dotCountInArea + 1);

	var position = quarterStart + (quarterSpacePerDot * dotNumber);

	return position;
}

function determineScaleForSingleDot(level, cfg, radius) {

	var halfCircleSizeInRelationToScale = (cfg.dotRadius / radius) / 2;
	var oneCirclesShareOfScale = 1 / cfg.levels;

	var beginOfScale = 0 + halfCircleSizeInRelationToScale;
	var endOfScale = oneCirclesShareOfScale - halfCircleSizeInRelationToScale;

	var randomPointOnShareOfScale = getRandomArbitrary(beginOfScale, endOfScale);
	var scaleParam = ((level + 1) * oneCirclesShareOfScale) - randomPointOnShareOfScale;

	return scaleParam;
}