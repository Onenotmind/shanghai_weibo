var express = require('express');
var mongodb = require('mongodb');
var GeoJSON = require('geojson');
var fs = require('fs');
var router = express.Router();
var MongoClient = mongodb.MongoClient;

/*router.get('/', function(req, res, next) {
	res.render('test');
});*/

router.get('/', function(req, res, next) {
	var path = '/home/kenn/Documents/nodejs/weibo/public/files/tmp/d0d41bfc26119e6d3c2115fcaa83a209';
	//var path1 = '/home/kenn/Documents/nodejs/weibo/public/files/tmp/tmp_file';
	var shapefileStream = fs.createReadStream(path);
	//var writeStream = fs.createWriteStream(path1);
	var data = '';

	var toJSON = require('shp2json');
	var j = toJSON(shapefileStream);
	j.setEncoding('utf8');
	//j.pipe(res);
	j.on('data', function(chunk) {
		data += chunk;
	});

	j.on('end', function() {
		//res.json(data);
		res.json(data);
	});
});


module.exports = router;