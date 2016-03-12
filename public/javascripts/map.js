var VisMap = function() {
	//initiate an object and return at last
	var w = {};

	//transform coordinate from longitude and latitude to EPSG:4326 form
	function tc(longitude, latitude) {
		return ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');
	}

	w.common_source = new ol.source.Vector();
	w.cluster_source = new ol.source.Vector();

	//create view
	var view = new ol.View({
		center: tc(121.3, 31.2),
		zoom: 11
	});

	//create the style of feature points
	var point_style = new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke({
				color: [208, 16, 76, 0.5],
				width: 3
			}),
			radius: 5,
			fill: new ol.style.Fill({
				color: [0, 0, 0, 0.5]
			})
		})
	});

	//create the style of selected feature points
	var selected_point_style = new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke({
				color: [208, 16, 76, 0.5],
				width: 3
			}),
			radius: 5,
			fill: new ol.style.Fill({
				color: 'green'
			})
		})
	});

	//create control
	var control =  ol.control.defaults({
		attributionOptions: ({
			collapsible: false
		})
	});

	//create openstreetmap layer
	var osm_layer = new ol.layer.Tile({
		source: new ol.source.OSM()
	});

/*var dragBox = new ol.interaction.DragBox({
  condition: ol.events.condition.shiftKeyOnly,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [0, 0, 255, 1]
    })
  })
});

dragBox.on('boxend', function(e) {
  // features that intersect the box are added to the collection of
  // selected features, and their names are displayed in the "info"
  // div
  //var info = [];
  w.map.addInteraction(w.selectInteraction);

  var extent = dragBox.getGeometry().getExtent();
  cluster_source.forEachFeatureIntersectingExtent(extent, function(feature) {
    //selectedFeatures.push(feature);
    //info.push(feature.get('name'));
    var features = feature.getProperties().features;
    for (var i = 0; i < features.length; i++) {
    	var feature = features[i];
    	console.log(feature.getProperties());
    }
  });
});

dragBox.on('boxstart', function(e) {
	w.map.removeInteraction(w.selectInteraction);
});*/

	w.common_layer = new ol.layer.Vector({
		source: w.common_source,
		//style: point_style
	});

	w.cluster_layer = new ol.layer.Vector({
		source: new ol.source.Cluster({
			source: w.cluster_source
		})
	});

	w.heatmap_layer = new ol.layer.Heatmap({
	 	source: w.cluster_source,
	 	blur: 10,
	 	radius: 5
	});

	//create interaction
	w.selectInteraction = new ol.interaction.Select({
		condition: ol.events.condition.pointerMove,
		style: selected_point_style,
		layers: [w.common_layer, w.cluster_layer]
	});

	//create overlay
	w.popup = new ol.Overlay({
		element: document.getElementById('popup')
	});

	//init map
	w.map = new ol.Map({
		target: 'map',
		view: view,
		layers: [osm_layer, w.cluster_layer],
		controls: control
	});
	w.map.addOverlay(w.popup);
	//w.map.addInteraction(w.selectInteraction);
	//w.map.getInteractions().extend([w.selectInteraction]);
	//w.map.addInteraction(dragBox);

	return w;
}();

