$(function() {
    drawGraphAndFormatFilters();
    $(":checkbox, :radio, select").change(function(){
        drawGraphAndFormatFilters();
    });
    $( "#batter-name").on("autocompleteselect", function() {
        drawGraphAndFormatFilters();
    });
    $("#batter-name").on("change keyup copy paste cut", function() {
        if (!this.value) {
            drawGraphAndFormatFilters();
        }
    });
    $(".uncheck-all").change(function(){
        var currentClasses = this.className.split(/\s+/);
        if ($.inArray("uncheck-all", currentClasses) != -1) {
            currentClasses.splice($.inArray("uncheck-all", currentClasses), 1);
        }
        var classToUncheck = currentClasses[0];
        $("." + classToUncheck).prop("checked", false);
        $(".uncheck-all").prop("checked", false);
        drawGraphAndFormatFilters();
    });
    $(window).resize(function() {
        drawGraphAndFormatFilters();
    });
});

////////// MAIN GRAPH //////////
function drawGraphAndFormatFilters() {
    Plotly.d3.json("lester.json", function(pitches) {
        hideUnusedPitchTypes(pitches);
        initializeAutocomplete(pitches);

        var yMax = Math.round(Math.max.apply(Math,pitches.map(function(pitch){return pitch.location_z;}))) + 0.25;
        var xMax = Math.round(Math.max.apply(Math,pitches.map(function(pitch){return pitch.location_x;}))) + 0.25;
        var yMin = Math.round(Math.min.apply(Math,pitches.map(function(pitch){return pitch.location_z;}))) - 0.25;
        var xMin = Math.round(Math.min.apply(Math,pitches.map(function(pitch){return pitch.location_x;}))) - 0.25;

        var layout = {
            showlegend: true,
            legend: {"orientation": "h"},
            hovermode: "closest",
            margin: {
                t: 20,
                b: 60
            },
            xaxis: {
                range: [xMin, xMax],
                dtick: 1,
                showgrid: false,
                zeroline: false,
                title: "Distance From Center of Plate (ft.)",
            },
            yaxis: {
                rangemode: "nonnegative",
                range: [yMin, yMax],
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
                    x0: -0.71,
                    y0: 1.5,
                    x1: 0.71,
                    y1: 3.5,
                    opacity: 1,
                    line: {
                        width: 3
                    }
                }
            ]
        };

        var filteredPitches = filterPitches(pitches);

        var xVals = getPitchPositions(filteredPitches, "x");
        var yVals = getPitchPositions(filteredPitches, "y");

        var scattergram = {
            x: xVals,
            y: yVals,
            mode: "markers",
            type: "scatter",
            name: "main",
            showlegend: false,
            hovertext: generateHoverText(filteredPitches),
            hoverinfo: "text",
            marker: {
                color: generateMarkers(filteredPitches, "color"),
                size: 5,
                opacity: 1,
                symbol: generateMarkers(filteredPitches, "symbol")
            },
        };

        var histogram2dcontour = {
            x: xVals,
            y: yVals,
            colorscale: "Hot",
            name: "",
            reversescale: true,
            showscale: true,
            type: "histogram2dcontour",
            colorbar: {
                title: "Number of Pitches",
                titleside: "right",
                titlefont: {
                    size: 14
                }
            }
        };

        availableGraphs = {
            "scattergram": scattergram,
            "contour": histogram2dcontour
        };

        var data = getRequestedGraphs(availableGraphs);

        // Add legend to scattergram
        if (data.filter(function(graph) { return graph.type == "scatter"; }).length > 0) {
            data.push(
                {
                    name: "Strike/Foul",
                    x: [60],
                    y: [60],
                    mode: "markers",
                    marker: {
                        color: "rgb(178,24,43)",
                        symbol: "x"
                    },
                    showlegend: true,
                }
            );
            data.push(
                {
                    name: "Ball",
                    x: [60],
                    y: [60],
                    mode: "markers",
                    marker: {
                        color: "rgb(241,163,64)",
                        symbol: "circle"
                    },
                    showlegend: true,
                }
            );
            data.push(
                {
                    name: "Ball In Play",
                    x: [60],
                    y: [60],
                    mode: "markers",
                    marker: {
                        color: "rgb(27,120,55)",
                        symbol: "diamond"
                    },
                    showlegend: true,
                }
            );
            data.push(
                {
                    name: "Hit By Pitch",
                    x: [60],
                    y: [60],
                    mode: "markers",
                    marker: {
                        color: "rgb(33,102,172)",
                        symbol: "star"
                    },
                    showlegend: true,
                }
            );
        }

        setPitchCount(filteredPitches.length);
        Plotly.purge("heatmap");
        Plotly.plot("heatmap", data, layout, {displaylogo: false});
    });
}

