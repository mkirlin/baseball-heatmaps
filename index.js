// TODO: Rewrite every for loop into a .map()

$(function() {
    drawGraph();
    $(":checkbox").change(function(){
        drawGraph();
    });
    $( window ).resize(function() {
        drawGraph();
    });
});

function drawGraph() {
    Plotly.d3.json("lester.json", function(pitches) {
        var filters = getPitchFilters()
        var filteredPitches = filterPitches(pitches, filters)
        var x_vals = getVals(filteredPitches, "x")
        var y_vals = getVals(filteredPitches, "y")

        var trace1 = {
            x: x_vals,
            y: y_vals,
            mode: "markers",
            type: "scatter",
            name: "",
            marker: {
                color: "rgb(102,0,0)",
                size: 5,
                opacity: 0.3,
                symbol: determineSymbols(filteredPitches)
            },
        };

        var trace2 = {
            x: x_vals,
            y: y_vals,
            // colorscale: "YIGnBu",
            colorscale: "Hot",
            name: "density",
            reversescale: true,
            showscale: false,
            type: "histogram2dcontour"
        };

        availableGraphs = {
            "scattergram": trace1,
            "contour": trace2
        }

        var data = getRequestedGraphs(availableGraphs);

        var layout = {
            showlegend: false,
            hovermode: "closest",
            margin: {
                t: 10
            },
            xaxis: {
                autorange: true,
                dtick: 1,
            },
            yaxis: {
                rangemode: "nonnegative",
                autorange: true,
                dtick: 1,
            },
            shapes: [
                // 1st highlight during Feb 4 - Feb 6
                {
                    type: "rect",
                    // x-reference is assigned to the x-values
                    xref: "x",
                    // y-reference is assigned to the plot paper [0,1]
                    yref: "y",
                    x0: -.71,
                    y0: 1.5,
                    x1: .71,
                    y1: 3.5,
                    opacity: 1,
                    line: {
                        width: 3
                    }
                }
            ]

        };

        Plotly.purge("heatmap");
        Plotly.plot("heatmap", data, layout)
    });
}

function getPitchFilters() {
    return $(".pitch-filters:checked").map(function() {
        return this.value;
    });
}

function getGraphFilters() {
    return $(".graph-filters:checked").map(function() {
        return this.value;
    });
}

function filterPitches(pitches, filters) {
    var filteredPitches = []
    for (i = 0; i < pitches.length; i++) {
        // Remove pitches where Y value is below 0; bad data.
        if (pitches[i].location_z < 0) {
            pitches.splice(i, 1)
        }
        // Apply filters
        if (filters.length > 0) {
            if (jQuery.inArray("ball", filters) != -1) {
                if (pitches[i].is_called_ball === true) {
                    filteredPitches.push(pitches[i])
                }
            };
            if (jQuery.inArray("strike", filters) != -1) {
                if ((pitches[i].is_bip === false && pitches[i].is_swing === true) || pitches[i].is_called_strike === true) {
                    filteredPitches.push(pitches[i])
                }
            };
            if (jQuery.inArray("foul", filters) != -1) {
                if (pitches[i].is_foul === true) {
                    filteredPitches.push(pitches[i])
                }
            };
            if (jQuery.inArray("bip", filters) != -1) {
                if (pitches[i].is_bip === true) {
                    filteredPitches.push(pitches[i])
                }
            };
            if (jQuery.inArray("hbp", filters) != -1) {
                if (pitches[i].pa_outcome === "HBP" && pitches[i].is_pa_pitch === true) {
                    filteredPitches.push(pitches[i])
                }
            };
        } else {
            filteredPitches.push(pitches[i])
        }
    }

    return filteredPitches
}

function getVals(pitches, axis) {
    var vals = []
    for (i = 0; i < pitches.length; i++) {
        if (axis == "x") {
            vals.push(pitches[i].location_x)
        } else if (axis == "y") {
            vals.push(pitches[i].location_z)
        }
    }
    return vals
}

function determineSymbols(pitches) {
    var symbols = []
    for (i = 0; i < pitches.length; i++) {
        if (pitches[i].is_called_strike === true) {
            symbols.push("x")
        } else if (pitches[i].is_foul === true) {
            symbols.push("x")
        } else if (pitches[i].is_bip === false && pitches[i].is_swing === true) {
            symbols.push("x")
        } else if (pitches[i].is_called_ball === true) {
            symbols.push("circle")
        } else if (pitches[i].is_bip === true) {
            symbols.push("diamond")
        } else if (pitches[i].pa_outcome === "HBP") {
            symbols.push("star")
        } else {
            // Missed bunt attempt, counts as a strike
            symbols.push("x")
        }
    }
    return symbols
}

function getRequestedGraphs(availableGraphs) {
    requestedGraphs = []
    graphFilters = getGraphFilters()
    if (graphFilters.length > 0) {
        for (i=0; i < graphFilters.length; i++) {
            requestedGraphs.push(availableGraphs[graphFilters[i]])
        }
    } else {
        var keys = Object.keys(availableGraphs)
        for (i=0; i < keys.length; i++) {
            // Set default to requested heatmap
            $('input[type=checkbox][value=contour]').prop('checked', true);
            requestedGraphs.push(availableGraphs["contour"])
        }
    }
    return requestedGraphs
}