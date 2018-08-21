const AWS = require('aws-sdk')
const async = require('async')
const bucketName = "dailyvanitymedia"
const path = require('path')
const fs = require('fs')
let pathParams, image, imageName, imageType, FileName;
/** Load Config File */
AWS.config.loadFromPath('./config/aws.json');

/** After config file load, create object for s3*/
const s3 = new AWS.S3()
const createMainBucket = (callback) => {
	// Create the parameters for calling createBucket
	const bucketParams = {
	   Bucket : bucketName
	};                    
	s3.headBucket(bucketParams, function(err, data) {
	   if (err) {
	//   	console.log("ErrorHeadBucket", err)
	      	s3.createBucket(bucketParams, function(err, data) {
			   if (err) {
			//   	console.log("Error", err)
			      callback(err, null)
			   } else {
			      callback(null, data)
			   }
			});
	   } else {
	      callback(null, data)
	   }
	})                             
}

function genrate_string() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 15; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

const createItemObject = (callback) => {
  const params = { 
        Bucket: bucketName, 
	  Key: `novaly/${FileName}`, 
        ACL: 'public-read',
        ContentType: imageType,
        Body:image
    };
	s3.putObject(params, function (err, data) {
		if (err) {
	    	console.log("Error uploading image: ", err);
	    	callback(err, null)
	    } else {
	    	console.log("Successfully uploaded image on S3", data);
	    	callback(null, data)
	    }
	})  
}
exports.upload = (req, res, next) => {
    console.log(req.files);
	var tmp_path = req.files.file.path;
	FileName = genrate_string()
    // console.log("item", req.files.file)
	var tmp_path = req.files.file.path;
	image = fs.createReadStream(tmp_path);
	imageName = FileName;
    imageType = req.files.file.headers['content-type'];
    async.series([
        createMainBucket,
        createItemObject
        ], (err, result) => {
        if(err) return res.send(err)
        else return res.json({status:true, message: `https://s3-ap-southeast-1.amazonaws.com/dailyvanitymedia/novaly/${imageName}`}) 
    })
}
