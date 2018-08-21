var axios = require('axios');
var async = require('async');
var moment = require('moment');

module.exports.getAll = function (connection) {
    return function (req, res) {
        //if (req.query.aid)
        var sql = "SELECT id, name, creditcard, ophours, status FROM outlets order by status desc, name";
        if (req.query.aid)
            sql = "SELECT * FROM outlets where advertiser_id=? order by status desc, name";
        else if (req.query.aid == null)
            sql = "SELECT a.* FROM outlets as a\
            LEFT JOIN (SELECT max(id) id FROM advertisers) as b on a.advertiser_id=b.id\
            ORDER BY a.`status` DESC, a.`name`";

        connection.query({sql: sql}, [req.query.aid], function (error, results, fields) {
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
                        "descr": result.descr,
                        "email": result.email,
                        "phone": result.phone,
                        "outlet_code": result.outlet_code,
                        "postalcode": result.postalcode,
                        "s_images_path": result.s_images_path,                        
                        "address": result.address,
                        "s_images": result.s_images,
                        "woo_id": result.woo_id,
                        "advertiser_id": result.advertiser_id,
                        "linked_services": result.linked_services
                    })
                });
                res.json({"status": "success", "outlets": _outlets});
            });
    }
}

module.exports.createOutlet = function (connection, mainUrl) {
    return function (req, res) {
        var mustKeys = ["name", "descr", "advertiser_id", "email", "phone", "address", "postalcode", "ophours", "creditcard", "status", "outlet_code"];
        var hasAllRequired = mustKeys.every(function (mustKey) {
            Object.prototype.hasOwnProperty.call(req.body, mustKey);
        });
        // console.log(hasAllRequired);
        // if (!hasAllRequired) {
        //     return res.json({"status": "failure", "message": "Incomplete data"});
        // }
        var slug = "slug";
        if (req.body.name)
            slug = req.body.name.toLowerCase().replace(/ /g, "-");
        connection.query({sql: "SELECT id FROM outlets WHERE slug=?"},
        [slug],
        function (error, results, fields) {                                    
            if (error) {
                res.json({"status": "error", "message": "Sorry! We can't accept your request"});
            }
            else if (results.length > 0) {
                res.json({"status": "error", "message": "The Outlet name is used already"});
            } else {
                var qmarks = "?,".repeat(mustKeys.length).replace(/(^\s*,)|(,\s*$)/g, '');
                
                async.waterfall([
                    function (callback) {
                        connection.query({sql: "select woo_id from advertisers where id=?"}, [req.body.advertiser_id], 
                        function(error, results, filed) {
                            if (error) callback(null, false, {status: "error", message: "Advertiser hasn't registered on Wordpress "});
                            if (results.length > 0) callback(null, results[0].woo_id, {status: "success", message: "success"});
                            else callback(null, false, {status: "error", message: "Advertiser hasn't registered on Wordpress "});
                        });
                    },            
                    function (aWooId, msg, callback) {                
                        if (!aWooId) callback(null, false, msg);
                        else {
                            var status = req.body.status === 1 ? 'Active' : 'Inactive';
                            var gallery = [];
                            if (req.body.s_images_path && req.body.s_images_path.length > 0) {
                                var temp = req.body.s_images_path.split(",");                                
                                gallery = temp;                        
                            }
                            var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                            var fields = {
                                "outlet_brandname": req.body.name,
                                "outlet_featured_image": req.body.s_images,
                                "outlet_image_alt": req.body.alt_text,
                                "outlet_address": req.body.address,
                                "outlet_description": req.body.descr,
                                "outlet_company t&c": req.body.terms,
                                "outlet_creditcard": req.body.creditcard? "yes": "no",
                                "outlet_email": req.body.email,
                                "outlet_contact": req.body.phone,
                                "outlet_shopimages": gallery,
                                "outlet_images": gallery,
                                "outlet_active": status,
                                "outlet_code": req.body.outlet_code,
                                "outlet_postalcode": req.body.postalcode,
                                "outlet_operating_hours": 7,
                                "catalog_visibility": status=="Active"? 'visible': 'hidden'                        
                            };
                            
                            gallery.forEach(gg=> {
                                var ind = gallery.indexOf(gg);
                                fields[`outlet_images_${ind}`] = gg;
                            });

                            var temparr = req.body.ophours.split(";");
                            temparr.forEach(kk=> {
                                var op = JSON.parse(kk);
                                var ind = dayArr.indexOf(op.key);
                                //ind ++;
                                fields[`outlet_operating_hours_${ind}_day`] = op.key;
                                fields[`outlet_operatinghours_${ind}`] = ind;
                                fields[`outlet_operating_hours_${ind}_open_time`] = moment.unix(parseInt(op.starthr)).format('LT');
                                fields[`outlet_operating_hours_${ind}_close_time`] = moment.unix(parseInt(op.endhr)).format('LT');
                                fields[`outlet_operating_hours_${ind}_is_outlet_closed`] = op.closed;
                            });
                            axios.post(mainUrl + 'wp-json/wp/v2/new_outlet', {
                                name: req.body.name,
                                taxonomy: 'merchant',
                                authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                                parent_merchant: aWooId,
                                fields: fields
                            }).then(function (response) {                                                       
                                if (response.data.id) {
                                    var wooId = response.data.id;
                                    var slug = response.data.slug; 
                                    var item = { aWooId: aWooId, wooId: wooId, slug: slug};
                                    callback(null, item, {"status": "success", "message": "Success posint outlet to wp"});
                                } else {
                                    callback(null, false, {"status": "failure", "message": response.data.message});
                                }
                            }).catch(function (error) {                    
                                callback(null, false, {"status": "failure", "message": "Error adding outlet to WP site"});
                            });
                        }                
                    },            
                    function (item, msg, callback) {
                        if (!item.wooId || !item.aWooId) callback(msg);
                        else {
                            connection.query({sql: "INSERT INTO outlets (" + mustKeys.join(",") + ",woo_id, s_images,s_images_path, slug) VALUES (" + qmarks + ",?,?,?, ?)"},
                            [req.body.name, req.body.descr, req.body.advertiser_id, req.body.email, req.body.phone, req.body.address, req.body.postalcode, req.body.ophours, req.body.creditcard, req.body.status, req.body.outlet_code, item.wooId, req.body.s_images, req.body.s_images_path, item.slug],
                            function (error, results, fields) {                
                                if (error) {
                                    callback({"status": "error", "message": error.code});
                                }
                                else if (results.affectedRows == 1) {                    
                                    var outletId = results.insertId;
                                    callback({"status": "success", id: outletId});
                                } else {
                                    callback({"status": "failure", "message": "Error adding outlet"});
                                }
                            });
                        }
                    }
                ], function (message) {
                    res.json(message);
                }); 
            }
        });             

    }
}

