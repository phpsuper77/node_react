var axios = require('axios');
var async = require('async');
var moment = require('moment');
var config = require('config');


module.exports.getAll = function (connection) {
    return function (req, res) {
        var advertiserId = null;
        if (req.body.aid) advertiserId = parseInt(req.body.aid);
        async.waterfall([
            function(callback) {
                var sql = "SELECT a.*, b.price oprice from promos as a \
                LEFT JOIN services as b on a.service_id=b.id \
                where b.advertiser_id=? ORDER BY a.status DESC, a.name";
                connection.query({sql: sql},
                [],
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
                                    "status": result.status,
                                    "hasService": result.hasService
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
                                var sql = "SELECT count(id) vcount, sum(redeemed) rcount FROM orders WHERE local_service_id=? GROUP BY email";
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
        
    }
}

module.exports.get = function(connection) {
    return function (req, res) {
        if (typeof req.params.pid == "undefined" || req.params.pid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {
            var sendKeys = ["id", "name", "advertiser_id", "service_id", "featured", "price", "discount", "startdate", "enddate", "terms", "type", "subtype", "s_images", "outlets", "status", "hasService"];
            connection.query({sql: "SELECT " + sendKeys.join(",") + " FROM promos WHERE `id`= ?"},
                [req.params.pid],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    } else {
                        if (results.length >0) {
                            res.json({
                                "status": "success", "promo": {
                                    "id": results[0].id,
                                    "name": results[0].name,
                                    "advertiser_id": results[0].advertiser_id,
                                    "service_id": results[0].service_id,
                                    "featured": results[0].featured,
                                    "price": results[0].price,
                                    "discount": results[0].discount,
                                    "startdate": results[0].startdate,
                                    "enddate": results[0].enddate,
                                    "terms": results[0].terms,
                                    "type": results[0].type,
                                    "subtype": results[0].subtype,
                                    "s_images": results[0].s_images,
                                    "outlets": results[0].outlets,
                                    "status": results[0].status,
                                    "hasService": results[0].hasService
                                }
                            });
                        } else {
                            res.json({status: "failed", message: "There isn't any promo"});
                        }
                    }
                    
                });
        }
    }
}

module.exports.create = function (connection, WooCommerce,mainUrl) {
    return function (req, res) {

        var startdate = moment(req.body.startdate);
        var enddate = moment(req.body.enddate);
        var startstr = startdate.hour(0).minutes(0).seconds(1).format();
        var endstr = enddate.hour(23).minutes(59).seconds(59).format();

        async.waterfall([
            function(callback) {
                if (req.body.isexisting == "true" || req.body.isexisting == true) {
                    var mustKeys = ["name", "advertiser_id", "service_id", "featured", "status", "price", "discount", "startdate", "enddate", "terms", "s_images", "outlets"];                            
                    
                    var qmarks = "?,".repeat(mustKeys.length).replace(/(^\s*,)|(,\s*$)/g, '');                    
                    connection.query({sql: "INSERT INTO promos (" + mustKeys.join(",") + ") VALUES (" + qmarks + ")"},
                        [req.body.name, req.body.advertiser_id, req.body.service_id, req.body.featured,req.body.status, req.body.price, req.body.discount, startstr, endstr, req.body.terms, req.body.s_images, req.body.outlets],
                        function (error, results, fields) {                    
                            if (error) {
                                callback(null, false, {"status": "error", "message": error.code});
                            } else if (results.affectedRows == 1) {
                                var item = {
                                    id: results.insertId,
                                    adveriterId: req.body.advertiser_id,
                                    serviceId: req.body.service_id,
                                    outlets: req.body.outlets,
                                    price: req.body.price
                                }
                                callback(null, item, {"status": "success", id: results.insertId});
                            } else {
                                callback(null, false, {"status": "failure", "message": "Error adding promo"});
                            }
                    });            
                }
                else {
                    var mustKeys = ["name", "advertiser_id", "featured", "type", "subtype", "status", "price", "discount", "startdate", "enddate", "terms"];
                    var hasAllRequired = mustKeys.every(function (mustKey) {
                        return Object.prototype.hasOwnProperty.call(req.body, mustKey);
                    });
                    if (!hasAllRequired) {
                        res.json({"status": "failure", "message": "Incomplete data"});
                    }
                    var qmarks = "?,".repeat(mustKeys.length).replace(/(^\s*,)|(,\s*$)/g, '');
                    connection.query({sql: "INSERT INTO promos (" + mustKeys.join(",") + ", s_images) VALUES (" + qmarks + ",?)"},
                        [req.body.name, req.body.advertiser_id, req.body.service_id, req.body.featured, req.body.type, req.body.subtype, req.body.price, req.body.discount, req.body.startdate, req.body.enddate, req.body.terms, req.body.s_images],
                        function (error, results, fields) {                            
                            if (error) {
                                res.json({"status": "error", "message": error.code});
                            } else if (results.affectedRows == 1) {
                                res.json({
                                    "status": "success",
                                    "message": "Promo added successfully"
                                });
                            } else res.json({"status": "failure", "message": "Error adding promo"});
                        });
                }
            },            
            function(item, msg, callback) {
                if (!item) return callback(null, false, msg);

                var sql = "SELECT a.woo_id, b.slug from services as a \
                LEFT JOIN advertisers as b on a.advertiser_id=b.id \
                WHERE a.id=?"
                connection.query({sql: sql}, [req.body.service_id], function(error, results, fields) {
                    if (error) callback(null, false);
                    if (results.length > 0) {
                        var service = results[0];
                        item.swid = service.woo_id;
                        item.aname = service.slug;
                        callback(null, item, null);
                    } else {
                        callback(null, false, null);
                    }
                });                       
                
            }, 

            function (item, msg, callback) {
                if (!item) return callback(null, false);
                
                sql = `SELECT woo_id, slug from outlets WHERE id in (${item.outlets})`;
                connection.query({sql: sql}, [], function(error, results, fields) {
                    if (error) callback(null, false);
                    if (results && results.length > 0) {
                        var tempArr = [];                        
                        results.forEach(res => {
                            tempArr.push(item.aname + '-' + res.slug);
                        });
                        item.outlets = tempArr;                        
                        callback(null, item);
                    } else {
                        callback(null, false);
                    }
                });
            },            
            function(item, callback) {
                if (!item) callback(null, false, {status: "failer", msg: "failed save promos"});
                else {
                    var eachCounter_1 = 0;
                    async.waterfall([
                        function(callback_1) {
                            WooCommerce.get(`products/${item.swid}/variations`, function(err, data, res) {
                                if (err) callback_1(null, false);
                                var variations = JSON.parse(res);
                                if (variations.length >0) {
                                    callback_1(null, variations);
                                } else {
                                    callback_1(null, false);
                                }
                            });
                        },
                        function(variations, callback_1) {
                            if (!variations || variations.length <=0) callback_1(null, null, false);
                            else {
                                var variationIds = [];
                                var preservedOutlets = [];
                                var imageIds = [];

                                variations.forEach(variation => {
                                    var attr = variation.attributes;
                                    var image = variation.image;
                                    image.src = req.body.s_images;
                                    imageIds.push(image);
                                    if (attr.length >0) {
                                        attr.forEach(ii => {
                                            if (ii.name == "Branch" && item.outlets.indexOf(ii.option)>=0 && variationIds.indexOf(variation.id) < 0) {
                                                variationIds.push(variation.id);
                                                preservedOutlets.push(ii.option);
                                                item.abid = ii.id;
                                            }
                                            if (ii.name == "Advertiser") {
                                                item.aaid = ii.id;
                                            }
                                            
                                        });
                                    }
                                });                                
                                callback_1(null, variationIds, imageIds);
                            }
                        },
                        function(variations, imageIds, callback_1) {
                            if (!variations) callback_1(null, false);
                            else {
                                var step2 = 0;
                                var key = 0;
                                var tempVariations = [];
                                async.eachSeries(variations, function(variation, eachCallback) {
                                    async.waterfall([
                                        function(callback_2) {
                                            //var temp = moment(req.body.enddate);
                                            var image = imageIds[key];
                                            
                                            var data = {
                                                "visible": false
                                            }
                                            if (req.body.status) {
                                                data = {                                                    
                                                    "sale_price": req.body.status? item.price.toString(): '',
                                                    "date_on_sale_from": req.body.status?moment(startstr).add('hours', 8).format(): 'null',
                                                    "date_on_sale_to": req.body.status?moment(endstr).add('hours', 8).format(): 'null',
                                                    "description": req.body.name
                                                }
                                            }                                            

                                            WooCommerce.put(`products/${item.swid}/variations/${variation}`, data, function(err, data, res) {
                                                if (err) callback_2(true, {status: "error", message: "error in updating variations"});
                                                else {
                                                    var resp = JSON.parse(res);
                                                    if (resp.message) callback_2(true, {status: "error", message: "error in updating promo"});
                                                    else callback_2(false, resp.id);
                                                }                                                    
                                            });
                                        }
                                    ], function(err, result) {
                                        if (err) callback_1(true, false);
                                        else {
                                            step2 ++;
                                            if (step2 == variations.length) {
                                                tempVariations.push(result);
                                                callback_1(false, tempVariations);
                                            } else {
                                                tempVariations.push(result);
                                                eachCallback();
                                            }
                                        }
                                    });
                                })
                            }
                        }                  
                    ], function(err, result) {
                        if (err) callback(null, result, item);
                        else callback(null, result, item);
                    });
                }
            }, 
            function(vids, item, callback) {
                if (!vids) callback(true, null);
                else {
                    connection.query({sql: "UPDATE promos SET woo_id=? WHERE id=?"},
                        [vids.join(","), item.id], function(error, results) {
                            if (error) callback(true, null);
                            else if (results.affectedRows>0) callback(false, item);
                            else callback(true, null);
                        })
                }
            },  
            function(item, callback) {
                if (!item) callback(null, false);
                else {
                    axios.post( `${config.get('url')}` + 'wp-json/wp/v2/update_usage_terms', {
                        service_id: item.swid,                        
                        authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",                                
                        content: req.body.terms
                    }).then(function (response) {                                                       
                        callback(null, item, {"status": "success", "message": "Success posting promo usage terms to wp"});                        
                    }).catch(function (error) {                    
                        callback(null, false, {"status": "failure", "message": "Error posting promo usage terms to WP"});
                    });  
                    console.log(req.body.terms); 
                    console.log(item.swid);                                   
                }
            },         
        ], function(error, result) {
            if (error) res.json({status: "failer", message: "error is occured"});
            else res.json({status: "success", id: result.id});
        });   
        
    }
}

module.exports.update = function (connection, WooCommerce, mainUrl) {
    return function (req, res) {        
        if (req.body.id == "" || req.body.id == undefined) {
            return res.json({"status": "failure", "message": "Invalid promo id"});
        }
        var fields = ["name", "advertiser_id", "featured", "price", "discount", "startdate", "enddate", "terms", "type", "subtype", "s_images", "outlets", "status"];
        if (req.body.isexisting == "true" || req.body.isexisting == true) {
            fields = ["name", "advertiser_id", "service_id", "featured", "price", "discount", "startdate", "enddate", "terms", "s_images", "outlets", "status"];
        }
                
        var startdate = moment(req.body.startdate);
        var enddate = moment(req.body.enddate);
        req.body.startdate = startdate.hour(0).minutes(0).seconds(1).format();
        req.body.enddate = enddate.hour(23).minutes(59).seconds(59).format();
        var activeFields = [];
        fields.forEach(function (field) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                switch (typeof(req.body[field])) {
                    case "number":
                        activeFields.push(field + "=" + req.body[field]);
                        break;
                    case "string":
                        activeFields.push(field + "='" + req.body[field].replace(/'/g, "\\'") + "'");
                        break;
                    default:
                        break;
                }
            }
        });

        var slug = "aaaa";
        if (req.body.name)
            slug = req.body.name.toLowerCase().replace(" ", "-");
        var statusFlag = false;
        //status 0: inactivate, 1: activate, 2: ended, 3: expired, 4: pending 
        async.waterfall([
            // get promo from promos table
            function(callback) {                
                connection.query({sql: "SELECT * FROM promos WHERE id=?"}, [req.body.id]
                , function(error, results, fields) {
                    if (error) callback(null, false, {status: "error", message: "The service isn't realted to outlets"});
                    else if (results.length > 0) {
                        var result = results[0]; 
                        if (result.status != req.body.status) statusFlag = true;
                        connection.query({sql: "update promos set status=4 where id=?"}, [req.body.id], function(error, subresults) {
                            if (error) callback(null, false, {status: "error", message: "The promo isn't on Dashbaord"});
                            else {
                                if (subresults.affectedRows > 0) {
                                    callback(null, req.body, null);
                                } else {
                                    callback(null, false, {status: "error", message: "The Promo isn't on Dashboard"});
                                }
                            }
                        })                        
                    } else {
                        callback(null, false, {status: "error", message: "The service isn't realted to outlets"});
                    }
                });                
            }, // get advertiser
            function(item, msg, callback) {
                res.json({status: "pending", message: "Now the action is pending!"});
                if (!item) return callback(null, false, msg);                
                var sql = "SELECT a.woo_id, b.slug, a.terms from services as a \
                LEFT JOIN advertisers as b on a.advertiser_id=b.id \
                WHERE a.id=?"
                connection.query({sql: sql}, [item.service_id], function(error, results, fields) {
                    if (error) callback(null, false, null);
                    if (results.length > 0) {
                        var service = results[0];
                        item.swid = service.woo_id;
                        item.aname = service.slug;
                        item.descr = service.terms
                        callback(null, item, null);
                    } else {
                        callback(null, false, null);
                    }
                });                       
                
            }, // get outlets
            function (item, msg, callback) {
                if (!item) return callback(null, false);
                
                sql = `SELECT woo_id, slug from outlets WHERE id in (${item.outlets})`;
                connection.query({sql: sql}, [], function(error, results, fields) {
                    if (error) callback(null, false);
                    if (results && results.length > 0) {
                        var tempArr = [];                        
                        results.forEach(res => {
                            tempArr.push(item.aname + '-' + res.slug);
                        });
                        item.outlets = tempArr;                        
                        callback(null, item);
                    } else {
                        callback(null, false);
                    }
                });
            }, // update promos and variant on wp side
            function(item, callback) {
                if (!item) callback(true, {status: "failer", msg: "failed save promos"});
                else {
                    var eachCounter_1 = 0;
                    async.waterfall([
                        function(callback_1) {
                            WooCommerce.get(`products/${item.swid}/variations`, function(err, data, res) {
                                if (err) callback_1(null, false);
                                var variations = JSON.parse(res);
                                if (variations.length >0) {
                                    callback_1(null, variations);
                                } else {
                                    callback_1(null, false);
                                }
                            });
                        },
                        function(variations, callback_1) {
                            if (!variations || variations.length <=0) callback_1(null, null, false);
                            else {
                                var variationIds = [];
                                var preservedOutlets = [];
                                var imageIds = [];

                                variations.forEach(variation => {
                                    var attr = variation.attributes;
                                    var image = variation.image;
                                    image.src = req.body.s_images;                                    
                                    if (attr.length >0) {
                                        attr.forEach(ii => {
                                            if (ii.name == "Branch" && item.outlets.indexOf(ii.option)>=0 && variationIds.indexOf(variation.id) < 0) {
                                                variationIds.push(variation.id);
                                                preservedOutlets.push(ii.option);
                                                imageIds.push(image);
                                                item.abid = ii.id;
                                            }
                                            if (ii.name == "Advertiser") {
                                                item.aaid = ii.id;
                                            }
                                            
                                        });
                                    }
                                });                                
                                callback_1(null, variationIds, imageIds);
                            }
                        },
                        function(item, callback_1) {
                            if (!item) callback_1(null, false);
                            else {
                                axios.post( `${config.get('url')}` + 'wp-json/wp/v2/update_usage_terms', {
                                    service_id: item.swid,                        
                                    authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",                                
                                    content: item.status?item.terms: ''
                                }).then(function (response) {                                                       
                                    callback_1(null, item, {"status": "success", "message": "Success posting promo usage terms to wp"});                        
                                }).catch(function (error) {                    
                                    callback_1(null, false, {"status": "failure", "message": "Error posting promo usage terms to WP"});
                                });  
                                console.log(item.terms + "  update"); 
                                console.log(item.swid + "  update"); 
                                console.log(item.status);                                  
                            }
                        }, 
                        function(variations, image, callback_1) {
                            if (!variations) callback_1(null, false);
                            else {
                                var step2 = 0;
                                var key = 0;
                                var updateVaraions = [];
                                //"image": image[key],                                
                                //"visible": item.status? true: false,                                        
                                variations.forEach(vid=> {
                                    updateVaraions.push({
                                        id: vid,
                                        "sale_price": item.status? item.price.toString(): '',
                                        "date_on_sale_from": item.status?moment(item.startdate).format(): 'null',
                                        "date_on_sale_to": item.status?moment(item.enddate).format(): 'null',
                                        "description": item.status?item.name: ''
                                    });
                                    console.log (item.startdate + "   start date at line    557 ");
                                    key++;
                                })                                

                                var data = {
                                    update: updateVaraions
                                }
                                
                                WooCommerce.post(`products/${item.swid}/variations/batch`, data, function(err, data, res) {
                                    if (err) callback_1(null, false);
                                    else {
                                        var resp = JSON.parse(res);
                                        if (resp.message) callback_1(null, false);
                                        else {
                                            var temps = [];
                                            resp.update.forEach(ii => {
                                                temps.push(ii.id);
                                            });
                                            callback_1(null, temps);
                                        }
                                    }
                                });
                            }
                        },
                        function(newIds, callback_1) {
                            if (!newIds) callback_1(true, null);
                            else {
                                var qmarks = "?,".repeat(activeFields.length).replace(/(^\s*,)|(,\s*$)/g, '');
                                connection.query({sql: "UPDATE promos SET " + activeFields.join(",") + ",woo_id=? WHERE id=" + req.body.id},
                                [newIds.join(",")],
                                function (error, results, fields) {                            
                                    if (error) {
                                        callback(null, false, {"status": "error", "message": error.code});
                                    }
                                    else if (results.affectedRows == 1) callback(null, req.body.id, {status: "success", message: "success updating on local"});
                                    else callback(null, false, {"status": "failure", "message": "Error updated promos"});
                                });
                            }
                        },
                    ], function(err, result) {
                        if (err) callback(true, result);
                        else callback(false, item);
                    });
                    
                }
                
            }, 
                  
        ], function(error, result) {
            var msg = null;
            if (error) msg = {status: "failer", message: "Error is occured! Please contact to admin "};
            else msg = {status: "success", id: result.id}; 
            req.io.emit('activatingPromo', msg);         
        });     
        
    }
}

module.exports.delete = function (connection) {
    return function (req, res) {
        if (req.body.status == "" || req.body.status == undefined || req.body.promo_id == "" || req.body.promo_id == undefined) {
            res.json({"status": "error", "message": "error changing status"});
        }
        var newStatus = req.body.status == "0" ? 0 : 1;
        connection.query({sql: "UPDATE promos SET status=? WHERE id=?"},
            [newStatus, req.body.promo_id],
            function (error, results, fields) {
                if (error) {
                    res.json({"status": "error", "message": error.code});
                }
                else if (results.affectedRows == 1) res.json({
                    "status": "success",
                    "message": "Promo updated successfully"
                });
                else res.json({"status": "failure", "message": "Error updating promo"});
            });
    }
}

// activation or deactivate of promo(it indeed change vaidations of product)
// promo: vIds - array, sId: service id, status: 1 or 0
module.exports.doDeactivePromo = function(promo, connection, MyWooCommerce, pCallback) {
    if (promo.vIds.length <= 0) return pCallback(true, null);    
    var updateData = [];
    //var connection = db.createConnection();
    //"visible": promo.status?true: false,            
    promo.vIds.forEach(vid=> {

        updateData.push({
            id: vid,
            "sale_price": promo.status?promo.price.toString(): '',
            "date_on_sale_from": promo.status?moment(promo.startdate).format(): 'null',
            "date_on_sale_to": promo.status?moment(promo.enddate).format(): 'null',
            "description": promo.status? promo.descr: ''
        })
        console.log ( promo.startdate   + "   start date at line 42 ");
    });
    async.waterfall([
        function(callback) {
            MyWooCommerce.post(`products/${promo.sId}/variations/batch`, { update: updateData }, function(err, data, res) {
                if (err) callback(null, true, null);
                else {
                    var resp = JSON.parse(res);
                    if (resp.length<=0 || resp.message) callback(null, true, resp.message);
                    else callback(null, false, resp);
                }
            });
        },
        function(error, msg, callback) {
            if (error) return callback(error, msg);
            var sql = "UPDATE promos SET `status`=? WHERE id=?";                    
            connection.query({sql: sql}, [promo.status, promo.pId], 
            function(err, results) {
                if (err) callback(true, {status: "error", message: "The promo isn't on Server"});
                else if (results.affectedRows > 0) {
                    callback(false, results);
                } else {
                    callback(true, {status: "error", message: "The promo isn't on Server"});
                }
            });
        }
    ], function(error, result) {
        if (error) pCallback(true, result);
        else pCallback(false, {status: "success", message: "Updating promo successfully"});
    })
    
}

module.exports.activate = function (connection, WooCommerce) {
    return function (req, res) {
        if (typeof req.params.pid == "undefined" || req.params.pid == "") {
            res.json({
                "status": "error",
                "message": "Invalid Promo ID"
            });
        } else {
            var pendingFlag = false;
            async.waterfall([
                function(callback) {
                    if (req.body.status) {
                        var sql = "select b.outlets aoutlets, a.outlets from promos as a \
                        INNER JOIN promos as b on a.service_id=b.service_id \
                        where a.id=? and b.status=1";
                        connection.query({sql: sql},
                        [req.params.pid], function(error, results) {
                           if (error) callback(null, true, null, {status: "error", message: "Updating error"});
                           else if(results) {
                               var flag = false;
                               results.forEach(result => {
                                   var aoutlets = result.aoutlets? result.aoutlets.split(","): [];
                                   var outlet = result.outlets? result.outlets.split(","): [];

                                   outlet.forEach(ii => {
                                       if (aoutlets.indexOf(ii) >= 0) flag=true;
                                   });
                               });
                               pendingFlag = flag;
                               if (flag) {                                    
                                    return callback(null, true, {status: 'issue', message: 'The promo can not be running as others'}, {status: 'issue', message: 'The promo can not be running as others'});
                               } else {
                                    connection.query({sql: "update promos set status=? where id=?"},
                                    [4, req.params.pid], function(error, results) {
                                    if (error) callback(null, true, null, {status: "error", message: "Updating error"});
                                    else if(results.affectedRows>0) {
                                        callback(null, false, null, null);
                                    } else callback(null, true, null, {status: "error", message: "Updating error"});
                                })
                               }
                           }
                       })
                    } else {
                        connection.query({sql: "update promos set status=? where id=?"},
                        [4, req.params.pid], function(error, results) {
                           if (error) callback(null, true, null, {status: "error", message: "Updating error"});
                           else if(results.affectedRows>0) {
                               callback(null, false, null, null);
                           } else callback(null, true, null, {status: "error", message: "Updating error"});
                       })
                    }
                    
                },
                function(error, msg, pending, callback) {
                    if (pending) res.json(pending);
                    else {
                        res.json({
                            "status": "pending",
                            "message": "The promo is pending"
                        });
                    }                    
                    if (error) return callback(null, false, msg);
                    var sql = "SELECT a.name, a.price, a.startdate, a.enddate, a.woo_id, b.woo_id bwId, a.id pid, b.descr serdescr, a.terms FROM promos as a \
                    INNER JOIN services as b on a.service_id=b.id \
                    WHERE a.id=?";
                    connection.query({sql: sql}, [req.params.pid], 
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
                        var temps = item.woo_id.split(",");
                        var vIds = [];
                        temps.forEach(ii=> { vIds.push(parseInt(ii))});
                        var data = {
                            sId: item.bwId,
                            vIds: vIds,
                            status: req.body.status,
                            price: item.price,
                            startdate: item.startdate,
                            enddate: item.enddate,
                            pId: item.pid,
                            descr: item.name,
                            serdescr: item.serdescr
                        };
                        
                        module.exports.doDeactivePromo(data, connection, WooCommerce, function(err, result) {
                            callback(err, result);
                        })
                    }
                }
            ], function(err, result) {
                if (!pendingFlag)
                    req.io.emit('activatingPromo', result);                
            });
        }
    }
}

module.exports.expired = function (connection, WooCommerce) {
    
    return async.waterfall([
        function(callback) {
            var sql = "SELECT a.*, b.terms serterms, b.woo_id swId FROM promos AS a \
                INNER JOIN services AS b ON a.service_id=b.id \
                WHERE a.status=1 AND a.woo_id AND DATE(a.enddate)<?";
            var now = moment().format('YYYY-MM-DD');
            connection.query({sql: sql} , [now], function(error, results) {
                if (error) callback(null, null, {message: "error getting data"});
                else {
                    if (results.length > 0) callback(null, results, null);
                    else callback(null, null, {message: 'there is not expired promo'});
                }
            });
        },
        function(items, msg, callback) {
            if (!items) callback(true, msg);
            else {
                var counter = 0;
                async.eachSeries(items, function(item, eachCallback) {
                    async.waterfall([
                        function(callback_1) {
                            var data = {
                                "sale_price": '',
                                "date_on_sale_from": 'null',
                                "date_on_sale_to": 'null',
                                "description": ''
                            }

                            WooCommerce.put(`products/${item.swId}/variations/${item.woo_id}`, data, function(err, data, res) {
                                if (err) callback_1(null, true, {status: "error", message: "error in updating variations"});
                                else {
                                    var resp = JSON.parse(res);
                                    if (resp.message) callback_1(null, true, {status: "error", message: "error in updating promo"});
                                    else callback_1(null, false, resp.id);
                                }                                                    
                            });
                        },
                        function(err, msg, callback_1) {
                            if (err) callback_1(true, msg);
                            else {
                                connection.query({sql: 'update promos set status=3 where id=?'}, [item.id], function(error, results) {
                                    if (error) callback_1(true, {status: "error", message: "Db error!"});
                                    else callback_1(false, null);
                                });
                            }
                        }                        
                    ], function(error, msg) {
                        if (error) callback(true, msg)
                        else {
                            counter++;
                            if (counter == items.length) callback(false, {status: "success", message: "Success expired all"});
                            else eachCallback();
                        }
                    })
                })
            }
        }
    ], function(error, msg) {
        if (error) console.log(msg.message);
    })
    
}

