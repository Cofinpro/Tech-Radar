//
// Heavily inspired by radar chart from Nadieh Bremer //
//
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

function RadarChart(id, data) {

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
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
			.attr("class", "radar"+id);

	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
	

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
		.style("stroke", "#a9c5e8")
		.style("stroke-dasharray", "5,5")
		.style("fill-opacity", 0)

	//Text indicating each stage
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1, (cfg.levels + 1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", function (d) { return -(d - 1) * radius / cfg.levels - 10; })
		.attr("dy", "0.4em")
		.style("font-size", "12px")
		.attr("fill", "#ec7b1a")
		.text(function (d, i) { return axisLabels[i]; });

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(data)
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
		.style("stroke", "#a9c5e8")
		.style("stroke-width", "1px");

	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "14px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/4); })
		.attr("y", function(d, i){ return rScale(cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/4); })
		.text(function(d){ return d.name; });

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

			var radarCircle = d3.select(this).selectAll('.radarCircle')
				.data(d.items)
				.enter()
                .append("g")
                .attr("transform", function(innerData) {
                    var position = determinePosition(c, d.circleCounts[innerData.circle], innerData.idInCircle);
                    var scaleParam = determineScaleForSingleDot(innerData.circle, cfg, radius);

                    var x = rScale(scaleParam) * Math.cos(position - Math.PI / 2);
                    var y = rScale(scaleParam) * Math.sin(position - Math.PI / 2);

                    return "translate(" + x + "," + y + ")";
                })
                .attr("class", "tech-circle")
                .attr("data-technology", function(d) {return encodeURI(d.name.toLowerCase())})
                .on("mouseover", handleMouseOver)
        		.on("mouseout", handleMouseOut);

            radarCircle.append('circle')
				.attr("class", "radarCircle")
				.attr("r", cfg.dotRadius)
				.style("fill", function (d, i, j) { return cfg.color[c]; })
				.style("fill-opacity", 0.8)
				.append("title").text(function (d) { return d.name; });

            radarCircle
                .append("text").text(function (data) {
                    return data.number;
                })
                .attr("fill", "white")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central");

		});

	drawLegend(data);
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

/**
 * Assign a number to each technology and calculate the total number of technologies
 * per section and circle.
 */
function enrichData(data) {
	data.forEach(function(section) {
		section.circleCounts = {1:0, 2:0, 3:0, 4:0};
		section.items.forEach(function(technology, index) {
            technology.idInCircle = ++section.circleCounts[technology.circle];
            technology.number = index+1;
		});
    });
}

function drawLegend(data) {

    var legendSection = d3.select('.container')
        .selectAll('div')
        .data(data)
        .enter()
        .append("div")
		.attr('class', function(d) {console.log(d);return 'legend-'+d.name.toLowerCase()});

    // append the heading
    legendSection.append("h2").text(function (d) {
        return d.name;
	})
	.style("color", function (d, i) { return cfg.color[i]; });

    // append the list
    legendSection.append("ol")
        .selectAll('li')
        .data(function(d) { return d.items; })
        .enter()
        .append("li")
        .attr("data-technology", function(d) {return encodeURI(d.name.toLowerCase())})
		.text(function (d) { return d.name });
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

function handleMouseOut() {

    var technology = d3.select(this)
        .attr("data-technology");

    d3.select(this)
        .select('circle')
		.attr('r',cfg.dotRadius)
        .attr('class', 'radarCircle');

    d3.select("li[data-technology='"+technology+"']")
        .attr('class', '');
}

function handleMouseOver() {

    var technology = d3.select(this)
        .attr("data-technology");

    d3.select(this)
		.select('circle')
		.attr('class', 'radarCircle active');

    d3.select("li[data-technology='"+technology+"']")
		.attr('class', 'active');
}
