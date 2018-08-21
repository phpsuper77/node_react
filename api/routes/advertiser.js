var axios = require('axios');
var async = require('async');
var moment = require('moment');
var Service = require('./service');
var Outlet = require('./outlet');

module.exports.getAdvertisers = function (connection) {
    return function (req, res) {
        var sql = "SELECT * FROM advertisers order by status desc, name";
        connection.query({sql: sql},
            [req.query.aid],
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
                        "commission": result.commission,
                        "descr": result.descr,
                        "terms": result.terms,
                        "s_images_path": result.s_images_path,
                        "host_url": result.host_url,
                        "wId": result.woo_id
                    })
                });
                res.json({"status": "success", "advertisers": _advertisers});
            });
    }
}

module.exports.createAdvertiser = function (connection, mainUrl) {
    return function (req, res) {
        var mustKeys = ["name", "email", "status", "commission", "descr"];
        var hasAllRequired = mustKeys.every(function (mustKey) {
            return Object.prototype.hasOwnProperty.call(req.body, mustKey);
        });
        if (!hasAllRequired) {
            return res.json({"status": "failure", "message": "Incomplete data"});
        }

        var slug = "slug";
        if (req.body.name)
            slug = req.body.name.toLowerCase().replace(/ /g, "-");

        connection.query({sql: "SELECT id FROM services WHERE slug=?"},
        [slug],
        function (error, results, fields) {                                    
            if (error) {
                res.json({"status": "error", "message": "Sorry! We can't accept your request"});
            }
            else if (results.length > 0) {
                res.json({"status": "error", "message": "The Name is used already"});
            } else {
                async.waterfall([
                    function(callback) {
                        var status = req.body.status === 1 ? 'Active' : 'Inactive';
                        axios.post(mainUrl + 'wp-json/wp/v2/new_merchant', {
                            name: req.body.name,
                            taxonomy: 'merchant',
                            authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                            fields: {
                                "advertiser_description": req.body.descr,
                                "advertiser_commission": req.body.commission,
                                "advertiser_company t&c": req.body.terms,
                                "advertiser_email": req.body.email,
                                "advertiser_logo": req.body.s_images,
                                "advertiser_website_url": req.body.host_url,
                                "is_active": status,
                                "catalog_visibility": status=="Active"? 'visible': 'hidden'                        
                            }
                        }).then(function (response) {                   
                                console.log(response);
                            if (response.data.affectedRows<1) {
                                callback(null, false, {"status": "failure", "message": response.data.message});
                            } else if (response.data.id) {                        
                                var woos = {wooId: response.data.id, slug: response.data.slug};

                                callback(null, woos, {"status": "success", "message": "success save to wp"})                                                        
                            } else {
                                callback(null, false, {"status": "failed", "message": "The Advertiser name is used already"});
                            }
                            console.log(response);
                        }).catch(function (error) {
                            callback(null, false, {"status": "failure", "message": "Error adding advertiser to WP site"});
                            console.log(callback);
                        });
                    },
                    function (woos, msg, callback) {
                        if (!woos) callback(true, msg);
                        else {
                            connection.query({sql: "INSERT INTO advertisers (name, email, slug, woo_id, terms,status,commission,descr, s_images,host_url) VALUES (?,?,?,?,?,?,?,?,?,?)"},
                            [req.body.name, req.body.email, woos.slug, woos.wooId, req.body.terms, req.body.status, req.body.commission, req.body.descr, req.body.s_images, req.body.host_url],
                            function (error, results, fields) {
                                if (error) {
                                    callback(true, {"status": "error", "message": error.code});
                                } else if (results.affectedRows == 1) {
                                    callback(false, {status: "success", id: results.insertId});
                                } else {
                                    callback(true, {"status": "failure", "message": "Error adding advertiser"});
                                }
                            });
                        }                
                    }
                ], function(error, msg) {
                    res.json(msg);
                });
            }
        });
            
    }
}