////////// LAYOUT/DISPLAY //////////

function hideUnusedPitchTypes(pitches) {
    // Hide filter checkboxes for pitches that are not present in dataset
    $(".pitch-type-filters").parents('label').addClass('hidden');
    var pitchesUsed = pitches.map(function(pitch) {
        return pitch.pitch_type;
    });
    var uniquePitchesUsed = new Set(pitchesUsed);
    var allFiltersValues = $(".pitch-type-filters").map(function() {
        return this.value;
    });
    for (let item of uniquePitchesUsed.values()) {
        if ($.inArray(item, allFiltersValues) != -1) {
            str = "input[type=checkbox][value=" + item + "]";
            $(str).parents('label').removeClass('hidden');
        }
    }
    $(".pitch-type-filters.uncheck-all").parents('label').removeClass('hidden');
    visibleFilters = $(".pitch-type-filters").not(".uncheck-all").parents('label').not(".hidden");
    visibleFilters.each(function(index) {
        if (index % 2 === 0) {
            $(this).addClass("pull-right");
        }
    });
}

function initializeAutocomplete(pitches) {
    var batterNames = pitches.map(function(pitch) {
        return pitch.batter_name;
    });
    var uniqueBatterNames = new Set(batterNames);
    var nameArray = Array.from(uniqueBatterNames);
    $("#batter-name").autocomplete({
        source: nameArray,
        messages: {
            noResults: '',
            results: function() {}
        }
    });
}

function getPitchPositions(pitches, axis) {
    return pitches.map(function(pitch) {
        if (axis == "x" && pitch.location_x !== null) {
            return pitch.location_x;
        } else if (axis == "y" && pitch.location_z !== null) {
            return pitch.location_z;
        }
    });
}

function generateHoverText(pitches) {
    return pitches.map(function(pitch) {
        return pitch.batter_name.split(', ').reverse().join(" ") + ", " +
               moment(pitch.game_date).format("MMM D, YYYY");
    });
}

function generateMarkers(pitches, field) {
    var pitchSymbols = {
        "strike": "x",
        "ball": "circle",
        "ballInPlay": "diamond",
        "hitByPitch": "star"
    };

    var pitchColors = {
        "strike": "rgb(178,24,43)",
        "ball": "rgb(241,163,64)",
        "ballInPlay": "rgb(27,120,55)",
        "hitByPitch": "rgb(33,102,172)"
    };

    var objToUse = {};

    if (field === "color") {
        objToUse = pitchColors;
    } else if (field === "symbol") {
        objToUse = pitchSymbols;
    }

    return pitches.map(function(pitch) {
        if (pitch.is_called_strike === true) {
            return objToUse.strike;
        } else if (pitch.is_foul === true) {
            return objToUse.strike;
        } else if (pitch.is_bip === false && pitch.is_swing === true) {
            return objToUse.strike;
        } else if (pitch.is_called_ball === true) {
            return objToUse.ball;
        } else if (pitch.is_bip === true) {
            return objToUse.ballInPlay;
        } else if (pitch.pa_outcome === "HBP") {
            return objToUse.hitByPitch;
        } else {
            // Missed bunt attempt, counts as a strike
            return objToUse.strike;
        }
    });
}

function getRequestedGraphs(availableGraphs) {
    requestedGraphs = [];
    graphFilters = $(".graph-filters:checked").map(function() {
        return this.value;
    });
    if (graphFilters.length > 0) {
        for (i=0; i < graphFilters.length; i++) {
            requestedGraphs.push(availableGraphs[graphFilters[i]]);
        }
    } else {
        var keys = Object.keys(availableGraphs);
        for (i=0; i < keys.length; i++) {
            // Set default to heatmap
            $("input[type=checkbox][value=contour]").prop("checked", true);
            requestedGraphs.push(availableGraphs.contour);
        }
    }
    return requestedGraphs;
}