var D3 = function() {
	var d = {};

	d.piechart = function(data) {
		d3.select('#piechart-modal .container svg').remove();

		var padding = {top: 30, bottom: 30}
			outerHeight = 460,
			width = 900,
		    height = outerHeight - padding.top - padding.bottom,
		    radius = Math.min(width, height) / 2 * 0.7;

		if (data.length <= 10)
			var color = d3.scale.category10();
		else
			var color = d3.scale.category20();

		var arc = d3.svg.arc()
		    .outerRadius(radius)
		    .innerRadius(radius/2);

		var pie = d3.layout.pie()
		   	.sort(function(d) { return d.count; })
		    .value(function(d) { return d.count; });

		data = pie(data);

		var svg = d3.select("#piechart-modal .container").append("svg")
			.attr('class', 'piechart')
		    .attr("width", width)
		    .attr("height", outerHeight)
		  .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + outerHeight / 2 + ")");

		svg.selectAll("path")
			.data(data).enter()
		  .append("path")
		    .attr("d", arc)
		    .attr("class", "arc")
		    .style("fill", function(d) { return color(d.data.name); });     

		svg.selectAll("text")
			.data(data).enter()
		  .append("text")
		  	.attr('class', 'pie-text')
		    .attr("text-anchor", "middle")
		    .attr("x", function(d, i) {
		        var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
		        d.cx = Math.cos(a) * (radius * 0.75);
		        return d.x = Math.cos(a) * (radius * (1.2 + 0.2 * (i%2)));
		    })
		    .attr("y", function(d, i) {
		        var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
		        d.cy = Math.sin(a) * (radius * 0.75);
		        return d.y = Math.sin(a) * (radius * (1.2 + 0.2 * (i%2)));
		    })
		    .text(function(d) { return Util.translator.c2e(d.data.name); })
		    .attr("transform", function(d) {
		    	var line_angle = (d.startAngle+(d.endAngle-d.startAngle)/2)*180/Math.PI;
		    	if (line_angle <= 90 || line_angle >= 270)
		    		return "rotate("+((d.endAngle+d.startAngle)/2*180/Math.PI)+","+d.x+","+d.y+")"; 
		    	else
		    		return "rotate("+((d.endAngle+d.startAngle)/2*180/Math.PI + 180)+","+d.x+","+d.y+")"; 
		    });
		

		svg.selectAll("path.pointer")
			.data(data).enter()
		  .append("path")
		    .attr("class", "pointer")
		    .style("fill", "none")
		    .style("stroke", "#fff")
		    .attr("d", function(d) {
		        if(d.cy <= d.y) {
		            return "M" + d.x + "," + (d.y-10) + "L" + d.cx + "," + d.cy;
		        } else {
		            return "M" + d.x + "," + (d.y+10) + "L" + d.cx + "," + d.cy;
		        }
		    });
	}

	d.themeriver = function(data) {
		$('#themeriver').remove();
		$('#linechart').remove();
		$('#colortable').remove();

		var original_data = preprocess(data);
		data = preprocess(data);

		var padding = {left:50, right:30, top:30, bottom:30},
			outerWidth = 900,
			outerHeight = 400,
			width = outerWidth - padding.left - padding.right,
		    height = outerHeight - padding.bottom - padding.top;
		
		var stack = d3.layout.stack().offset("wiggle");

		var x = d3.time.scale();
		var y = d3.scale.linear();
		var xAxis = d3.svg.axis();
		var yAxis = d3.svg.axis();

		var color;
		var x_domain_whole;

		var area = d3.svg.area();
		var line = d3.svg.line();
		var brush = d3.svg.brush();
		
		var $brush, $themeriver, $linechart, $colortable,
			$brush_toggle = $("#brush-toggle"),
			$themeriver_trigger = $("#themeriver-trigger");

		var colortable_values = {themeriver:{}, linechart:{}};

		themeriver();
		colortable();
		
		function themeriver() {			
			var dates = [];
			for (var i = 0; i < data[0].length; i++)
				dates.push(data[0][i].time.toString());

			stack.x(function(d) {return dates.indexOf(d.time.toString());})
				.y(function(d) {return d.count;});

			stack(data);

			x.domain(d3.extent(data[0], function(d) {return d.time}))
    			.range([0, width]);

    		y.domain([0, d3.max(data, function(layer) {return d3.max(layer, function(d) {return d.y0 + d.y;})})])
    			.range([height, 0]);

    		x_domain_whole = x.domain();

    		xAxis.scale(x)
			    .orient("bottom")
			    .innerTickSize(-height)
	    		.outerTickSize(0)
	    		.tickPadding(10)
	    		.ticks(7)
			    .tickFormat(d3.time.format("%y-%m-%d"));

		    yAxis.scale(y)
		    	.orient("left")
		    	.innerTickSize(-width)
    			.outerTickSize(0);

    		if (data.length <= 10)
				color = d3.scale.category10();
			else
				color = d3.scale.category20();

			area.x(function(d) { return x(d.time); })
		    	.y0(function(d) { return y(d.y0); })
		    	.y1(function(d) { return y(d.y0 + d.y); });

		    brush.x(x)
		    	.on("brushend", brushed);

		    var svg = d3.select("#themeriver-modal .container").append("svg")
				.attr('id', 'themeriver')
		    	.attr("width", outerWidth)
		    	.attr("height", outerHeight);

		    svg.append("defs").append("clipPath")
			    .attr("id", "themeriver-clip")
			  .append("rect")
			    .attr("width", width)
			    .attr("height", height);

			var rivers = svg.append('g')
				.attr('id', 'rivers')
				.attr("transform", "translate("+padding.left+","+padding.top+")");

			rivers.selectAll("path")
			    .data(data)
			  .enter().append("path")
			    .attr("d", area)
			    .attr('class', 'river')
			    .attr('activity', function(d) { return d[0]['activity']; })
			    .style("fill", function(d) { return color(d[0]['activity']); })
			    .on('click', linechart);

			rivers.append("g")
				.attr("class", "x brush")
				.call(brush)
			  .selectAll("rect")
				.attr("y", -6)
				.attr("height", height + 7)
				.style('fill', 'teal')
				.style('opacity', 0.5);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate("+padding.left+","+(height+padding.top)+")")
				.call(xAxis);

			svg.append("g")
				.attr("class", "y axis")
				.attr("transform", "translate("+padding.left+","+padding.top+")")
				.call(yAxis);

			$brush_toggle.addClass('active');
			$brush = $('.x.brush');
			$themeriver = $("svg#themeriver");
		}

		function linechart() {
			$themeriver.hide();
			$brush_toggle.hide();
			$themeriver_trigger.show();
			if ($linechart) $linechart.remove();

			var activity = d3.select(this).attr('activity');

			for (key in colortable_values.linechart)
				colortable_values.linechart[key] = key == activity ? true : false;
			update_colortable_display('linechart');

			var index = 0;
			for (var i = 0; i < data.length; i++) {
				if (data[i][0]['activity'] == activity) {
					index = i;
					break;
				}
			}

			var activity_data = data[index];
			
			x.domain(x_domain_whole);

			var y = d3.scale.linear()
    			.domain([0, d3.max(activity_data, function(d) { return d.count; })])
    			.range([height, 0]);

    		var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left")
			    .innerTickSize(-width)
    			.outerTickSize(0);

    		line.x(function(d) { return x(d.time); })
				.y(function(d) { return y(d.count); });

			var svg = d3.select("#themeriver-modal .container").append("svg")
				.attr('id', 'linechart')
			    .attr("width", outerWidth)
			    .attr("height", outerHeight);
			
			svg.append("defs").append("clipPath")
			    .attr("id", "linechart-clip")
			  .append("rect")
			    .attr("width", width)
			    .attr("height", height);

			svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate("+padding.left+","+(height+padding.top)+")")
		      .call(xAxis);

		    svg.append("g")
		      .attr("class", "y axis")
		      .attr("transform", "translate("+padding.left+","+padding.top+")")
		      .call(yAxis);

		    var chart = svg.append('g')
		    	.attr('id', 'chart')
		    	.attr("transform", "translate("+padding.left+","+padding.top+")");
		    	
		    chart.append("path")
		      .datum(activity_data)
		      .attr("class", "line")
		      .attr("d", line)
		      .attr('stroke', color(activity));

		    chart.append("g")
		      .attr("class", "x brush")
		      .call(brush)
		    .selectAll("rect")
		      .attr("y", -6)
		      .attr("height", height + 7)
		      .style('fill', 'teal')
		      .style('opacity', 0.5);

		     $linechart = $("svg#linechart");
		}

		function colortable() {
			var domain = color.domain();
			var table = [];
			for (var i = 0; i < domain.length; i++) {
				table.push({'name': domain[i], 'color': color(domain[i])});
				colortable_values.themeriver[domain[i]] = true;
				colortable_values.linechart[domain[i]] = true;
			}

			$colortable = $("<div id='colortable'>");
			for (var i = 0; i < table.length; i++) {
				var $block = $("<div class='color-block'>");
				var $color_label = $("<div class='color-label'>").css('background-color', table[i].color);
				var $activity = $("<div class='color-activity'>").text(Util.translator.c2e(table[i].name));
				$block.append($color_label).append($activity);
				$colortable.append($block);
			}

			$("#themeriver-modal .container").prepend($colortable);

			$('.color-block').click(function() {
				$(this).toggleClass('inactive');

				var new_data = [];
				var activities = [];
				
				$('.color-block').not('.inactive').each(function() {
					var activity = $(this).find('.color-activity').text();
					activities.push(Util.translator.e2c(activity));
				});

				for (var i = 0; i < original_data.length; i++)
					if (activities.indexOf(original_data[i][0].activity) != -1)
						new_data.push(original_data[i]);

				if ($themeriver.is(':visible'))
					themeriver_change(activities, new_data);
				else
					linechart_change(activities, new_data);
			});

			$colortable = $("#colortable");
		}

		function themeriver_change(activities, new_data) {
			var svg = j2d($themeriver);
			
			update_colortable_value('themeriver');

			if (activities.length == 0)
				return svg.selectAll('.river').remove();				

			stack(new_data);

			var y = d3.scale.linear()
	    		.domain([0, d3.max(new_data, function(layer) {return d3.max(layer, function(d) {return d.y0 + d.y;})})])
	    		.range([height, 0]);

	    	var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left")
			    .innerTickSize(-width)
	    		.outerTickSize(0);
	    	
	    	area.y0(function(d) { return y(d.y0); })
	    		.y1(function(d) { return y(d.y0 + d.y); });

	    	svg.select('.y.axis')
	    		.transition()
	    		.duration(800)
	    		.call(yAxis);
	    	
	    	var rivers = svg.select('#rivers');

	    	rivers.selectAll('.river').remove();

			rivers.selectAll("path.river")
			    .data(new_data)
			  .enter().append("path")
			    .attr("d", area)
			    .attr('class', 'river')
			    .attr('activity', function(d) { return d[0]['activity']; })
			    .style("fill", function(d) { return color(d[0]['activity']); })
			    .on('click', linechart);

			if ($brush_toggle.hasClass('active'))
				$('#rivers').append($brush.remove());

		}

		function linechart_change(activities, new_data) {
			var svg = j2d($linechart);

			update_colortable_value('linechart');

			if (activities.length == 0)
				return svg.selectAll('.line').remove();

			var y = d3.scale.linear()
    			.domain([0, d3.max(new_data, function(layer) {return d3.max(layer, function(d) { return d.count; })})])
    			.range([height, 0]);

    		var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left")
			    .innerTickSize(-width)
    			.outerTickSize(0);

    		line.y(function(d) { return y(d.count); });

    		svg.selectAll('.line').remove();

    		svg.select('#chart').selectAll('path.line')
    			.data(new_data).enter()
    		  .append('path')
    			.attr('class', 'line')
    			.attr("d", line)
    			.attr('stroke', function(d) { return color(d[0].activity); });

    		svg.select('.y.axis')
    			.transition()
		    	.duration(800)
		    	.call(yAxis);

    		if ($brush_toggle.hasClass('active'))
				$('#chart').append($brush.remove());
		}

	   	var events = {
	   		switch_weekday : function () {
	   			var id = d3.select(this).attr('id');
	    		if (id == 'axis-week')
	    			xAxis.tickFormat(d3.time.format("%a"));
	    		else
	    			xAxis.tickFormat(d3.time.format("%y-%m-%d"));

	    		if ($themeriver.is(':visible'))
	    			j2d($themeriver).select('.x.axis').call(xAxis);
	    		else
	    			j2d($linechart).select('.x.axis').call(xAxis);
	   		},

	   		toggle_brush : function() {
	   			if ($themeriver.is(':visible') == false) return;

		    	var active = $brush_toggle.hasClass('active');
		    	$brush_toggle.toggleClass('active');
		    	
		    	if (active)
		    		$brush.remove();
		    	else
		    		$('#rivers').append($brush);
	   		},

	   		open_themeriver :function() {
	   			$linechart.remove();
	    		$themeriver.fadeIn();
		    	$themeriver_trigger.hide();
				$brush_toggle.show();

				update_colortable_display('themeriver');
	   		},

	   		highlight_river: function(event) {
	   			if ($brush_toggle.hasClass('active')) return;

	   			d3.select(event.target).classed('active', true);
	   		},

	   		restore_river: function(event) {
	   			if ($brush_toggle.hasClass('active')) return;

	   			d3.select(event.target).classed('active', false);
	   		}
	   	}

	    d3.selectAll('.axis-switcher').on('click', events.switch_weekday);	    
	    $brush_toggle.on('click', events.toggle_brush);
	    $themeriver_trigger.on('click', events.open_themeriver);
	    $('.river').on('mouseenter', events.highlight_river).on('mouseleave', events.restore_river);

	    function brushed() {
	    	if (brush.empty()) {
	    		x.domain(x_domain_whole);
	    	} else {
				var parseDate = d3.time.format("%Y-%m-%d").parse;	    	

				var start = new Date(brush.extent()[0].toString());
				var year = start.getFullYear();
				var month = start.getMonth()+1;
				var day = start.getDate();
				start = parseDate([year, month, day].join('-'));

				var end = new Date(brush.extent()[1].toString());
				var hour = end.getHours();
				var minute = end.getMinutes();
				var second = end.getSeconds();
				if (hour+minute+second != 0)
					end.setDate(end.getDate() + 1);
				year = end.getFullYear();
				month = end.getMonth()+1;
				day = end.getDate();
				end = parseDate([year, month, day].join('-'));

		    	x.domain([start, end]);
		    }

		    if ($themeriver.is(':visible')) {
		    	var svg = j2d($themeriver);
		    	svg.selectAll('.river')
		    		.transition()
		    		.duration(800)
		    		.attr('d', area);

		    	svg.select('.x.axis').transition()
		    		.duration(800)
		    		.call(xAxis);

		    	svg.select('.brush').call(brush.clear());
		    } else {
		    	var svg = j2d($linechart);
		    	svg.selectAll('.line')
			    	.transition()
			    	.duration(800)
			    	.attr('d', line);

		    	svg.select('.x.axis')
		    		.transition()
		    		.duration(800)
		    		.call(xAxis);

		    	svg.select('.brush').call(brush.clear());
		    }
		}

		function update_colortable_display(type) {
			var values = type == 'themeriver' ? colortable_values.themeriver : colortable_values.linechart;
			$('.color-block').each(function() {
				var activity = Util.translator.e2c($(this).find('.color-activity').text());
				if (values[activity] == true)
					$(this).removeClass('inactive');
				else
					$(this).addClass('inactive');
				
			});
		}

		function update_colortable_value(type) {
			$('.color-block').not('.inactive').each(function() {
				var activity = Util.translator.e2c($(this).find('.color-activity').text());
				if (type == 'themeriver')
					colortable_values.themeriver[activity] = true;
				else
					colortable_values.linechart[activity] = true;
			});

			$('.color-block.inactive').each(function() {
				var activity = Util.translator.e2c($(this).find('.color-activity').text());
				if (type == 'themeriver')
					colortable_values.themeriver[activity] = false;
				else
					colortable_values.linechart[activity] = false;
			});
		}

		function preprocess(data) {
			var parseDate = d3.time.format("%Y-%m-%d").parse;
			var result = [];
			var activities = [];

			for (var i = 0; i < data.length; i++)
				for (activity in data[i]['count'])
					if (activities.indexOf(activity) == -1)
						activities.push(activity);

			for (var i = 0; i < activities.length; i++) {
				var activity = activities[i];
				result[i] = [];

				for (var j = 0; j < data.length; j++) {
					result[i].push({time:parseDate(data[j]['time']), count:data[j]['count'][activity] || 0, activity:activity});
				}
			}

			return result;
		}

		function j2d($element) {
			return d3.select($element.get(0));
		}
	}

	return d;
}();