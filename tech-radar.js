//
// Heavily inspired by radar chart from Nadieh Bremer //
//
const cfg = {
    w: 600,				//Width of the circle
    h: 600,				//Height of the circle
    margin: {top: 10, right: 20, bottom: 10, left: 10}, //The margins of the SVG
    levels: 5,				//How many levels or inner circles should there be drawn
    labelFactor: 1.1, 	//How much farther than the radius of the outer circle should the labels be placed
    dotRadius: 15, 			//The size of the colored circles of each blog
    color: d3.schemeCategory10	//Color function
};

const grey = '#868e96';
const orange = '#ec7b1a';
const yellow = '#ffab00';
const blue = '#a5c5e8';
const brown = '#847575';

const colors = [
    orange, yellow, blue, brown
];

function RadarChart(id, data) {

    const axisLabels = ['', 'Adopt', 'Trail', 'Assess', 'Hold'].reverse();

    const allAxis = (d3.keys(data)),           	//Names of each axis
        total = allAxis.length,					//The number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2), 	//Radius of the outermost circle
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, 1]);

    d3.select("body .container")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 1);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    //Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();

    //Initiate the radar chart SVG
    let width = cfg.w + cfg.margin.left + cfg.margin.right;
    let height = cfg.h + cfg.margin.top + cfg.margin.bottom;
    const svg = d3.select(id).append("svg")
        .attr('id', 'radarChart')
        .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");


    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, cfg.levels).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function (d) {
            return radius / cfg.levels * (d + 1);
        })
        .style("fill", "transparent")
        .style("stroke", grey)
        .style("stroke-dasharray", "5,5");

    //Text indicating each stage
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", function (d) {
            return -(d === 2 ? 0 : d - 1) * radius / cfg.levels - 12;
        })
        .attr("dy", "0.4em")
        .text((d, i) => axisLabels[i]);

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", grey)
        .style("stroke-width", "1px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function (d, i) {
            return rScale(cfg.labelFactor) * Math.cos(angleSlice * (i - 1) - Math.PI / 4);
        })
        .attr("y", function (d, i) {
            return rScale(cfg.labelFactor) * Math.sin(angleSlice * (i - 1) - Math.PI / 4);
        })
        .text(function (d) {
            return d.name;
        });

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////
    enrichData(data);

    // Create a dot for each technology in it's sector
    g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper")
        .each(function (techSectionData, c) {

            const radarCircle = d3.select(this).selectAll('.radarCircle')
                .data(techSectionData.items)
                .enter()
                .append("g")
                .attr("transform", function (innerData) {
                    const position = determinePosition(c, techSectionData.circleCounts[innerData.circle], innerData.idInCircle);
                    const scaleParam = determineScaleForSingleDot(innerData.circle, cfg, radius);

                    const x = rScale(scaleParam) * Math.cos(position - Math.PI / 2);
                    const y = rScale(scaleParam) * Math.sin(position - Math.PI / 2);

                    return `translate(${x}, ${y})`;
                })
                .attr("class", "tech-circle")
                .on("click", handleClick)
                .on("mouseover", function(d) {
                    toggleActive(this, true);

                    const tooltip = d3.select(".tooltip");

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);

                    tooltip
                        .classed('legend-'+techSectionData.name.toLowerCase(), true)
                        .classed('active', true);

                    tooltip.html(d.tooltipText)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 50) + "px");
                })
                .on("mouseout", function(d) {
                    toggleActive(this, false);

                    const tooltip = d3.select(".tooltip");

                    tooltip
                    .classed('legend-'+techSectionData.name.toLowerCase(), false)
                    .classed('active', false);
                });

            radarCircle.append('circle')
                .attr("class", "radarCircle")
                .attr("r", cfg.dotRadius)
                .style("fill", colors[c])
                .style("fill-opacity", 0.8)
                .append("title").text(d => d.name);

            radarCircle
                .append('a')
                .attr('href', () => `#${techSectionData.name}`)
                .append("text").text(data => data.number)
                .attr("class", "dot")
                .attr("fill", "white")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central");

        });
}

function drawLegend(data, side) {

    const legendSection = d3.select(".container .legend-"+side)
        .selectAll('div.legend')
        .data(data)
        .enter()
        .append("div")
        .attr('class', d => `legend legend-${d.name.toLowerCase()}`);

    // append the heading
    legendSection
        .append("h3").text(d => d.name)
        .attr('id', d => d.name);

    // append the list
    legendSection.append("ol")
        .attr('start', d => d.items[0].number)
        .selectAll('li')
        .data(d => d.items)
        .enter()
        .append("li")
        .append("a")
        .attr("href", '#radarChart')
        .on("click", handleClick)
        .text(d => d.name);
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
    let technologyNumber = 1;
    data.forEach(function (section) {
        section.circleCounts = {1: 0, 2: 0, 3: 0, 4: 0};
        section.items.sort((a, b) => a.circle - b.circle);
        section.items.forEach(function (technology) {
            technology.idInCircle = ++section.circleCounts[technology.circle];
            technology.number = technologyNumber++;
        });

    });
}

function determinePosition(quarter, dotCountInArea, dotNumber) {
    const quarterStart = (Math.PI / 2) * (quarter - 1);
    const quarterEnd = (Math.PI / 2) * (quarter);

    const quarterSize = quarterEnd - quarterStart;
    const quarterSpacePerDot = quarterSize / (dotCountInArea + 1);

    return quarterStart + (quarterSpacePerDot * dotNumber);
}

function determineScaleForSingleDot(level, cfg, radius) {
    const halfCircleSizeInRelationToScale = (cfg.dotRadius / radius) / 2;
    const oneCirclesShareOfScale = 1 / cfg.levels;

    const beginOfScale = halfCircleSizeInRelationToScale;
    const endOfScale = oneCirclesShareOfScale - halfCircleSizeInRelationToScale;

    // If we have level 1, then draw on circle 0 or 1
    level = level === 1 ? getRandomArbitrary(0, 1) : level;

    const randomPointOnShareOfScale = getRandomArbitrary(beginOfScale, endOfScale);
    return ((level + 1) * oneCirclesShareOfScale) - randomPointOnShareOfScale;
}

function handleClick() {
    // First remove all click-handlers
    d3.selectAll('.clicked')
        .classed('clicked', false);

    const technology = d3.select(this).datum();

    d3.selectAll('.tech-circle')
        .filter(d => d === technology)
        .classed('clicked', true);

    d3.selectAll(`.legend li`)
        .filter(d => d === technology)
        .classed('clicked', true);

    // follow the href
    return true;
}

function toggleActive(element, active) {
    d3.select(element)
        .classed('active', active);

    d3.select(".tooltip")
        .classed('active', active);

    d3.selectAll(`li`)
        .filter(d => d === d3.select(element).datum())
        .classed('active', active);
}