var Weibo = {

	xhr: null,

	search: function(uid) {
		//hide popup and show loader
		Popup.hide();
		Loader.show();
		
		//initiate query parameter
		var query = {};
		var source, layer;
		if (!uid) {		//search by activity and time
			var activities = [];
			$('#select-modal .select-activity .checkbox input:checked').each(function() {activities.push($(this).attr('name'));});
			query.activities = activities.join('||');

			if ($('#select-modal #select-time-all').hasClass('active') == false) {
				var time = {};
				time.start_time = $('#start-time').val();
				time.end_time = $('#end-time').val();
				query.time = time;
			}

			source = VisMap.cluster_source;
			layer = VisMap.cluster_layer;
		} else {	//search by user id
			query = {uid: uid};
			source = VisMap.common_source;
			layer = VisMap.common_layer;
		}
		
		//cancel existing xhr request
		if (Weibo.xhr)
			Weibo.xhr.abort();
		
		//send a request
		Weibo.xhr = $.get('/query/weibo', query, function(response) {
			if (!response) {
				vector_source.clear();
				Loader.hide();
				return;
			}

			var geojson = response['geojson'];
			var piechart = response['statistic']['name'];
			var themeriver = response['statistic']['time'];

			//draw pie chart
			D3.piechart(piechart);
			//draw themeriver
			D3.themeriver(themeriver);

			//update common_layer or cluster_layer
			var geojsonFormat = new ol.format.GeoJSON();
			var features = geojsonFormat.readFeatures(geojson, {featureProjection: 'EPSG:3857'});
			
			VisMap.map.removeLayer(VisMap.cluster_layer);
			VisMap.map.removeLayer(VisMap.common_layer);
			VisMap.map.addLayer(layer);

			source.clear();
			source.addFeatures(features);
			Weibo.xhr = null;
			Loader.hide();
		});
	}
};

var Popup =  {
	init: function() {
		//listening to the feature click event
		VisMap.map.on('click', function(evt) {
			var heatmap_flag = $('#heatmap-trigger').hasClass('active');
			if (heatmap_flag == true) return;

			var pixel = evt.pixel;
			Popup.show(pixel);
		});

		//listening to the popup click event
		$('#popup').dblclick(function() {
			Popup.hide();
		});
	},

	show: function(pixel) {
		var coordinate = VisMap.map.getCoordinateFromPixel(pixel);
		var $popup = $('#popup');
		VisMap.map.forEachFeatureAtPixel(pixel, function(feature, layer) {
			$popup.empty().fadeIn();
			
			var features = feature.getProperties().features;
			if (features){
				for (var i = 0; i < features.length; i++) {
					var context = features[i].getProperties()['context'];
					var uid = features[i].getProperties()['uid'];
					var time = features[i].getProperties()['checkin_time'];
					if (!context) continue;
					var color = Util.colors[i % Util.colors.length];
					var $p = $('<p>').text(context + ' ' + time).append($('<a class="uid">').text(uid));
					var $segment = $('<div class="ui segment">').addClass(color).append($p);
					$popup.append($segment);
				}

				if ($popup.children().length == 0) {
					var context = 'NO MESSAGE';
					var $segment = $('<div class="ui segment">').append($('<p>').text(context));
					$popup.append($segment);
				}

				$('.uid').off().click(function() {
					Weibo.search(parseInt($(this).text()));
				});
			} else {
				var feature = feature.getProperties();
				var context = feature['context'] ? feature['context'] : 'NO MESSAGE';
				var uid = feature['uid'];
				var time = feature['checkin_time'];
				var $p = $('<p>').text(context + ' ' + time);
				var $segment = $('<div class="ui segment">').append($p);
				$popup.append($segment);
			}

			VisMap.popup.setPosition(coordinate);
			var y = pixel[1];
			if (y < 200)
				VisMap.popup.setPositioning('top-center');
			else
				VisMap.popup.setPositioning('bottom-center');
		});
	},

	hide: function() {
		var $popup = $('#popup');
		$popup.empty().fadeOut();
	}
};

