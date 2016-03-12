var express = require('express');
var mongodb = require('mongodb');
var GeoJSON = require('geojson');
var strftime = require('strftime');
var fs = require('fs');
var router = express.Router();
var MongoClient = mongodb.MongoClient;

function statistic(data, type) {
	var count_by_name = {},
		count_by_time = {},
		count_by_name_array = [],
		count_by_time_array = [],
		result = [];

	for (var i = 0; i < data.length; i++) {
		var datum = data[i];
		if (type == 'weibo')
			var name = datum['activityName'];
		else if (type == 'qq')
			var name = datum['poiname'];

		var time = strftime('%Y-%m-%d', datum['checkin_time']);

		if (name in count_by_name)
			count_by_name[name]++;
		else
			count_by_name[name] = 1;

		if (time in count_by_time) {
			if (name in count_by_time[time])
				count_by_time[time][name]++;
			else
				count_by_time[time][name] = 1;
		}
		else {
			count_by_time[time] = {};
			count_by_time[time][name] = 1;
		}
	}

	for (element in count_by_name)
		count_by_name_array.push({name:element, count:count_by_name[element]});
	for (element in count_by_time)
		count_by_time_array.push({time:element, count:count_by_time[element]});

	return {name:count_by_name_array, time:count_by_time_array};
}

router.get('/weibo', function(req, res, next) {
	var url = "mongodb://localhost/weibo";
	var collection_name = "Check_in_Activity_Shanghai";

	var activities = req.query.activities ? req.query.activities.split("||") : null;
	var time = req.query.time;
	var uid = req.query.uid;
	
	var condition = {};
	if (activities) condition.activityName = {$in: activities};
	if (time) condition.checkin_time = {$gte:new Date(time.start_time), $lte:new Date(time.end_time)};
	if (uid) condition.uid = uid;

	MongoClient.connect(url, function(err, db) {
		var collection = db.collection(collection_name);
		collection.find(condition).sort({checkin_time:1}).toArray(function(err, result) {
			if (err) {
				console.log(err);
				return res.send('');
			}
			if (!result) return res.send('');

			var data = {};
			data['statistic'] = statistic(result, 'weibo');
			
			for (var i = 0; i < result.length; i++)
				result[i]['checkin_time'] = strftime('%Y-%m-%d %H:%M:%S', result[i]['checkin_time']);

			data['geojson'] = GeoJSON.parse(result, {Point:'loc', include:['uid', 'activityName', 'context', 'checkin_time']});
			
			res.send(data);
			db.close();
		});
	});
});

router.get('/qq', function(req, res, next) {
	var url = "mongodb://localhost/qq";
	var collection_name = "active_user_poi";

	var poi = req.query.poi ? req.query.poi.split("||") : null;
	var time = req.query.time;
	var uid = req.query.uid;
	
	var condition = {};
	if (poi) condition.poiname = {$in: poi};
	if (time) condition.checkin_time = {$gte:new Date(time.start_time), $lte:new Date(time.end_time)};
	if (uid) condition.uid = parseInt(uid);
	MongoClient.connect(url, function(err, db) {
		if (err) console.log('connection error');

		var collection = db.collection(collection_name);
		collection.find(condition).sort({checkin_time:1}).toArray(function(err, result) {
			if (err) {
				console.log(err);
				return res.send('233');
			}
			if (!result) return res.send('2333');

			var data = {};
			data['geojson'] = GeoJSON.parse(result, {Point:'loc', include:['poiname', 'uid', 'checkin_time']});
			data['statistic'] = statistic(result, 'qq');
			res.json(data);
			db.close();
		});
	});
});

router.post('/upload', function(req, res, next) {
	var file = req.file;
	var path = file.path;

	var shapefileStream = fs.createReadStream(path);

	var toJSON = require('shp2json');
	var geojsonStream = toJSON(shapefileStream);
	geojsonStream.setEncoding('utf8');
	geojsonStream.pipe(res);

	geojsonStream.on('end', function() {
		fs.unlink(path);
	});
});

module.exports = router;