module.exports.updateAdvertiser = function (connection, mainUrl, WooCommerce) {
    return function (req, res) {
        if (req.body.id == "" || req.body.id == undefined) {
            res.json({"status": "failure", "message": "Invalid advertiser id"});
        }
        var fields = ["name", "email", "status", "commission", "descr", "s_images"];
        var activeFields = [];
        var status = req.body.status === 1 ? 'Active' : 'Inactive';
        var updateData = {
            id: null,
            name: req.body.name,
            authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
            fields: {
                "advertiser_description": req.body.descr.replace(/'/g, "\\'"),
                "advertiser_commission": req.body.commission,
                "advertiser_company t&c": req.body.terms.replace(/'/g, "\\'"),
                "advertiser_email": req.body.email,
                "advertiser_logo": req.body.s_images,
                "advertiser_website_url": req.body.host_url,
                "is_active": status,
                "catalog_visibility": status=="Active"? 'visible': 'hidden'                        
            }
        };
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

        var slug = "slug";
        if (req.body.name)
            slug = req.body.name.toLowerCase().replace(/ /g, "-");

        connection.query({sql: "SELECT id FROM services WHERE name=? and id!=?"},
        [req.body.name, req.body.id],
        function (error, results, fields) {                                    
            if (error) {
                res.json({"status": "error", "message": "Sorry! We can't accept your request"});
            }
            else if (results.length > 0) {
                res.json({"status": "error", "message": "The Name is used already"});
            } else {

                var activeFlag = false;
                async.waterfall([
                    function (callback) {
                        connection.query({sql : "select status, woo_id from advertisers where id=?"}, [req.body.id], function(error, results) {
                            if (error) callback(null, true);
                            else if (results.length > 0) {
                                if (results[0].status != req.body.status) activeFlag = true;
                                req.body.awId = results[0].woo_id;
                                updateData.id = results[0].woo_id;
                                
                                connection.query({sql: "update advertisers set status=2 where id=?"}, [req.body.id], function(error, result) {
                                    if (error) callback(null, true);
                                    else if (result.affectedRows > 0) callback(null, false);
                                    else callback(null, true);
                                })
                            } else callback(null, true);
                        })
                    },// get woocommerce id from database
                    function(err, callback) {
                        res.json({status: "pending", message: "This action is pending now!"});
                        if (err) callback(null, true);
                        else if (activeFlag){
                            module.exports.doActivateAdvertiser({id: req.body.id, status: req.body.status, awId: req.body.awId}, connection, WooCommerce, mainUrl, function(error, message) {
                                if (error) callback(null, message);
                                else callback(null, false);
                            })
                        } else callback(null, false);
                    },  // update advertiser data on wp side
                    function(err, callback) {
                        if (err) return callback(null, true);
                        axios.put(mainUrl + '/wp-json/wp/v2/new_merchant', updateData
                        ).then(function (response) {
                            if (response.data && response.data.id) {
                                callback(null, false);
                            } else {
                                callback(null, true);
                            }
                        }).catch(function (error) {
                            callback(null, true);
                        });
                    },  
                    function(error, callback) {                        
                        if (error) return callback(true, {status: "error", message: "Updating advertiser is failed"});
                        var qmarks = "?,".repeat(activeFields.length).replace(/(^\s*,)|(,\s*$)/g, '');
                        //var slugstr = ",slug='" + slug + "'";
                        connection.query({sql: "UPDATE advertisers SET " + activeFields.join(",") + ", host_url=?,terms=? WHERE id=" + req.body.id},
                        [req.body.host_url, req.body.terms],
                        function (error, results, fields) {
                            if (error) {
                                callback(null, true);
                            }
                            else if (results.affectedRows == 1) { 
                                callback(null, false);
                            }
                        });
                    },
                ], function(err, result) {
                    req.io.emit('activatingAdvertiser', result);
                });
            }
        });
                
    }
}

module.exports.deleteAdvertiser = function (connection, mainUrl) {
    return function (req, res) {
        if (!req.body.id) {
            res.json({"status": "error", "message": "error changing status"});
        } else {
            var newStatus = req.body.status;
            connection.query({sql: "UPDATE advertisers SET status=? WHERE id=?"},
                [newStatus, req.body.id],
                function (error, results, fields) {
                    if (error) {
                        res.json({"status": "error", "message": error.code});
                    }
                    else if (results) {
                        connection.query({sql: "Select woo_id From advertisers WHERE id=" + req.body.id + " limit 1"},
                            function (error, result) {
                                if (typeof result !== 'undefined') {
                                    var updateData = {
                                        id: result[0].woo_id,
                                        fields: {
                                            is_active: "Inactive"
                                        }
                                    };
                                    axios.put(mainUrl + '/wp-json/wp/v2/new_merchant', updateData
                                    ).then(function (response) {
                                        if (response.data && response.data.id) {
                                            res.json({
                                                "status": "success",
                                                "message": "Advertiser updated successfully"
                                            });
                                        } else {
                                            res.json({"status": "failure", "message": "Error updated advertiser"});
                                        }
                                    }).catch(function (error) {
                                        res.json({"status": "failure", "message": "Error updated advertiser"});
                                    });
                                } else {
                                    res.json({"status": "failure", "message": "Error updated advertiser"});
                                }
                            });
                    } else {
                        res.json({"status": "failure", "message": "Error updating advertiser"});
                    }
                });
        }
    }
}

module.exports.doActivateAdvertiser = function (advertiser, connection, WooCommerce, mainUrl, pCallback) {
    async.waterfall([
        function(callback) {
            var sql = "SELECT id FROM outlets WHERE advertiser_id=? and status=?";
            connection.query({sql: sql}, [advertiser.id, advertiser.status? 0: 1], 
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
                            Outlet.doActivateOutlet({id: outlet.id, status: advertiser.status}, connection, mainUrl, WooCommerce, function(error, result) {
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
                connection.query({sql: sql}, [advertiser.id, advertiser.status? 0: 1], 
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
                            Service.doActivateService({id: service.id, status: advertiser.status, swId: service.woo_id, variations: service.variations}, connection, WooCommerce, function(error, result) {
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
                var data = {
                    id: advertiser.awId,
                    authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",
                    fields : {
                        "is_active": advertiser.status? "Active": "Inactive"
                    }
                }
                axios.put(mainUrl + '/wp-json/wp/v2/new_merchant', data
                ).then(function (response) {
                    if (response.data && response.data.id) {
                        callback(false, {status: "success", message: "activating success"});
                    } else {
                        callback(true, {status: "error", message: "Updating failed"});
                    }
                }).catch(function (error) {
                    callback(true, {status: "error", message: "Updating failed"});
                });
            }
        }
    ], function(error, result) {
        pCallback(error, result);
    })
}