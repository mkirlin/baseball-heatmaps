$(function() {
    drawGraph();
    $(":checkbox").change(function(){
        drawGraph();
    });
    $(".uncheck-all").change(function(){
        var currentClasses = this.className.split(/\s+/)
        currentClasses.splice($.inArray("pull-left", currentClasses), 1);
        currentClasses.splice($.inArray("uncheck-all", currentClasses), 1);
        var classToUncheck = currentClasses[0]
        $("." + classToUncheck).prop("checked", false);
        $(".uncheck-all").prop("checked", false);
        drawGraph();
    })
    $( window ).resize(function() {
        drawGraph();
    });
});

function drawGraph() {
    Plotly.d3.json("lester.json", function(pitches) {
        hideUnusedPitchTypes(pitches)
        var y_max = Math.round(Math.max.apply(Math,pitches.map(function(pitch){return pitch.location_z;}))) + .25
        var x_max = Math.round(Math.max.apply(Math,pitches.map(function(pitch){return pitch.location_x;}))) + .25
        var y_min = Math.round(Math.min.apply(Math,pitches.map(function(pitch){return pitch.location_z;}))) - .25
        var x_min = Math.round(Math.min.apply(Math,pitches.map(function(pitch){return pitch.location_x;}))) - .25

        var layout = {
            showlegend: false,
            hovermode: "closest",
            margin: {
                t: 20
            },
            xaxis: {
                range: [x_min, x_max],
                dtick: 1,
                showgrid: false,
                zeroline: false,
                title: "Distance From Center of Plate (ft.)",
            },
            yaxis: {
                rangemode: "nonnegative",
                range: [y_min, y_max],
                dtick: 1,
                showgrid: false,
                zeroline: false,
                title: "Distance From Ground (ft.)",
            },
            shapes: [
                {
                    type: "rect",
                    xref: "x",
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

        var filters = {
            "outcome_filters": getPitchOutcomeFilters(),
            "type_filters": getPitchTypeFilters()
        }

        var filteredPitches = filterPitches(pitches, filters)
        var x_vals = getPitchPositions(filteredPitches, "x")
        var y_vals = getPitchPositions(filteredPitches, "y")

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

        Plotly.purge("heatmap");
        Plotly.plot("heatmap", data, layout)
    });
}

function hideUnusedPitchTypes(pitches) {
    // Hide filter checkboxes for pitches that are not present in dataset
    $(".pitch-type-filters").parents('label').addClass('hidden')
    var pitchesUsed = pitches.map(function(pitch) {
        return pitch.pitch_type
    });
    var uniquePitchesUsed = new Set(pitchesUsed)
    var allFiltersValues = $(".pitch-type-filters").map(function() {
        return this.value;
    });
    for (let item of uniquePitchesUsed.values()) {
        if ($.inArray(item, allFiltersValues) != -1) {
            str = "input[type=checkbox][value=" + item + "]"
            $(str).parents('label').removeClass('hidden')
        }
    }
    $(".pitch-type-filters.uncheck-all").parents('label').removeClass('hidden')
    visibleFilters = $(".pitch-type-filters").not(".uncheck-all").parents('label').not(".hidden")
    visibleFilters.each(function(index) {
        if (index % 2 === 0) {
            $(this).addClass("pull-right")
        }
    });
}

function getPitchOutcomeFilters() {
    return $(".pitch-outcome-filters:checked").map(function() {
        return this.value;
    });
}

function getPitchTypeFilters() {
    return $(".pitch-type-filters:checked").map(function() {
        return this.value;
    });
}

function getGraphFilters() {
    return $(".graph-filters:checked").map(function() {
        return this.value;
    });
}

function checkForTrue(bool) {
    return bool === true
}

function filterPitches(pitches, filters) {
    var filteredPitches = []
    // If there are no filters, return all the pitches
    if (filters.type_filters.length === 0 && filters.outcome_filters.length === 0) {
        filteredPitches = pitches
    } else {
        filteredPitches = pitches.map(function(pitch) {
            // Remove pitches where Y value is below 0; bad data.
            // if (pitches[i].location_z < 0) {
            //     pitches.splice(i, 1)
            // }

            var outcome_filters_results = []

            // Apply filters
            if (filters.outcome_filters.length > 0) {
                if ($.inArray("ball", filters.outcome_filters) != -1) {
                    if (pitch.is_called_ball === true) {
                        outcome_filters_results.push(true)
                    } else {
                        outcome_filters_results.push(false)
                    };
                };
                if ($.inArray("strike", filters.outcome_filters) != -1) {
                    if ((pitch.is_bip === false && pitch.is_swing === true) || pitch.is_called_strike === true) {
                        outcome_filters_results.push(true)
                    } else {
                        outcome_filters_results.push(false)
                    };
                };
                if ($.inArray("foul", filters.outcome_filters) != -1) {
                    if (pitch.is_foul === true) {
                        outcome_filters_results.push(true)
                    } else {
                        outcome_filters_results.push(false)
                    };
                };
                if ($.inArray("bip", filters.outcome_filters) != -1) {
                    if (pitch.is_bip === true) {
                        outcome_filters_results.push(true)
                    } else {
                        outcome_filters_results.push(false)
                    };
                };
                if ($.inArray("hbp", filters.outcome_filters) != -1) {
                    if (pitch.pa_outcome === "HBP" && pitch.is_pa_pitch === true) {
                        outcome_filters_results.push(true)
                    } else {
                        outcome_filters_results.push(false)
                    };
                };
            }

            var type_filters_results = []

            if (filters.type_filters.length > 0) {
                if ($.inArray(pitch.pitch_type, filters.type_filters) != -1) {
                    type_filters_results.push(true)
                } else {
                    type_filters_results.push(false)
                };
            };

            if (outcome_filters_results.length > 0 && type_filters_results.length > 0) {
                if (outcome_filters_results.includes(true) && type_filters_results.includes(true)) {
                    return pitch
                }
            } else if (outcome_filters_results.length > 0 && type_filters_results.length === 0) {
                if (outcome_filters_results.includes(true)) {
                    return pitch
                }
            } else if (outcome_filters_results.length === 0 && type_filters_results.length > 0) {
                if (type_filters_results.includes(true)) {
                    return pitch
                }
            }
        });
    }
    return filteredPitches
}

function getPitchPositions(pitches, axis) {
    return pitches.map(function(pitch){
        if (axis == "x" && pitch.location_x != null) {
            return pitch.location_x
        } else if (axis == "y" && pitch.location_z != null) {
            return pitch.location_z
        }
    })
}

function determineSymbols(pitches) {
    return pitches.map(function(pitch) {
        if (pitch.is_called_strike === true) {
            return "x"
        } else if (pitch.is_foul === true) {
            return "x"
        } else if (pitch.is_bip === false && pitch.is_swing === true) {
            return "x"
        } else if (pitch.is_called_ball === true) {
            return "circle"
        } else if (pitch.is_bip === true) {
            return "diamond"
        } else if (pitch.pa_outcome === "HBP") {
            return "star"
        } else {
            // Missed bunt attempt, counts as a strike
            return "x"
        }
    });
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
            $("input[type=checkbox][value=contour]").prop("checked", true);
            requestedGraphs.push(availableGraphs["contour"])
        }
    }
    return requestedGraphs
}