module.exports.updateOutlet = function (connection, mainUrl, MyWooCommerce) {
    return function (req, res) {
        
        if (req.body.id == "" || req.body.id == undefined) {
            return res.json({"status": "failure", "message": "Invalid outlet id"});
        }
        var slug = "slug";
        if (req.body.name)
            slug = req.body.name.toLowerCase().replace(/ /g, "-");
        
        connection.query({sql: "SELECT id FROM outlets WHERE name=? and id!=?"},
        [req.body.name, req.body.id],
        function (error, results, fields) {                                    
            if (error) {
                res.json({"status": "error", "message": "Sorry! We can't accept your request"});
            }
            else if (results.length > 0) {
                res.json({"status": "error", "message": "The Outlet name is used already"});
            } else {
                var fields = ["name", "descr", "advertiser_id", "email", "phone", "address", "postalcode", "outlet_code", "ophours", "creditcard", "status", "s_images", "s_images_path"];
                if (req.body.option == "activation")
                    fields = ["status"];
                var activeFields = [];
                fields.forEach(function (field) {
                    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                        switch (typeof(req.body[field])) {
                            case "number":
                                activeFields.push(field + "=" + req.body[field]);
                                break;
                            case "string":
                                var value = req.body[field];
                                activeFields.push(field + "='" + value.replace(/'/g, "\\'") + "'");
                                break;
                            default:
                                break;
                        }
                    }
                });
                var qmarks = "?,".repeat(activeFields.length).replace(/(^\s*,)|(,\s*$)/g, '');
                var change_time = 0;
                var activeFlag = false;
                async.waterfall([
                    function (callback) {
                        connection.query({sql: "select woo_id, advertiser_id, outlet_code, change_time, status FROM outlets WHERE id=?"}, [req.body.id], 
                        function(error, results, filed) {
                            if (error) callback(null, false, {status: "error", message: "Outlet's hasn't registered on Wordpress "});
                            if (results.length > 0) {
                                change_time = results[0].change_time;
                                var outlet_code = results[0].outlet_code;
                                
                                var temprow = {wooId: results[0].woo_id, adId: results[0].advertiser_id};
                                if (req.body.status != results[0].status) activeFlag = true;
                                if (outlet_code != req.body.outlet_code && change_time > 1) 
                                    callback(null, false, {status: "error", message: "You can change outlet code only 2 times", ocode: outlet_code});
                                else {
                                    connection.query({sql: "update outlets set status=2 where id=?"}, [req.body.id], function(error, result) {
                                        if (error) callback(null, false, {status: "error", message: "You can change outlet code only 2 times", ocode: outlet_code});
                                        else if (result.affectedRows > 0)
                                            callback(null, temprow, {status: "success", message: "success"});
                                        else callback(null, false, {status: "error", message: "You can change outlet code only 2 times", ocode: outlet_code});
                                    })
                                    
                                }
                            }
                            else callback(null, false, {status: "error", message: "Advertiser hasn't registered on Wordpress "});
                        });
                    }, 
                    function (outlet, msg, callback) {
                        res.json({status: "pending", message: "This action is pending now!"});
                        if (!outlet) return callback(null, false, msg);
                        var adId = req.body.advertiser_id;
                        if (req.body.option == "activation") adId = outlet.adId;
                        connection.query({sql: "select woo_id FROM advertisers WHERE id=?"}, [adId], 
                        function(error, results, filed) {
                            if (error) callback(null, false, {status: "error", message: "Advertiser hasn't registered on Wordpress "});
                            if (results.length > 0) callback(null, {oWid: outlet.wooId, aWid: results[0].woo_id}, {status: "success", message: "success"});
                            else callback(null, false, {status: "error", message: "Advertiser hasn't registered on Wordpress "});
                        });
                    },           
                    function (woos, msg, callback) {                
                        if (!woos) callback(null, false, msg);
                        else {
                            var status = req.body.status === 1 ? 'Active' : 'Inactive';
                            var gallery = [];
                            if (req.body.s_images_path && req.body.s_images_path.length > 0) {
                                var temp = req.body.s_images_path.split(",");
                                gallery = temp;                        
                            }
        
                            var fields = {
                                "outlet_active": status,
                                "catalog_visibility": status=="Active"? 'visible': 'hidden'                                                
                            }
                            if (req.body.option != "activation") {
                                var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                                fields = {
                                    "outlet_brandname": req.body.name,
                                    "outlet_code": req.body.outlet_code,
                                    "outlet_featured_image": req.body.s_images,
                                    "outlet_image_alt": req.body.alt_text,
                                    "outlet_address": req.body.address,
                                    "outlet_description": req.body.descr,
                                    "outlet_company t&c": req.body.terms,
                                    "outlet_creditcard": req.body.creditcard? "yes": "no",
                                    "outlet_email": req.body.email,
                                    "outlet_contact": req.body.phone,
                                    "outlet_active": status,
                                    "outlet_code": req.body.outlet_code,
                                    "outlet_shopimages": gallery,                                
                                    "outlet_postalcode": req.body.postalcode,
                                    "outlet_operating_hours": 7,
                                    "catalog_visibility": status=="Active"? 'visible': 'hidden'                        
                                };

                                // gallery.forEach(gg=> {
                                //     var ind = gallery.indexOf(gg);
                                //     fields[`shopimages_url_${ind}`] = gg;
                                // });

                                var temparr = req.body.ophours.split(";");
                                temparr.forEach(kk=> {
                                    var op = JSON.parse(kk);
                                    var ind = dayArr.indexOf(op.key);
                                    //ind ++;
                                    fields[`outlet_operatinghours_${ind}`] = ind;
                                    fields[`outlet_operating_hours_${ind}_day`] = op.key;
                                    fields[`outlet_operating_hours_${ind}_open_time`] = moment.unix(parseInt(op.starthr)).format('LT');
                                    fields[`outlet_operating_hours_${ind}_close_time`] = moment.unix(parseInt(op.endhr)).format('LT');
                                    fields[`outlet_operating_hours_${ind}_is_outlet_closed`] = op.closed;
                                });
                            }                    
        
                            axios.put(mainUrl + 'wp-json/wp/v2/update_outlet', {
                                name: req.body.name,
                                taxonomy: 'merchant',
                                authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                                id: woos.oWid,
                                parent_merchant: woos.aWid,
                                fields: fields
                            }).then(function (response) {                                                       
                                if (response.data.message) {
                                    callback(null, false, {"status": "failure", "message": response.data.message});                            
                                } else {
                                    var wooId = response.data.id; 
                                    var item = { aWooId: woos.oWid, wooId: wooId};
                                    callback(null, item, {"status": "success", "message": "Success Put outlet to wp"});
                                }
                            }).catch(function (error) {                    
                                callback(null, false, {"status": "failure", "message": "Error Updating outlet on WP site"});
                            });
                        }                
                    },            
                    function (item, msg, callback) {
                        if (!item.aWooId) callback(msg);
                        else {                            
                            var sql = "UPDATE outlets SET " + activeFields.join(",") + ", change_time=" + (change_time+1) +" WHERE id= " + req.body.id
                            if (req.body.option == "activation")
                                sql = "UPDATE outlets SET " + activeFields.join(",") + ", change_time=" + (change_time+1) +" WHERE id= " + req.body.id
                            connection.query({sql: sql},
                            [slug],
                            function (error, results, fields) {                
                                if (error) {
                                    callback(null, true, {"status": "error", "message": error.code});
                                }
                                else if (results.affectedRows == 1) {                    
                                    callback(null, false, {"status": "success", id: req.body.id});
                                } else {
                                    callback(null, true, {"status": "success", id: req.body.id});
                                }
                            });
                        }
                    }, // update active status of service
                    function (error, msg, callback) {
                        if (error) return callback(msg);
                        if (!activeFlag) return callback(msg);

                        module.exports.doActivateOutlet({id: req.body.id, status: req.body.status}, connection, mainUrl, MyWooCommerce, function(err, result) {
                            callback(result);
                        })                        
                    }
                ], function (message) {
                    req.io.emit("activatingOutlet", message);
                }); 
            }
        });
               
    }
}

module.exports.deleteOutlet = function (connection) {
    return function (req, res) {
        if (req.body.status == "" || req.body.status == undefined || req.body.outlet_id == "" || req.body.outlet_id == undefined) {
            res.json({"status": "error", "message": "error changing status"});
        }
        var newStatus = req.body.status == "0" ? 0 : 1;
        connection.query({sql: "UPDATE outlets SET status=? WHERE id=?"},
            [newStatus, req.body.outlet_id],
            function (error, results, fields) {
                if (error) {
                    res.json({"status": "error", "message": error.code});
                }
                else if (results.affectedRows == 1) res.json({
                    "status": "success",
                    "message": "Outlet updated successfully"
                });
                else res.json({"status": "failure", "message": "Error updating outlet"});
            });
    }
}

module.exports.doActivateOutlet = function(outlet, connection, mainUrl, MyWooCommerce, pCallback) {    
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