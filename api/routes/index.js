var express = require("express");
var router = express.Router();
var LocalStrategy = require('passport-local').Strategy;
var axios = require('axios');
var path = require('path');
var controller = require('../server/app/controllers');
var moment = require('moment');
var mail = require('../server/app/services/mail');

var WooCommerceAPI = require('woocommerce-api');
var config = require('config');

var async = require('async');
var AWS = require('aws-sdk');
var fs = require('fs');
var s3Options = {
    "accessKeyId": "AKIAJWI4DDNI4WMOQJ2Q",
    "secretAccessKey": "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",
    "region": "ap-southeast-1",        
}
AWS.config = s3Options;
var s3 = new AWS.S3();

var Advertiser = require('./advertiser');
var Outlet = require('./outlet');
var Service = require('./service');
var Promo = require('./promo');

var MyWooCommerce = new WooCommerceAPI({
    url: config.get('url'),
    consumerKey: config.get('woo.key'),
    consumerSecret: config.get('woo.secret'),
    wpAPI: true,
    version: 'wc/v2',
    queryStringAuth: true
});


function genrate_string() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// update outlets status and disable attributes on related service
// outlet -object {id, status}
function doActivateOutlet(outlet, connection, mainUrl, pCallback) {    
    async.waterfall([        
        function(callback) {  // get related service
            var sql = "SELECT a.id sId, a.outlets, a.woo_id swId, a.variations variations, b.woo_id owId, b.slug oslug, c.slug aslug FROM services as a \
            INNER JOIN outlets as b on a.advertiser_id=b.advertiser_id \
            INNER JOIN advertisers as c on a.advertiser_id=c.id \
            WHERE b.id=? and c.status=1";    
            connection.query({sql: sql}, [outlet.id], function(error, results) {
                if (error) callback(null, false, false);
                else if (results.length>0) {
                    var services = [];
                    var owId = null;
                    results.forEach(ii => {
                        var outlets = ii.outlets.split(",");
                        
                        if (outlets.indexOf(outlet.id.toString()) >= 0) {
                            services.push({
                                id: ii.sId,
                                slug: ii.aslug + '-' + ii.oslug,
                                swId: ii.swId,
                                owId: ii.owId,
                                outlets: outlets,
                                variations: ii.variations
                            });
                            owId = ii.owId;
                        }                        
                    })
                    outlet.woo_id = owId;
                    callback(null, services, true);
                } else {
                    callback(null, false, true);
                }
            })
        },  // promo updates      
        function(services, flag, callback) {
            if (!services) return callback(null, true, flag);
            step = 0;
            async.eachSeries(services, function(service, eachCallback) {
                async.waterfall([ // get attributes
                    function(callback_1) {
                        var variations = service.variations.split(",");
                        var vId = variations[service.outlets.indexOf(outlet.id.toString())];
                        var newVariations = variations.filter(ii=>ii!=vId);                       

                        data = {"visible": outlet.status? true: false };
                        MyWooCommerce.put('products/' + service.swId + '/variations/' + vId, data, function(err, data, res) {
                            if (err || res.message) callback_1(true, {status: "error", message: "Failed updating service"});
                            else {
                                callback_1(false, newVariations);
                            }
                        });
                    }
                ], function(error, result) {
                    if (error) callback(null, error, result);
                    else {
                        step ++;
                        if (step == services.length) {
                            callback(null, false, result);                            
                        } else {
                            eachCallback();
                        }
                    }
                })
            })
        },        
        function(error, flag, callback) {
            if (error && !flag) return callback(error, {status: "error", message: "Failed update data"});
            var data = {"outlet_active": outlet.status? 'Active' : 'Inactive'}
            connection.query({sql: "select woo_id from outlets where id=?"}, [outlet.id], function(error, results) {
                if (error) callback(null, true, {"status": "failure", "message": "There isn't outlet on server"});
                else if (results.length > 0) {
                    var result = results[0];
                    axios.put(mainUrl + 'wp-json/wp/v2/update_outlet', {
                        authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                        id: result.woo_id,                
                        fields: data
                    }).then(function (response) {                                                       
                        if (response.data.message) {
                            callback(null, true, {"status": "failure", "message": response.data.message});                            
                        } else {
                            callback(null, false, {"status": "success", "message": "Success Put outlet to wp"});
                        }
                    }).catch(function (error) {                    
                        callback(null, true, {"status": "failure", "message": "Error Updating outlet on WP site"});
                    });
                } else callback(null, true, {"status": "failure", "message": "There isn't outlet on server"});
            });
        },
        function(error, message, callback) {
            if (error) return callback(error, message);
            var sql = "update outlets set status=? where id=?";
            connection.query({sql: sql}, [outlet.status, outlet.id], function(error, results) {
                if (error) callback(true, null);
                else callback(false, results)
            })
        }        
    ], function(error, results) {
        pCallback(error, results);
    })    
}

// activate or deactivate of service and related promo
//service- object [id, status, swId]
function doActivateService(service, connection, pCallback) {
    if (!service.id) return pCallback(true, null);    
    async.waterfall([
        function(callback) {
            if (service.variations && service.variations.length > 0) {
                var vids = service.variations.split(",");
                var updateData = [];
                vids.forEach(vv => {
                    updateData.push({
                        id: parseInt(vv),
                        'visible': service.status? true: false
                    });
                })
                
                MyWooCommerce.post('products/' + service.swId + '/variations/batch', { update: updateData }, function(err, data, res) {
                    if (err || res.message) callback(null, true, {status: "error", message: "Failed updating service"});
                    else {
                        var resp = JSON.parse(res);
                        var allVariations = [];
                        if (resp.update && resp.update.length>0) {
                            resp.update.forEach(ii=> {
                                //if ( ii.visible && allVariations.indexOf(ii.id) < 0)
                                    allVariations.push(ii.id);
                            });
                        }
                        service.variations = allVariations.join(",");
                        callback(null, false, null);
                    }
                });

            } else {
                callback(null, false, null);
            }            
        },
        // update service on wp
        function(error, msg, callback) {
            if (error) callback(true, msg);
            else {
                async.waterfall([
                    function(callback_1) {
                        var data = {
                            status: service.status? 'publish': 'draft',
                            'catalog_visibility': service.status? 'visible': 'hidden'                                
                        }

                        MyWooCommerce.post(`products/${service.swId}`, data, function(err, data, res) {
                            if (err) callback(null, true, null);
                            else {
                                var resp = JSON.parse(res);
                                if (resp.message) callback_1(null, true, resp.message);
                                else callback_1(null, false, resp);
                            }
                        });
                    },
                    function(error, msg, callback_1) {
                        if (error) callback_1(null, true, msg);
                        else {
                            connection.query({sql: "update promos set status=? where service_id=?"},
                             [service.status, service.id], function(error, results) {
                                if (error) callback_1(null, true, {status: "error", message: "Updating error"});
                                else if(results.affectedRows>0) {
                                    callback_1(null, false, results);
                                } else callback_1(null, false, null);
                            })
                        }
                    },
                    function(error, msg, callback_1) {
                        if (error) callback_1(true, msg);
                        else {
                            connection.query({sql: "update services set status=? where id=?"},
                             [service.status, service.id], function(error, results) {
                                if (error) callback_1(true, {status: "error", message: "Updating error"});
                                else if(results.affectedRows>0) {
                                    callback_1(false, results);
                                } else callback_1(true, {status: "error", message: "Updating error"});
                            })
                        }
                    }
                ], function(error, result) {
                    callback(error, result);
                })
            }
        }   
    ], function(error, result) {
        if (error) pCallback(true, result);
        else pCallback(false, {status: "success", message: "successful"});
    })
}