var Loader = {
	init: function() {
		this.spinner =  '<div id="spinner-wrapper">\
							<div class="ui active dimmer">\
								<div class="ui indeterminate text loader">\
									Processing\
								</div>\
							</div>\
						</div>';
	},

	show: function () {
		$('#spinner-wrapper').remove();
		$('body').append($(this.spinner));
	},

	hide: function () {
		$('#spinner-wrapper').remove();
	},
};

var Modal = {
	init: function() {
		Modal._init_activity();
		Modal._init_time();

		$('.modal')
		.modal({
    		allowMultiple: false,
    		transition: 'horizontal flip'
  		})
  		.modal('setting', 'closable', false);

  		$('.modal .button.confirm').off().click(function() {
  			$(this).closest('.modal').modal('hide');
  		});

  		$('.modal .button.search').off().click(function() {
  			Weibo.search();
  		});

  		$('.modal-trigger').off().click(function() {
  			var modal = $(this).attr('data-modal');
  			Modal.show(modal);
  		});
	},

	show: function(modal) {
		$(modal).modal('show');
	},

	hide: function(modal) {
		$(modal).modal('hide');
	},
	
	_init_activity: function() {
		for (en in Util.translator.activities) {
			var $checkbox = $('<div class="ui checkbox">');
			var $input = $('<input type="checkbox">').attr('name', Util.translator.e2c(en));
			var $label = $('<label>').text(en);
			$checkbox.append($input).append($label);
			$('#select-modal .select-activity').append($checkbox);
		}
	},

	_init_time: function() {
		$('#select-modal .select-time input.time').datetimepicker({
	        format: 'Y-m-d H:i',
	        closeOnDateSelect: true
	    });

	    $('#select-time-all').click(function() {
	    	$(this).toggleClass('active');
	    	if ($(this).hasClass('active') == true) {
	    		$('.select-time input').attr('disabled', 'disabled');
	    		$('.select-time .ui.input').css('opacity', 0.5);
	    	} else {
	    		$('.select-time input').removeAttr('disabled');
	    		$('.select-time .ui.input').css('opacity', 1);
	    	}
	    });
	}
};

var Heatmap =  {
	init: function() {
		$('#heatmap-trigger').click(function() {
			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
				Heatmap.hide();
			} else {
				$(this).addClass('active');
				Heatmap.show();
			}
		});
	},

	show: function() {
		//remove select interaction
		VisMap.map.removeInteraction(VisMap.selectInteraction);
		//add heatmap layer
		VisMap.map.addLayer(VisMap.heatmap_layer);
	},

	hide: function() {
		//restore select interaction
		VisMap.map.addInteraction(VisMap.selectInteraction)
		//remove heatmap layer
		VisMap.map.removeLayer(VisMap.heatmap_layer);
	}
};

function init() {
	Popup.init();
	Loader.init();
	Modal.init();
	Heatmap.init();  

	init_upload_event();
}

function init_upload_event() {
	$('.upload').click(function() {
		$('.file-upload').click();
	});

	$('.file-upload').on('change', function(e) {
			var $this = $(this);
			if ($this.val() == "") return;

			Loader.show();

	        var file = e.target.files[0];
	        var data = new FormData();
	        data.append('file',file);
	        
	        var url = '/query/upload';
	        $.ajax({url:url,type:'POST',data:data,dataType:"json",cache:false,processData:false,contentType:false, success:function(response) {
	        	if (!response)
					return Loader.hide();

				var geojsonFormat = new ol.format.GeoJSON();
				var features = geojsonFormat.readFeatures(response, {featureProjection: 'EPSG:3857'});

				VisMap.map.removeLayer(VisMap.cluster_layer);
				VisMap.map.removeLayer(VisMap.common_layer);
				VisMap.map.addLayer(VisMap.common_layer);

				VisMap.common_source.clear();
				VisMap.common_source.addFeatures(features);
				Loader.hide();

				$this.val("");
			}});
	});
}