function setPitchCount(filteredPitchesLength) {
    $("#current-pitch-count").text(filteredPitchesLength);
}

////////// FILTERING //////////

function filterPitches(pitches) {
    var filters = {
        "outcomeFilters": getPitchOutcomeFilters(),
        "typeFilters": getPitchTypeFilters(),
        "batterName": getBatterNameFilter(),
        "batterHandedness": getBatterHandednessFilter(),
        "inning": getInningFilter(),
        "finalPitch": getFinalPitchFilter(),
    };

    var resultArrays = [];
    var filterCount = 0;

    Object.keys(filters).forEach(function(key) {
        filterCount += filters[key].length;
        if (key === "outcomeFilters" && filters[key].length > 0) {
            resultArrays.push(evaluateOutcomeFilters(pitches, filters[key]));
        } else if (key === "typeFilters" && filters[key].length > 0) {
            resultArrays.push(evaluatePitchTypeFilters(pitches, filters[key]));
        } else if (key === "batterName" && filters[key].length > 0) {
            resultArrays.push(evaluateBatterNameFilter(pitches, filters[key]));
        } else if (key === "batterHandedness" && filters[key].length > 0) {
            resultArrays.push(evaluateBatterHandednessFilter(pitches, filters[key]));
        } else if (key === "inning" && filters[key].length > 0) {
            resultArrays.push(evaluateInningFilter(pitches, filters[key]));
        } else if (key === "finalPitch" && filters[key].length > 0) {
            resultArrays.push(evaluateFinalPitchFilter(pitches));
        }
    });

    if (filterCount === 0) {
        return pitches;
    } else {
        var result = resultArrays.shift().reduce(function(results, pitch) {
            if (results.indexOf(pitch) === -1 && resultArrays.every(function(array) {
                return array.indexOf(pitch) !== -1;
            })) {
                results.push(pitch);
            }
            return results;
        }, []);
        return result;
    }
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

function getBatterNameFilter() {
    if ($("#batter-name").val()) {
        return [$("#batter-name").val()];
    } else {
        return [];
    }
}

function getBatterHandednessFilter() {
    if ($("input[name='handedness-options']:checked").val()) {
        return [$("input[name='handedness-options']:checked").val()];
    } else {
        return [];
    }
}

function getInningFilter() {
    if ($("#inning-filter").val()) {
        return [$("#inning-filter").val()];
    } else {
        return [];
    }
}

function getFinalPitchFilter() {
    if ($("#final-pitch:checked").val()) {
        return [$("#final-pitch").val()];
    } else {
        return [];
    }
}

function evaluateOutcomeFilters(pitches, filters) {
    return pitches.filter(function(pitch) {
        if ($.inArray("ball", filters) != -1 && pitch.is_called_ball === true) {
            return pitch;
        }
        if ($.inArray("strike", filters) != -1 && ((pitch.is_bip === false && pitch.is_swing === true) || pitch.is_called_strike === true)) {
            return pitch;
        }
        if ($.inArray("foul", filters) != -1 && pitch.is_foul === true) {
            return pitch;
        }
        if ($.inArray("bip", filters) != -1 && pitch.is_bip === true) {
            return pitch;
        }
        if ($.inArray("hbp", filters) != -1 && pitch.pa_outcome === "HBP" && pitch.is_pa_pitch === true) {
            return pitch;
        }
    });
}

function evaluatePitchTypeFilters(pitches, filters) {
    return pitches.filter(function(pitch) {
        if ($.inArray(pitch.pitch_type, filters) != -1) {
            return pitch;
        }
    });
}

function evaluateBatterNameFilter(pitches, batterName) {
    return pitches.filter(function(pitch) {
        if (pitch.batter_name === batterName[0]) {
            return pitch;
        }
    });
}

function evaluateBatterHandednessFilter(pitches, batterHandedness) {
    return pitches.filter(function(pitch) {
        if (pitch.batter_side === batterHandedness[0]) {
            return pitch;
        }
    });
}

function evaluateInningFilter(pitches, inning) {
    return pitches.filter(function(pitch) {
        if (pitch.inning === parseInt(inning[0])) {
            return pitch;
        }
    });
}

function evaluateFinalPitchFilter(pitches) {
    return pitches.filter(function(pitch) {
        if (pitch.is_pa_pitch === true) {
            return pitch;
        }
    });
}