module.exports = function (app, passport, db, WooCommerce, wordpress, domain, mainUrl, upload) {

    var connection = db.createConnection();
    var duplicateEmailCheck = function (tableName, tableColumn, value, done) {
        connection.query({sql: "SELECT email FROM ? WHERE email= ?"},
            [tableName, "'" + value + "'"],
            function (error, results, fields) {
                if (error) {
                    done(error.code, true);
                }
                else if (results.length > 0) {
                    done(null, true);
                }
                return done(null, false);
            });
    };
    passport.use(new LocalStrategy(function (username, password, done) {
        connection.query(
            {sql: 'SELECT username,id FROM users WHERE username = ? AND password = ?'},
            [username, password],
            function (error, rows, fields) {
                if (!rows) {
                    console.log("error authentication");
                    return done(null, false);
                }
                return done(null, rows[0]);
            });
    }));

    passport.serializeUser(function (user, done) {
        return done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        connection.query({sql: 'SELECT id,username FROM users WHERE id = ?'},
            [id], function (error, rows, fields) {
                if (!rows) return done(null, false);
                return done(null, rows[0]);
            });
    });
    
    app.post('/login', passport.authenticate('local'), function (req, res) {
        if (req.isAuthenticated()) {
            res.json({"authorization": "success"});
        } else {
            res.json({"authorization": "failure", "message": "Error authenticating user!"});
        }
    });
    
    app.post('/api/login', function (req, res) {
        var respone = {};

        if (req.body.username !== '' && req.body.password !== '') {
            const sqlQuery = 'SELECT username,id FROM users WHERE username = "${req.body.username}" AND password = "${req.body.password}"';
            const response = connection.query(sqlQuery,
                function (error, rows, fields) {
                if(JSON.stringify(rows[0]) !== undefined
        )
            {
                res.json(rows[0]);
            }
        else
            {
                console.log(error);
                res.json(JSON.stringify(error));
            }

        })
            ;

        } else {
            res.json({"authorization": "failure", "message": "username and password cant be empty"});
        }
    });

    router.post('/register', function(req, res) {        
        if (!req.body.params || !req.body.params.googleId) res.json({status: "error", message: "You haven't enought information for login"});
        else {
            var params = req.body.params;
            async.waterfall([
                function(callback) {
                    var sql = "SELECT id, role FROM users WHERE email=?";
                    connection.query({sql: sql},
                    [params.email], function(error, results, field) {
                        if (error) callback(null, true, {status: "error", message: "Sorry! We can't add your information now"});
                        else if (results.length>0) {
                            var user = results[0];
                            sql = "update users set familyName=?, givenName=?, imageUrl=?, googleId=? WHERE email=?";
                            connection.query({sql: sql}, 
                            [params.familyName, params.givenName, params.imageUrl, params.googleId, params.email], function(err, results) {
                                if (err) callback(null, true, {status: "error", message: "Sorry! We can't add your information now"});
                                else {
                                    if (user.role > 1)
                                        callback(null, true, {status: "pending", message: "Please contact with us for permission!"});
                                    else
                                        callback(null, true, {status: "success", user: user});        
                                }
                            });
                            
                        } else {
                            callback(null, false, {status: "error", message: "There isn't user on Dashboard"});
                        }
                    })        
                },
                function(err, msg, callback) {
                    if (err) callback(msg);
                    else {
                        var sql = "INSERT INTO users (googleId, email, familyName, givenName, imageUrl, accessToken, role) VALUES(?, ?, ?, ?, ?, ?, ?)";
                        connection.query({sql: sql},
                        [params.googleId, params.email, params.familyName, params.givenName, params.imageUrl, params.accessToken, 2], function(error, result, field) {
                            if (error) res.json({status: "error", message: "Sorry! We can't add your information now"});
                            else if (result.affectedRows>0) {
                                callback({status: "pending", user: {id: result.insertId, googleId: params.googleId, familyName: params.familyName, role: 2}});
                            } else {
                                callback({status: "error", message: "Sorry! We can't add you now"});
                            }
                        });
                    }
                }
            ], function(message) {
                res.json(message);
            })
        }        
    });

    router.post('/authenticate', function (req, res) {
        if ( !req.body.params || !req.body.params.id) res.json({status: "error", message: "Please Signin!"});
        else {
            var params = req.body.params;
            var sql = "SELECT id, role, googleId, imageUrl FROM users WHERE id=?";
            connection.query({sql: sql},
            [params.id], function(error, results, field) {
                if (error) res.json({status: "error", message: "Please Sign in!"});
                else if (results.length>0) {
                    var user = results[0];
                    if (user.role > 1)
                        res.json({status: "error", message: "Please contact with us for permission!"});
                    else
                        res.json({status: "success", user: user});
                } else {
                    res.json({status: "error", message: "Please Sign in!"});
                }
            }); 
        }
    })

    router.post('/permission', function (req, res) {
        if ( !req.body.params) res.json({status: "error", message: "Please type user email"});
        else {
            var params = req.body.params;
            async.waterfall([
                function(callback) {
                    var sql = "SELECT id, role FROM users WHERE email=?";
                    connection.query({sql: sql},
                    [params.email], function(error, results, field) {
                        if (error) callback(null, true, {status: "error", message: "Please Sign in!"});
                        else if (results.length>0) {
                            var user = results[0];
                            callback(null, false, results[0]);
                        } else {
                            callback(null, false, null);
                        }
                    });
                },

                function(err, user, callback) {
                    if (err) callback(null, true, user);
                    else {
                        if (user) {
                            connection.query({sql: "update users set role=1 where email=?"}, 
                            [params.email], function(error, results, field) {
                                if (error) callback(null, true, {status: "error", message: "Sorry! Please contact web master"});
                                else {
                                    callback(null, false, null);
                                }
                            });
                        } else if(params.email){
                            connection.query({sql: "insert into users (role, email) values(1, ?)"}, 
                            [params.email], function(error, results, field) {
                                if (error) callback(null, true, {status: "error", message: "Sorry! Please contact web master"});
                                else {
                                    callback(null, false, null);
                                }
                            });
                        } else {
                            callback(null, false, null);
                        }
                    }
                },

                function (err, msg, callback) {
                    if (err) callback(true, msg);
                    else {
                        var count = 0;
                        async.eachSeries(params.permissions, function(user, eachCallback) {
                            async.waterfall([
                                function(callback_1) {
                                    var sql = "update users set role=? where id=?"
                                    connection.query({sql: sql}, [ user.role ,user.id], function(err, results) {
                                        if (err) callback_1(true, {status: "error", message: "Sorry! Please contact Web master!"});
                                        else {
                                            callback_1(false, null);
                                        }
                                    })
                                }
                            ], function(err, msg) {
                                if (err) callback(true, msg);
                                else {
                                    count ++;
                                    if (count == params.permissions.length) callback(false, null);
                                    else eachCallback();
                                }
                            })
                        })
                    }
                    
                }
            ], function(err, msg) {
                if (err) res.send(msg);
                else res.send({status: "success", message: "Successful!"});
            })
             
        }
    })

    router.get('/users', function (req, res) {
        var sql = "SELECT id, concat(givenName, ' ', familyName ) name, aDate, permissions, role, email FROM users where role>0";
        connection.query({sql: sql},
        [], function(error, results, field) {
            if (error) res.json({status: "error", message: "Please Sign in!"});
            else if (results.length>0) {
                var users = [];
                results.forEach(user => {
                    users.push({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        cDate: user.aDate,
                        permissions: user.permissions,
                        role: user.role
                    });
                })
                res.json({status: "success", users: users});
            } else {
                res.json({status: "error", message: "Please Sign in!"});
            }
        });
    })
    
    //advertiser routing    
    router.route('/advertisers').get(Advertiser.getAdvertisers(connection))
    .post(Advertiser.createAdvertiser(connection, mainUrl))
    .put(Advertiser.updateAdvertiser(connection, mainUrl, WooCommerce))
    .delete(Advertiser.deleteAdvertiser(connection, mainUrl));

    //outlet routing
    router.route('/outlets').get(Outlet.getAll(connection, mainUrl))
    .post(Outlet.createOutlet(connection, mainUrl))
    .put(Outlet.updateOutlet(connection, mainUrl, WooCommerce))
    .delete(Outlet.deleteOutlet(connection));

    //service routing
    router.route('/services').get(Service.getAll(connection, WooCommerce, mainUrl))
    .post(Service.create(connection, WooCommerce, mainUrl))
    .put(Service.update(connection, WooCommerce, mainUrl))
    .delete(Service.delete(connection));

    //promo routing
    router.route('/promos').get(Promo.getAll(connection))
    .post(Promo.create(connection, WooCommerce))
    .put(Promo.update(connection, WooCommerce))
    .delete(Promo.delete(connection));

    router.post('/upload', upload.array('logoFile[]', 10), function (req, res) 
    {        console.log("image uploading");        //res.json({status: "success", imagepath: req.file.filename});

    var ocount = 0;        
    var imagePaths = [];        
    var adName = req.body.pretitle.toString();        
    adName = adName.replace(/ /g, "");        
    var sName = req.body.nexttitle.toString();        
    sName = sName.replace(/ /g, "");        
    var ind = 0;        
    async.eachSeries(req.files, function (file, eachCallback) {            
        async.waterfall([                
            function (callback) {                    
                var tmp_path = file.path;                    
                var image = fs.createReadStream(tmp_path);                    
                var image_ext = path.extname(tmp_path);                    
                var imageType = file['mimetype'];                    
                //var FileName = genrate_string();                    
                var FileName = adName;                    
                if (sName) FileName += '-' + sName;                    
                FileName += '-' + moment().format("YYYY-MM-DD-hh-mm-ss");                    
                ind++;                    
                if (req.files.length > 1)                        
                FileName += ind;
                const params = {                        
                    Bucket: "dailyvanitymedia",                        
                    Key: `sf/${FileName}`,                        
                    ACL: 'public-read',                        
                    ContentDisposition: `filename="${FileName}${image_ext}"`,                        
                    ContentType: imageType,                        
                    Body: image                    };                    
                    s3.putObject(params, function (err, data) {                        
                        if (err) {                            
                            callback(true, {                                
                                status: "failed",                                
                                message: "uploading failed"                            
                            });                        } 
                            else {                            
                                fs.unlinkSync(tmp_path);                            
                                callback(false, `https://s3-ap-southeast-1.amazonaws.com/dailyvanitymedia/sf/${FileName}`
                                );                        
                            }                    
                        });
            
                    }            
                ], 
            function (err, result) {                
                if (err) res.json(result);                
                else {                    
                    ocount++;                    
                    if (ocount == req.files.length) {                        
                        imagePaths.push(result);                        
                        res.json({                            
                            status: "success",                            
                            "imagepath": imagePaths                        
                        });                    
                    } else {                        
                        imagePaths.push(result);                        
                        eachCallback();                    
                    }                
                }           
             })       
             });    
            });

    router.route('/promos/:aid').get(function (req, res) {
        var advertiserId = null;
        if (req.query.aid) advertiserId = parseInt(req.query.aid);
        async.waterfall([
            function(callback) {
                var sql = "SELECT a.*, b.price oprice from promos as a \
                LEFT JOIN services as b on a.service_id=b.id \
                where b.advertiser_id=? ORDER BY a.status DESC, a.name";
                connection.query({sql: sql},
                [advertiserId],
                function (error, results, fields) {
                    if (error) {
                        callback(null, false, {"status": "error", "message": error.code});
                    } else {
                        _promos = [];
                        var laterRes = [];
                        if (results && results.length > 0) {
                            results.forEach(function (result) {
                                var row = {
                                    "id": result.id,
                                    "name": result.name,
                                    "status": result.status,
                                    "s_images": result.s_images,
                                    "featured": result.featured,
                                    "startdate": result.startdate,
                                    "enddate": result.enddate,
                                    "discount": result.discount,
                                    "advertiser_id": result.advertiser_id,
                                    "service_id": result.service_id,
                                    "price": result.price,
                                    "oprice": result.oprice,
                                    "outlets": result.outlets,
                                    "service_id": result.service_id,
                                    "status": result.status
                                };
                                if (result.status == 1 && moment().isBefore(moment(result.enddate)))
                                    _promos.push(row);
                                else {
                                    laterRes.push(row);
                                }
                            });                            
                        }
                        var fResult = _promos.concat(laterRes);
                        callback(null, fResult, {"status": "success", "promos": fResult});                     
                    }                    
                });    
            },
            function(items, msg, callback) {
                if (!items || items.length <=0) return callback(null, false, msg);
                var resArr = [];
                var oloop = 0;
                async.eachSeries(items, function(item, eachCallback) {
                    async.waterfall([
                        function(callback_1) {
                            connection.query({sql: "SELECT count(id) ocount from orders WHERE local_service_id=?"}, 
                            [item.service_id], function(error, result, filed) {
                                if (error) callback_1(true, null);
                                else {
                                    if (result.length>0 && result[0].ocount > 0) {
                                        item.ocount = result[0].ocount;
                                    } else {
                                        item.ocount = 0;
                                    }
                                    callback_1(false, item);
                                }
                            })
                        }
                    ], function(err, result) {
                        if (err) callback(null, false, {status: "error", message: "error on database"});
                        else {
                            oloop ++;
                            if (oloop == items.length) {
                                resArr.push(result);
                                callback(null, resArr, {status: "success", "promos": resArr});
                            } else {
                                resArr.push(result);
                                eachCallback();
                            }
                        }
                    })
                })
            },
            function(items, msg, callback) {
                if (!items) callback(false, msg);
                else {
                    var resArr = [];
                    var oloop = 0;
                    
                    async.eachSeries(items, function(item, eachCallback) {
                        async.waterfall([                            
                            function(callback_1) {
                                var sql = "SELECT sum(quantity) vcount, sum(redeemed) rcount FROM orders WHERE local_service_id=? GROUP BY email";
                                connection.query({sql: sql}, 
                                [item.service_id], function(error, result, filed) {
                                    if (error) callback_1(true, items);
                                    else {
                                        var _vcount = 0;
                                        var _rcount = 0;
                                        result.forEach(ii => {
                                            _vcount += ii.vcount;
                                            _rcount += ii.rcount;
                                        });
                                        item.vcount = _vcount;
                                        item.rcount = _rcount;
                                        callback_1(false, item);
                                    }
                                });                                
                            },
                        ], function(err, result) {
                            if (err) callback(false, {status: "error", message: "error on database"});
                            else {
                                oloop ++;
                                if (oloop == items.length) {
                                    resArr.push(result);
                                    callback(false, {status: "success", "promos": resArr});
                                } else {
                                    resArr.push(result);
                                    eachCallback();
                                }
                            }
                        })
                    })
                }
            }
        ], function(err, result) {
            res.json(result);
        })
    })

    router.route('/promos/usedoutlets/:sid').get(function(req, res) {
        var serviceId = req.params.sid;
        if (typeof serviceId == "undefined" || serviceId == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {
            async.waterfall([
                function(callback) {
                    var sql = "SELECT outlets, enddate FROM promos WHERE service_id=? and status=1"
                    connection.query({sql: sql}, [serviceId], function(err, results, filed) {
                        if (err) callback(null, false);
                        else {
                            var outletTemps = [];
                            if (results.length>0) {                                
                                results.forEach(result=> {
                                    var enddate = result.enddate? moment(result.enddate): moment();                                    
                                    if (result.outlets && result.outlets.length > 0) {
                                        var temp = result.outlets.split(",");
                                        if (moment().isBefore(enddate)) {
                                            temp.forEach(ii => {
                                                if (outletTemps.indexOf(ii) < 0) outletTemps.push(ii);
                                            });
                                        }
                                    }
                                })
                            }
                            callback(false, outletTemps);
                        } 
                    })
                }                
            ], function(err, result) {
                if (err) res.json({status: "error", message: "error is occured"});
                else res.json({status: "success", outlets: result});
            })
            
        }
    })

    // SEARCH ops

    router.route('/advertisers/search').get(function (req, res) {
        if (req.query.name != undefined && req.query.name != "") {
            connection.query({sql: "SELECT id, name, email, status, commission FROM advertisers WHERE name LIKE ?"},
                ['%' + req.query.name + '%'],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _advertisers = [];
                    results.forEach(function (result) {
                        _advertisers.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "email": result.email,
                            "commission": result.commission
                        })
                    });
                    res.json({"status": "success", "advertisers": _advertisers});
                });
        } else {
            res.json({"status": "error", "message": "Invalid search parameter"});
        }
    });

    router.route('/services/search').get(function (req, res) {

        if (req.query.name != undefined && req.query.name != "") {
            connection.query({sql: "SELECT id, name, status, type, subtype, price, terms FROM services WHERE name LIKE ?"},
                ['%' + req.query.name + '%'],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _services = [];
                    results.forEach(function (result) {
                        _services.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "type": result.type,
                            "subtype": result.subtype,
                            "price": result.price,
                            "terms": result.terms
                        })
                    });
                    res.json({"status": "success", "services": _services});
                });
        } else if (req.query.advertiser_id != undefined && req.query.advertiser_id != "") {
            connection.query({sql: "SELECT id, name, status, type, subtype, price, outlets, terms FROM services WHERE advertiser_id=? and status=1"},
                [req.query.advertiser_id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _services = [];
                    results.forEach(function (result) {
                        _services.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "type": result.type,
                            "subtype": result.subtype,
                            "price": result.price,
                            "outlets": result.outlets,
                            "terms": result.terms
                        })
                    });
                    res.json({"status": "success", "services": _services});
                });
        } else if (req.query.id != "null" && req.query.id != "" && req.query.id != undefined) {
            connection.query({sql: "SELECT * FROM services WHERE id=?"},
                [req.query.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _services = [];
                    results.forEach(function (result) {
                        _services.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "type": result.type,
                            "subtype": result.subtype,
                            "price": result.price,
                            "descr": result.descr,
                            "woo_id": result.woo_id,
                            "duration": result.duration,
                            "s_images": result.s_images,
                            "terms": result.terms
                        })
                    });                    
                    res.json({"status": "success", "services": _services});
                });
        } else if (req.query.service_id != "null" && req.query.service_id != "" && req.query.id != undefined) {
            connection.query({sql: "SELECT * FROM services WHERE id=?"},
                [req.query.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _services = [];
                    results.forEach(function (result) {
                        _services.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "type": result.type,
                            "subtype": result.subtype,
                            "price": result.price,
                            "descr": result.descr,
                            "woo_id": result.woo_id,
                            "duration": result.duration,
                            "s_images": result.s_images,
                            "terms": result.terms
                        })
                    });                    
                    res.json({"status": "success", "services": _services});
                });
        }else {
            res.json({"status": "error", "message": "Invalid search parameter"});
        }
    });

    router.route('/outlets/search').get(function (req, res) {
        if (req.query.name != undefined && req.query.name != "") {
            connection.query({sql: "SELECT id, name, creditcard, ophours, status FROM outlets WHERE name LIKE ?"},
                ['%' + req.query.name + '%'],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _outlets = [];
                    results.forEach(function (result) {
                        _outlets.push({
                            "id": result.id,
                            "name": result.name,
                            "creditcard": result.creditcard,
                            "ophours": result.ophours,
                            "status": result.status
                        })
                    });
                    res.json({"status": "success", "outlets": _outlets});
                });
        } else if (typeof req.query.advertiser_id != "undefined" || req.query.advertiser_id == "") {
            connection.query({sql: "SELECT * FROM outlets WHERE `advertiser_id`= ?"},
                [req.query.advertiser_id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _outlets = [];
                    results.forEach(function (result) {
                        _outlets.push({
                            "id": result.id,
                            "name": result.name,
                            "creditcard": result.creditcard,
                            "ophours": result.ophours,
                            "status": result.status,
                            "linked_services": result.linked_services,
                            "address": result.address,
                            "postalcode": result.postalcode
                        })
                    });                    
                    res.json({"status": "success", "outlets": _outlets});
                });
        } else {
            res.json({"status": "error", "message": "Invalid search parameter"});
        }
    });
    router.route('/promos/search').get(function (req, res) {
        if (req.query.name != undefined && req.query.name != "") {
            connection.query({sql: "SELECT id, name, status, s_images, featured, startdate, enddate, discount FROM promos WHERE name LIKE ?"},
                ['%' + req.query.name + '%'],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _promos = [];
                    results.forEach(function (result) {
                        _promos.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "featured": result.featured,
                            "images": result.s_images,
                            "startdate": result.startdate,
                            "enddate": result.enddate,
                            "discount": result.discount
                        })
                    });
                    res.json({"status": "success", "promos": _promos});
                });
        } else if (typeof req.query.service_id != "undefined" || req.query.service_id == "") {
            connection.query({sql: "SELECT id, name, status, s_images, featured, startdate, enddate, discount FROM promos WHERE `service_id`= ?"},
                [req.query.service_id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    _promos = [];
                    results.forEach(function (result) {
                        _promos.push({
                            "id": result.id,
                            "name": result.name,
                            "status": result.status,
                            "featured": result.featured,
                            "images": result.s_images,
                            "startdate": result.startdate,
                            "enddate": result.enddate,
                            "discount": result.discount
                        })
                    });
                    res.json({"status": "success", "promos": _promos});
                });
        } else {
            res.json({"status": "error", "message": "Invalid search parameter"});
        }
    });

    // Individual records

    router.route('/outlet/:oid').get(function (req, res) {
        if (typeof req.params.oid == "undefined" || req.params.oid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Outlet ID"
            });
        } else {
            var sendKeys = ["id", "name", "descr", "advertiser_id", "email", "phone", "address", "postalcode", "ophours", "creditcard", "status", "s_images", "s_images_path", "outlet_code"];
            connection.query({sql: "SELECT " + sendKeys.join(",") + " FROM outlets WHERE `id`= ?"},
                [req.params.oid],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    if (results.length > 0) {
                        res.json({
                            "status": "success", "outlet": {
                                "id": results[0].id,
                                "name": results[0].name,
                                "descr": results[0].descr,
                                "advertiser_id": results[0].advertiser_id,
                                "email": results[0].email,
                                "phone": results[0].phone,
                                "address": results[0].address,
                                "postalcode": results[0].postalcode,
                                "ophours": results[0].ophours,
                                "creditcard": results[0].creditcard,
                                "status": results[0].status,
                                "s_images": results[0].s_images,
                                "s_images_path": results[0].s_images_path,
                                "outlet_code": results[0].outlet_code
                            }
                        });
                    }
                    else res.json({status: "success", outlet: null});
                });
        }
    })
    .post(function (req, res) {
        if (typeof req.params.oid == "undefined" || req.params.oid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {
            async.waterfall([
                function(callback) {
                    connection.query({sql: "update outlets set status=2 where id=?"}, [req.params.oid], function(error, results) {
                        if (error) callback(null, true, {status: "error", message: "Failed activation of outlet"});
                        else if (results.affectedRows > 0) callback(null, false, null);
                        else callback(null, true, {status: "error", message: "Failed activation of outlet"});
                    });
                },
                function(error, message, callback) {
                    res.json({status: "pending", message: "The outlet is pending now"});
                    if (error) callback(error, message);
                    else {                        
                        doActivateOutlet({id: req.params.oid, status: req.body.status}, connection, mainUrl, function(err, result) {
                            callback(err, result);
                        })
                    }
                }
            ], function(error, result) {
                req.io.emit("activatingOutlet", result);
            })
            
        }
    });


    router.route('/promo/:pid').get(Promo.get(connection))
    .post(Promo.activate(connection, WooCommerce));

    router.route('/service/:sid').get(function (req, res) {
        if (typeof req.params.sid == "undefined" || req.params.sid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Service ID"
            });
        } else {
            var sendKeys = ["id", "name", "descr", "price", "type", "subtype", "terms", "status", "duration", "s_images", "outlets"];
            connection.query({sql: "SELECT " + sendKeys.join(",") + " FROM services WHERE id= " + req.params.sid},
                [],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    } else {
                        if (results.length > 0) {
                            res.json({
                                "status": "success", "service": {
                                    "id": results[0].id,
                                    "name": results[0].name,
                                    "descr": results[0].descr,
                                    "price": results[0].price,
                                    "type": results[0].type,
                                    "subtype": results[0].subtype,
                                    "terms": results[0].terms,
                                    "status": results[0].status,
                                    "duration": results[0].duration,
                                    "s_images": results[0].s_images,
                                    "outlets": results[0].outlets
                                }
                            });
                        } else {
                            res.json({"status": "success", "service": []});
                        }                        
                    }                    
                });
        }
    }) // advtive and deactive processing
    .post(function (req, res) {
        if (typeof req.params.sid == "undefined" || req.params.sid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {            
            async.waterfall([
                function(callback) {
                    connection.query({sql: "update services set status=? where id=?"},
                    [2, req.params.sid], function(error, results) {
                       if (error) callback(null, true, null, {status: "error", message: "Updating error"});
                       else if(results.affectedRows>0) {
                           callback(null, false, null, results);
                       } else callback(null, true, null, {status: "error", message: "Updating error"});
                   })
                },
                function(error, msg, pending, callback) {
                    res.json({status: 'pending', message: 'The service is pending'});
                    if (error) return callback(null, error, msg);
                    var sql = "SELECT woo_id swId, variations FROM services WHERE id=?";
                    connection.query({sql: sql}, [req.params.sid], 
                    function(err, results) {
                        if (err) callback(null, false, {status: "error", message: "The promo isn't on Server"});
                        else if (results.length > 0) {
                            callback(null, results[0], null);
                        } else {
                            callback(null, false, {status: "error", message: "The promo isn't on Server"});
                        }
                    });
                },
                function(item, msg, callback) {
                    if (!item) callback(null, true, msg);
                    else {                        
                        var data = {
                            swId: item.swId,
                            id: req.params.sid,
                            status: req.body.status,
                            variations: item.variations                            
                        };
                        
                        doActivateService(data, connection, function(err, result) {
                            callback(err, result);
                        })
                    }
                }
            ], function(err, result) {
                req.io.emit('activatingService', result);                
            });
        }
    });

    router.route('/advertiser/:aid').get(function (req, res) {        
        var sendKeys = ["id", "name", "email", "status", "terms", "commission", "descr", "s_images", "host_url"];
        var sql = "SELECT " + sendKeys.join(",") + " FROM advertisers WHERE id=? order by status desc, name";
        if (typeof req.params.aid == "undefined" || req.params.aid == "" || req.params.aid == "undefined" || !req.params.aid) {
            sql = "SELECT * FROM advertisers AS a \
            INNER JOIN (SELECT MAX(id) id FROM advertisers where status=1) AS b on a.id=b.id";
        }

        connection.query({sql: sql},
        [req.params.aid],
        function (error, results, fields) {
            if (error) {
                res.json({"status": "error", "message": error.code});
            }
            if (results && results.length > 0) {
                res.json({
                    "status": "success", "advertiser": {
                        "id": results[0].id,
                        "name": results[0].name,
                        "email": results[0].email,
                        "terms": results[0].terms,
                        "status": results[0].status,
                        "commission": results[0].commission,
                        "descr": results[0].descr,
                        "s_images": results[0].s_images,
                        "host_url": results[0].host_url
                    }
                });
            } else {
                res.json({status: "error", "message": "there isn't advertiser now"});
            }                    
        });
    })
    .post(function (req, res) {
        if (typeof req.params.aid == "undefined" || req.params.aid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {
            async.waterfall([
                function(callback) {
                    var sql = "Update advertisers set status=2 WHERE id=?";
                    connection.query({sql: sql}, [req.params.aid], 
                    function(err, results) {
                        if (err) res.json({"status": "error", "message": "Failed updating" });
                        else if (results.affectedRows > 0) {
                            res.json({"status": "pending", "message": "The advertiser is pending now" });
                        } else {
                            res.json({"status": "error", "message": "Failed updating" });
                        }
                        callback(null);
                    });
                },
                function(callback) {
                    var sql = "SELECT id FROM outlets WHERE advertiser_id=? and status=?";
                    connection.query({sql: sql}, [req.params.aid, req.body.status? 0: 1], 
                    function(err, results) {
                        if (err) callback(null, false, false);
                        else if (results.length > 0) {
                            callback(null, results, null);
                        } else {
                            callback(null, false, true);
                        }
                    });
                },                
                function(outlets, msg, callback) {
                    if (!outlets) callback(null, false, msg);
                    else {
                        var step = 0;
                        async.eachSeries(outlets, function(outlet, eachCallback) {
                            async.waterfall([
                                function(callback_1) {
                                    doActivateOutlet({id: outlet.id, status: req.body.status}, connection, mainUrl, function(error, result) {
                                        callback_1(error, result)
                                    });
                                }
                            ], function(error, result) {
                                if (error) callback(null, false, true);
                                else {
                                    step ++;
                                    if (step == outlets.length) callback(null, true, null);
                                    else eachCallback();
                                }
                            });
                        });
                    }
                }, // update service
                function(item, flag, callback) {
                    if(!item && !flag) callback(null, false, false);
                    else {
                        var sql = "SELECT id, woo_id, variations FROM services WHERE advertiser_id=? and status=?";
                        connection.query({sql: sql}, [req.params.aid, req.body.status? 0: 1], 
                        function(err, results) {
                            if (err) callback(null, false, false);
                            else if (results.length > 0) {
                                callback(null, results, null);
                            } else {
                                callback(null, false, true);
                            }
                        });
                    }
                },
                function(services, flag, callback) {
                    if (!services) callback(null, false, flag);
                    else {
                        var step = 0;
                        async.eachSeries(services, function(service, eachCallback) {
                            async.waterfall([
                                function(callback_1) {
                                    doActivateService({id: service.id, status: req.body.status, swId: service.woo_id, variations: service.variations}, connection, function(error, result) {
                                        callback_1(error, result)
                                    });
                                }
                            ], function(error, result) {
                                if (error) callback(null, false, true);
                                else {
                                    step ++;
                                    if (step == services.length) callback(null, true, null);
                                    else eachCallback();
                                }
                            });
                        });
                    }
                },
                function(item, flag, callback) {
                    if (!item && !flag) callback(true, {status: "error", message: "Error on activating"});
                    else {
                        async.waterfall([
                            function(callback_1) {
                                var data = {
                                    id: req.body.awId,
                                    authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                                    fields : {
                                        "is_active": req.body.status? "Active": "Inactive"
                                    }
                                }
                                axios.put(mainUrl + '/wp-json/wp/v2/new_merchant', data
                                ).then(function (response) {
                                    if (response.data && response.data.id) {
                                        callback_1(null, false);
                                    } else {
                                        callback_1(null, true);
                                    }
                                }).catch(function (error) {
                                    callback_1(null, true);
                                });
                            },
                            function(error, callback_1) {
                                if (error) callback_1(true, {status: "error", message: "Error on activating"});
                                else {
                                    var sql = "Update advertisers set status=? where id=?"
                                    connection.query({sql: sql},
                                    [req.body.status, req.params.aid],
                                    function (error, results, fields) {
                                        if (error) {
                                            callback_1(true, {"status": "error", "message": error.code});                                            
                                        } else if (results.affectedRows > 0) callback_1(false, null);
                                        else callback_1(true, {"status": "error", "message": error.code});
                                    });                                            
                                }
                            }
                        ], function(error, result) {
                            callback(error, result);
                        })
                    }
                }
            ], function(err, result) {
                req.io.emit('activatingAdvertiser', result);
            });
        }
    });
    // Linked Services
    router.route('/advertisers/linked_services').get(function (req, res) {
        if (typeof req.query.id == "undefined" || req.query.id == "") {
            res.json({
                "status": "error",
                "message": "Invalid Advertiser ID"
            });
        } else {
            connection.query({sql: "SELECT linked_services FROM advertisers WHERE id=?"},
                [req.query.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    var ids = results[0].linked_services;
                    if (ids == null || ids == "" || ids == "") {
                        res.json({"status": "success", "services": []});
                    }

                    connection.query({sql: "SELECT id,name FROM services WHERE id IN (" + ids + ")"},
                        [],
                        function (error, results, fields) {
                            if (error) {
                                res.json({"status": "error", "message": error.code});
                            }
                            var _services = [];
                            results.forEach(function (result) {
                                _services.push({
                                    "id": result.id,
                                    "name": result.name
                                })
                            });
                            res.json({"status": "success", "services": _services});
                        });
                });
        }
    }).put(function (req, res) {
        if (typeof req.body.id == "undefined" || req.body.id == "" || typeof req.body.linked == "undefined" || req.body.linked == "") {
            res.json({
                "status": "error",
                "message": "Invalid Advertiser ID"
            });
        }
        else {
            connection.query({sql: "UPDATE advertisers SET linked_services=? WHERE id=?"},
                [req.body.linked, req.body.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    res.json({"status": "success", "message": "Updated service successfully"});
                });
        }
    });
    router.route('/outlets/linked_services').get(function (req, res) {
        if (typeof req.query.id == "undefined" || req.query.id == "") {
            res.json({
                "status": "error",
                "message": "Invalid Outlet ID"
            });
        } else {
            connection.query({sql: "SELECT linked_services FROM outlets WHERE id=?"},
                [req.query.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    var ids = results[0].linked_services;
                    if (ids == null || ids == "") {
                        res.json({"status": "success", "services": ""});
                    }

                    connection.query({sql: "SELECT id,name FROM services WHERE id IN (" + ids + ")"},
                        [],
                        function (error, results, fields) {
                            if (error) {
                                res.json({"status": "error", "message": error.code});
                            }
                            var _services = [];
                            results.forEach(function (result) {
                                _services.push({
                                    "id": result.id,
                                    "name": result.name
                                })
                            });
                            res.json({"status": "success", "services": _services});
                        });
                });
        }
    }).put(function (req, res) {
        if (typeof req.body.id == "undefined" || req.body.id == "" || typeof req.body.linked == "undefined" || req.body.linked == "") {
            res.json({
                "status": "error",
                "message": "Invalid Outlet ID"
            });
        }
        else {
            connection.query({sql: "UPDATE outlets SET linked_services=? WHERE id=?"},
                [req.body.linked, req.body.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    res.json({"status": "success", "message": "Updated outlet successfully"});
                });
        }
    });   

    // Dashboard
    router.route('/dashboard/advertisers').get(function (req, res) {
        var sql = "SELECT a.id, a.name, a.email,a.terms, a.descr, a.host_url, a.woo_id, a.s_images, a.status, a.commission, b.ocount FROM `advertisers` as a \
            left JOIN ( \
                SELECT d.id id, COUNT(c.id) ocount from outlets as c \
                LEFT JOIN advertisers as d on c.advertiser_id = d.id GROUP BY d.id \
            ) as b on a.id=b.id ORDER BY status DESC, a.name";
        async.waterfall([
            function(callback) {
                connection.query({sql: sql},
                    [],
                    function (error, results, fields) {
                        if (error) {
                            return callback(null, null, {"status": "error", "message": error.code});
                        }                
                        _advertisers = [];
                        results.forEach(function (result) {
                            _advertisers.push({
                                "id": result.id,
                                "name": result.name,
                                "status": result.status,
                                "email": result.email,
                                "commission": result.commission,                                
                                "nooutlets": result.ocount,
                                "host_url": result.host_url,
                                "wId": result.woo_id,
                                "terms": result.terms,
                                "descr": result.descr,
                                "s_images": result.s_images
                            })
                        });
                        callback(null, _advertisers, {"status": "success", "advertisers": _advertisers});
                    });
            },            
            function(items, msg, callback) {
                if (!items) return callback(null, false, {"status": "failed", "message": "Advertiser isn't on database"});
                connection.query({sql: "SELECT count(id) scount, advertiser_id aid from services GROUP BY advertiser_id"},
                [],
                function (error, results, fields) { 
                    if (error) return callback(null, true, null);

                    var aids = [];
                    var scounts = [];
                    if (results.length > 0) {
                        
                        results.forEach(result=> {
                            aids.push(result.aid);
                            scounts.push(result.scount);
                        });                        
                    } 
                    var advertiserWithScounts = [];
                    if (items.length > 0) {                        
                        items.forEach(item => {
                            var indexAdvertiser = aids.indexOf(item.id);
                            if (indexAdvertiser >= 0) {
                                item.scount = scounts[indexAdvertiser];
                            } else {
                                item.scount = 0;
                            }
                            advertiserWithScounts.push(item);
                        })
                    }
                    callback(false, advertiserWithScounts, {status: "success", "message": "success"});
                });
            },
            function(items, msg, callback) {
                if (!items) return callback(true, null);
                connection.query({sql: "SELECT count(id) pcount, advertiser_id aid from promos GROUP BY advertiser_id"},
                [],
                function (error, results, fields) { 
                    if (error) callback(true, null);

                    var aids = [];
                    var pcounts = [];
                    if (results.length > 0) {
                        
                        results.forEach(result=> {
                            aids.push(result.aid);
                            pcounts.push(result.pcount);
                        });                        
                    } 
                    var advertiserWithPcounts = [];
                    if (items.length > 0) {                        
                        items.forEach(item => {
                            var indexAdvertiser = aids.indexOf(item.id);
                            if (indexAdvertiser >= 0) {
                                item.pcount = pcounts[indexAdvertiser];
                            } else {
                                item.pcount = 0;
                            }
                            advertiserWithPcounts.push(item);
                        })
                    }
                    callback(false, advertiserWithPcounts);
                });
            }
        ], function(error, result) {
            if (error) res.json({status: "failed", message: "Getting advertisers is failed"});
            else res.json({status: "success", advertisers: result});
        });
        
    });

    router.route('/dashboard/services').get(function (req, res) {  
        //if (!req.query.aid) return res.json({status: "failed", message: "advertiser id is null"});        
        var advertiserId = req.query.aid;        
        async.waterfall([
            function(callback) { // get services data
                var sql = "SELECT * FROM services WHERE advertiser_id=? order by status desc, name";
                if (!advertiserId)
                    sql = "SELECT * FROM services WHERE 1 order by status desc, name";
                connection.query({sql: sql}, [advertiserId],
                function (error, results, fields) {
                    if (error) {
                        return callback(null, null, {"status": "error", "message": error.code});
                    } else if (results.length > 0) {
                        _services = [];
                        results.forEach(function (result) {
                            var outlets = result.outlets? result.outlets.split(","): []; 
                            
                            _services.push({
                                "id": result.id,
                                "name": result.name,
                                "status": result.status,
                                "type": result.type,                            
                                "subtype": result.subtype,
                                "price": result.price,
                                "advertiser_id": result.advertiser_id,
                                "outlets": result.outlets,
                                "duration": result.duration                           
                            })
                        });
                        callback(null, _services, null);
                    } else {
                        callback(null, false, {status: "error", message: "There isn't a service"});
                    }
                    
                });               
            },            
            function(services, msg, callback) { // promo datas
                if (!services) return callback(null, null, msg);
                var step1 = 0;
                var resServices = [];
                async.eachSeries(services, function(service, eachCallback) {
                    async.waterfall([
                        function(callback_1) {
                            var sql = "SELECT count(id) oNum FROM outlets WHERE id in ("+ service.outlets+") AND `status`=1";
                            connection.query({sql: sql}, [service.outlets], function(error, results, fields) {
                                if (error) callback_1(null, true, {status: "error", "message": "Sorry! You can't get data from server"});
                                else {
                                    service.outletNum = results[0].oNum;
                                    callback_1(null, false, null);
                                }
                            })
                        },
                        function(error, msg, callback_1) {
                            if (error) return callback_1(null, false, {status: "error", message: "Error fetching data"});
                            var sql = "SELECT price, startdate, enddate FROM promos WHERE service_id=? AND `status`=1";
                            connection.query({sql: sql}, [service.id], function(error, results, fields) {
                                if (error) callback_1(true, {status: "error", "message": "Sorry! You can't get data from server"});
                                else {
                                    var promoNum = 0;
                                    var price = 0;
                                    var enddate = '';
                                    if (results.length > 0) {
                                        results.forEach(result => {
                                            if (moment(result.startdate).isBefore(moment()) && moment(result.enddate).isAfter(moment())) {
                                                promoNum++;
                                                enddate = result.enddate;
                                                price = result.price;
                                            }
                                        });                                        
                                    }
                                    service.promoNum = promoNum;
                                    service.new_price = price;
                                    service.deadline = enddate;
                                    callback_1(null, service, null);
                                }
                            })
                        },
                        function(item, msg, callback_1) {
                            if (!item) return callback_1(null, null, msg);
                            var sql = "SELECT a.pNum, b.rNum FROM \
                            (SELECT SUM(quantity) pNum, local_service_id sid FROM orders WHERE local_service_id=?) as a \
                            LEFT JOIN (SELECT SUM(redeemed) rNum, local_service_id sid FROM orders WHERE local_service_id=? AND redeemed>0) AS b on a.sid=b.sid";
                            connection.query({sql: sql}, [item.id, item.id], function(error, results, fields) {
                                if (error) callback_1(null, null, {status: "error", "message": "Sorry! You can't get data from server"});
                                else {
                                    var pNum = rNum = 0;
                                    if (results.length > 0) {
                                        pNum = results[0].pNum;
                                        rNum = results[0].rNum;
                                    }
                                    item.pNum = pNum;
                                    item.rNum = rNum;
                                    callback_1(null, item, null);
                                }
                            })
                        },
                        function(item, msg, callback_1) {
                            if (!item) callback_1(null, msg);
                            else {
                                var sql = "SELECT * FROM orders WHERE local_service_id=?";
                                connection.query({sql: sql},
                                [item.id], function(error, result, fields) {
                                    if (error) callback_1(null, msg);
                                    else {
                                        var temp = [];
                                        if (result.length > 0) {
                                            result.forEach(row => {
                                                temp.push({
                                                    name: row.customer,
                                                    email: row.email,
                                                    pDate: moment(row.aDate).format("DD/MM/YYYY hh:mm:a"),
                                                    rStatus: row.redeemed? "Redeemed at " + moment(row.redeemption).add(8, 'hours').format("DD/MM/YYYY") : ""
                                                });
                                            });
                                        }
                                        item.csvData = temp;
                                        callback_1(item, null);
                                    }
                                });
                            }
                        }
                    ], function(result, msg) {
                        if (!result) callback(true, result);
                        else {
                            step1++;
                            if (step1 == services.length) {
                                resServices.push(result);
                                callback(false, resServices);
                            } else {
                                resServices.push(result);
                                eachCallback();
                            }
                        }
                    });
                })
            }
        ], function (err, result) {
            if (err) res.json({status: "failed", msg: "getting services failed"});
            else res.json({status: "success", services: result});
        });                
    });

    //finance api
    router.route('/finances').get(function (req, res) {
        async.waterfall([
            //get advertiser and services that related to advertiser
            function(callback) {
                var sql = "SELECT GROUP_CONCAT(b.id) sids, a.name, a.id, a.status, a.commission FROM advertisers as a \
                INNER JOIN services as b on a.id=b.advertiser_id WHERE 1 GROUP BY a.id order by a.status desc, a.name";
                connection.query({sql: sql}, function(error, results, field) {
                    if (error) callback(null, false, {status: "error", message: "Can't get data from server"});
                    else {
                        if (results && results.length>0) {
                            var tempItems = [];
                            results.forEach(result => {
                                tempItems.push({
                                    id: result.id,
                                    name: result.name,
                                    status: result.status,
                                    service_ids: result.sids,
                                    commission: result.commission
                                });
                            });
                            callback(null, tempItems, {status: "success", message: "Getting advertisers and service successfully"});
                        } else {
                            callback(null, false, {status: "error", message: "There isn't data"});
                        }
                    }
                });
            },  // calculate total purchase
            function (items, msg, callback) {
                if (!items) return callback(null, false, {status: "error", message: "Can't get data from server"});
                
                var step1 = 0;
                var tempItems = [];
                async.eachSeries(items, function(item, eachCallback) {
                    async.waterfall([
                        function(callback_1) {
                            var service_ids = item.service_ids.split(",");
                            var tempServiceids = [];
                            service_ids.forEach(ss => {
                                tempServiceids.push(parseInt(ss));
                            });
                            var sql = "SELECT SUM(b.price*b.quantity) total, SUM(b.quantity) pNum, a.advertiser_id FROM services as a \
                            LEFT JOIN orders as b on a.id=b.local_service_id \
                            WHERE a.id in (" + item.service_ids +") AND b.canceled=0 GROUP BY a.advertiser_id";
                            connection.query({sql: sql}, [tempServiceids.join(",")], function(error, results, field) {
                                if (error) callback_1(null, false, {status: "error", message: "Can't get data from server"});
                                else {
                                    if (results && results.length>0) {
                                        item.total = results[0].total;
                                        item.pNum = results[0].pNum;
                                        callback_1(null, item, {status: "success", message: "Getting advertisers and service successfully"});
                                    } else {
                                        callback_1(null, false, {status: "error", message: "There isn't data"});
                                    }
                                }    
                            })
                        }, // calculate total redeemed
                        function(tempItem, msg, callback_1) {
                            var sql = "SELECT SUM(b.price*b.redeemed) rTotal, SUM(b.redeemed) rNum, a.advertiser_id FROM services as a \
                            LEFT JOIN orders as b on a.id=b.local_service_id \
                            WHERE a.id in (" + item.service_ids +") AND b.redeemed>0  AND b.canceled=0 GROUP BY a.advertiser_id";
                            connection.query({sql: sql}, [item.service_ids], function(error, results, field) {
                                if (error) callback_1(null, tempItem, {status: "error", message: "Can't get data from server"});
                                else {
                                    if (results && results.length>0) {
                                        item.rTotal = parseFloat(results[0].rTotal) * (100-parseInt(tempItem.commission))/100;
                                        item.rNum = results[0].rNum;
                                        callback_1(null, item, {status: "success", message: "Getting advertisers and service successfully"});
                                    } else {
                                        callback_1(null, item, {status: "error", message: "There isn't data"});
                                    }
                                }    
                            });
                        }, // calculate paid
                        function(tempItem, msg, callback_1) {
                            var sql = "SELECT a.price, COUNT(b.id) quantity FROM orders as a \
                                    INNER JOIN voucher_code as b on a.id=b.order_id \
                                    WHERE b.state=2 AND a.local_service_id in ("+ item.service_ids +") \
                                    GROUP BY a.id";
                            connection.query({sql: sql}, [item.service_ids], function(error, results, field) {
                                if (error) callback_1(tempItem, {status: "error", message: "Can't get data from server"});
                                else {
                                    if (results) {
                                        var paid = 0;
                                        results.forEach(result => {
                                            paid += parseFloat(result.price)*parseInt(result.quantity)*(100 - parseInt(tempItem.commission))/100;
                                        })                                        
                                        item.paid = paid;
                                        callback_1(item, {status: "success", message: "Getting advertisers and service successfully"});
                                    }
                                }    
                            });
                        }
                    ], function(item, message) {
                        step1 ++;
                        if (step1 == items.length) {
                            tempItems.push(item);
                            callback(false, tempItems);
                        } else {
                            tempItems.push(item);
                            eachCallback();
                        }                        
                    });
                })                
            }
        ], function(err, result) {
            if (err) res.json({status: "error", message: result});
            else res.json({status: "success", finances: result});
        })
    })
    .put(function(req, res) {
        if (!req.body.params) res.json({status: "error", message: "You haven't wrong request"});
        else {
            var params = req.body.params;
            var sql = "UPDATE voucher_code SET state=2, paid_date=? WHERE id in (?)";
            if (params.option == "expirey_date")
                sql = "UPDATE voucher_code SET state=0, expirey_date=? WHERE id in (?)";
            connection.query({sql: sql}, [moment(params.paidDate).format(), params.ids], 
            function(error, result, field) {
                if (error) res.json({statue: "error", message: "Sorry! now You can't cancel the transaction"});
                else if (result.affectedRows > 0) res.json({status: "success", message: "Success of canceling the transaction"});
                else res.json({status: "error", message: "The transaction isn't on Dashboard"});
            })
        }
    });

    router.route('/finance/:aid').get(function (req, res) {
        if (req.params.aid == "" && req.params.aid == "undefined") {
            return res.json({status: "error", message: "You have wrong request"});
        }

        async.waterfall([
            //get advertiser and services that related to advertiser
            function(callback) {
                var sql = "SELECT a.*, b.price, b.email, a.cancel_date, c.id s_id, o.name outletname FROM voucher_code as a \
                INNER JOIN orders as b on a.order_id=b.id \
                INNER JOIN services as c on b.local_service_id=c.id \
                LEFT JOIN outlets as o on o.id = a.outlet\
                WHERE c.advertiser_id=?  ORDER BY purchase_date desc";
                connection.query({sql: sql}, [req.params.aid], function(error, results, field) {
                    if (error) callback(false, {status: "error", message: "Can't get data from server"});
                    else {
                        if (results && results.length>0) {
                            var tempItems = [];
                            results.forEach(result => {
                                tempItems.push({
                                    id: result.id,
                                    name: result.service_id,
                                    vcode: result.voucher,
                                    state: result.state,
                                    commission: result.commission,
                                    email: result.email,
                                    price: result.price,
                                    cDate: result.cancel_date,
                                    quantity: 1,
                                    pDate: result.purchase_date,
                                    redeemption: result.redeemption_date,
                                    paidDate: result.paid_date,
                                    service_id: result.s_id,
                                    customer: result.first_name + ' ' + result.last_name,
                                    advertiserId: req.params.aid,
                                    expireyDate: result.expirey_date,
                                    outletname: result.outletname                                    
                                });
                            });
                            callback(tempItems, {status: "success", message: "Getting advertisers and service successfully"});
                        } else {
                            callback(false, {status: "error", message: "There isn't data"});
                        }
                    }
                });
            }
        ], function(item, result) {
            if (!item) res.json({status: "error", message: result});
            else res.json({status: "success", finances: item});
        })
    })
    .delete(function(req, res) {
        if (req.params.aid == "" && req.params.aid == "undefined") {
            return res.json({status: "error", message: "You have wrong request"});
        }
        console.log(req.params.aid)
        
        var cancelDate = moment().format();
        //connection.query({sql: "UPDATE orders SET `canceled`=1, cancel_date=? WHERE id=?"}, [cancelDate, req.params.aid],
        async.waterfall([
            function(callback) {
                connection.query({sql:  "UPDATE voucher_code SET `state`=3, cancel_date=? WHERE id=?"}, [moment(cancelDate).format('D MMM YYYY hh:mm A'),req.params.aid], 
                function(error, result, field) {
                    console.log(result)
                    if (error) callback(null, false, {statue: "error", message: "Sorry! now You can't cancel the transaction"});
                    else if (result.affectedRows > 0) callback(null, true, {status: "success", message: "Success of canceling the transaction"});
                    else callback(null, false, {status: "error", message: "The transaction isn't on Dashboard"});
                });
            },
            function(flag, msg, callback) {
                if (!flag) callback(null, flag, msg);
                else {
                    var sql = "SELECT a.*, b.name as adName, c.email as userEmail, c.adate purchaseDate, c.customer FROM voucher_code as a \
                    LEFT JOIN advertisers AS b on a.advertiser_id=b.id \
                    LEFT JOIN orders as c on a.order_id=c.id \
                    WHERE a.id=?"
                    connection.query({sql: sql}, [req.params.aid], function(error, results) {
                        console.log(results)
                        if (error) callback(null, false, {statue: "error", message: "Sorry! now You can't send email"});
                        else if (results.length > 0) callback(null, results[0], {status: "success", message: "Success of canceling the transaction"});
                        else callback(null, false, {status: "error", message: "The transaction isn't on Dashboard"});
                    })
                }
            },
            function(item, msg, callback) {
            if (!item) callback(null, item, msg);
                else {
                    var sql = "SELECT ad.id, outs.email outletsemails FROM `advertisers` as ad left join outlets as outs on outs.advertiser_id = ad.id where ad.name = ?";
                    connection.query({sql: sql}, [item.adName], function(error, results) {
                        if (error) callback(null, false, {statue: "error", message: "Sorry! now You can't send email"});
                        else if (results.length > 0){
                            item.outletsemails = results
                            callback(null, item, {status: "success", message: "Success of canceling the transaction"});
                        } 
                        else callback(null, false, {status: "error", message: "The transaction isn't on Dashboard"});
                        });
                    }
                },   
                function(item, msg, callback) {
                if (!item) callback(null, false, msg);
                else {
                    var mailData = {
                        vcode: item.voucher,
                        advertiserName: item.adName,
                        outletName: item.outlet_name,
                        serviceName: item.service_id,
                        userEmail: item.userEmail,
                        purchaseDate: moment(item.purchaseDate).format("D MMM YYYY"),
                        customer: item.customer
                    }
                   var  outletsredeemCancel = item.outletsemails;
                   var lcount = 0;
                    if (outletsredeemCancel.length == 0) return callback(null, item, {status: "success", message: "Success of canceling the transaction"});
                    async.eachSeries(outletsredeemCancel, function(outlet, eachCallback){
                        async.waterfall([
                            function(callback_1){
                                mail.sendCancellationEmailToAd(outlet.outletsemails, mailData, function(err, result){
                                    if (err)
                                        callback(null, false, {statue: "error", message: "Sorry! now You can't send email to outlets"});
                                    else
                                        lcount++

                                    if (lcount == outletsredeemCancel.length) callback(null, item, {status: "success", message: "Success of canceling the transaction"});
                                    else eachCallback();

                                })
                            }
                            ],function(err, result){
                            if (err) callback(null, false, {statue: "error", message: "Sorry! now You can't send email to outlets"});
                             else {
                                lcount++;
                                if (lcount == outletsredeemCancel.length) callback(null, item, {status: "success", message: "Success of canceling the transaction"});
                                else eachCallback();
                            }
                        })
                    })
                }
            }, 
            function(item, msg, callback) {
                if (!item) callback(null, false, msg);
                else {
                    var mailData = {
                        vcode: item.voucher,
                        advertiserName: item.adName,
                        outletName: item.outlet_name,
                        serviceName: item.service_id,
                        userEmail: item.userEmail,
                        purchaseDate: moment(item.purchaseDate).format("D MMM YYYY"),
                        customer: item.customer
                    }
                    if (!item.ad_email || item.ad_email=="") return callback(null, item, false);
                    mail.sendCancellationEmailToAd(item.ad_email, mailData, function(err, result) {
                        if (err) {
                            callback(null, err, result);
                        } else {
                            callback(null, mailData, null);
                        }
                    })
                }
            },
            function(item, msg, callback) {
                if (!item) callback(false, msg);
                else {
                    if (!item.userEmail || item.userEmail == "") return callback(false, true);
                    mail.sendCancellationEmailToUser(item.userEmail, item, function(err, result) {
                        if (err) {
                            callback(err, result);
                        } else {
                            callback(null, item);
                        }
                    })
                }
            }
        ], function(err, result) {
            if (err) res.json({status: "error", message: result});
            else res.json({status: "success", message: "Successful canceled"});
        }) 
        
    });

    //get voucher number on wp
    router.route('/vouchers').post( function(req, res) {
        if (req.body.order_key=="" || !req.body.order_key || req.body.email=="" || !req.body.email) {
            res.json({code: 'failed', message: 'Invalid request!'});
        } else {
            var sql = "SELECT a.voucher, a.state,a.purchase_date, a.expirey_date, a.redeemption_date, a.service_id from voucher_code as a \
            INNER JOIN orders as b on a.order_id=b.id \
            where b.order_id=?";
            connection.query({sql: sql}, [req.body.order_key], function(error, results) {
                if (error) res.json({status: 'error', message: 'There is noting related the order'});
                else {
                    var redeemed = [];
                    var unredeemed = [];
                    results.forEach(result => {
                        var row = {
                            voucher: result.voucher,
                            purchase_date: result.purchase_date,
                            expirey_date: result.expirey_date,
                            redeemption_date: result.redeemption_date ? moment(result.redeemption_date).format("D MMM YYYY"): '',
                            service_name: result.service_id
                        };
                        if (result.state) redeemed.push(row);
                        else unredeemed.push(row);
                    });
                    res.json({code: 'success', data: {
                        redeemed: redeemed,
                        unredeemed: unredeemed
                    }});
                }
            })
        }
    })
        

    //Remind user to use service
    router.route('/order_remind').get(function (req, res) {
        connection.query({sql: "SELECT id, email, redemption FROM orders WHERE redemption is NULL"},
            function (error, results) {
                if (results) {
                    results.forEach(function (result) {
                        var imageName = "order_qr_" + result.id + ".png";
                    });

                }
            }
        )
    });    

    // Hooked create order from woocommerce, create database order
    router.route('/qr/send').post(controller.order.qr);
    router.route('/updatealldata').get(controller.order.templateOrder);
    // Update order redemption on scan qr
    router.route('/order_update').get(controller.order.update);
    
    router.route('/test').post(controller.order.test);

    router.route('/voucher').post(controller.voucher.confirm);    

    router.route('/redeem').post(controller.voucher.sendRedeemMail);

    return router;

}