var axios = require('axios');
var async = require('async');
var moment = require('moment');

module.exports.getAll = function (connection) {
    return function (req, res) {
        connection.query({sql: "SELECT id, name, status, type, subtype, price FROM services order by name"},
            [],
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
                        "price": result.price
                    })
                });
                res.json({"status": "success", "services": _services});
            });
    }
}

module.exports.get = function (connection) {
    return function (req, res) {
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
    }
}

module.exports.create = function (connection, WooCommerce, mainUrl) {
    return function (req, res) {
        var mustKeys = ["name", "descr", "price", "type", "subtype", "terms", "status", "duration", "advertiser_id"];
        var hasAllRequired = mustKeys.every(function (mustKey) {
            return Object.prototype.hasOwnProperty.call(req.body, mustKey);
        });
        
        if (!hasAllRequired) {
            res.json({"status": "failure", "message": "Incomplete data"});
        }
        var qmarks = "?,".repeat(mustKeys.length).replace(/(^\s*,)|(,\s*$)/g, '');

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
                res.json({"status": "error", "message": "The Service name is used already"});
            } else {

                async.waterfall([                    
                    //product category
                    function(callback) {
                        var categoryIds = req.body.subtype.split(",");                        
                        categoryIds.push(req.body.type);
                        if (!categoryIds || categoryIds.length <= 0) callback(null, false, {status: "error", message: "Please select type and subtype"});
                        else {
                            var count1 = 0;
                            var categories = [];
                            async.eachSeries(categoryIds, function(item, eachCallback) {
                                async.waterfall([
                                    function(callback_1) {
                                        WooCommerce.get('products/categories?search=' + item, function(err, data, response) {
                                            if (err) callback_1(false, {status: "error", message: "The type isn't on WP"});
                                            if (response && response.length>0) {
                                                var temp = JSON.parse(response);
                                                if (temp.message) callback_1(false, {status: "error", message: temp.message});
                                                else {
                                                    var selectedCat = null;
                                                    temp.forEach(cat => {
                                                        if (cat.name == item) selectedCat = {id: cat.id};
                                                    });
                                                    if (selectedCat != null) callback_1(selectedCat, null);
                                                    else   callback_1(false, {status: "error", message: "The type isn't on WP"});
                                                }                                            
                                            } else {
                                                callback_1(false, {status: "error", message: "The type isn't on WP"});
                                            }
                                        });            
                                    }
                                ], function(item, msg) {
                                    if (!item) callback(null, false, msg);
                                    else {
                                        count1 ++;                            
                                        if (count1 == categoryIds.length) {                                
                                            categories.push(item);
                                            callback(null, categories, null);
                                        } else {
                                            categories.push(item);
                                            eachCallback();
                                        }
                                    }                                    
                                });
                            })                            
                        }
                    },
                    // product attribute and posting
                    function(items, msg, callback) {
                        if (!items || items.length <= 0) callback(null, false, null, msg);
                        else {
                            async.waterfall([
                                function(callback_1) {
                                    connection.query({sql: "select woo_id, slug, name from advertisers where id=" + req.body.advertiser_id},
                                    [], function(error, results, filed) {
                                        if (error) callback_1(null, false, null);
                                        else if (results && results.length > 0) {
                                            var result = results[0];
                                            var temp = {
                                                categories: items,
                                                advertiser: result.slug,
                                                advertisername: result.name,
                                                adWId: result.woo_id
                                            };                                    
                                            callback_1(null, temp, false);
                                        } else {
                                            callback_1(null, false, null);
                                        }
                                    })
                                },
                                function(item, msg, callback_1) {
                                    if (!item) callback_1(null, false, {status: "error", message: "error in advertiser"});
                                    else {
                                        connection.query({sql: "SELECT woo_id, slug from outlets WHERE id in (" + req.body.outlets + ")"},
                                        [], function(error, results, filed) {
                                            if (error) callback_1(null, false, null);
                                            else if (results && results.length > 0) {
                                                var temp = [];
                                                var tempId = [item.adWId];
                                                results.forEach(res => {
                                                    temp.push(item.advertiser + '-' +res.slug);
                                                    tempId.push(res.woo_id);
                                                });
                                                item.outlets = temp;
                                                item.outletWIds = tempId;
                                                callback_1(null, item, false);
                                            } else {
                                                callback_1(null, false, null);
                                            }
                                        });
                                    }
                                },// get product attribute
                                function(item, msg, callback_1) {
                                    if (!item) callback_1(null, false, {status: "error", message: "error in attributes"});
                                    else {
                                        WooCommerce.get('products/attributes', function(err, data, result) {
                                            if (err) {
                                                callback_1(true, {"status": "failure", "message": "Error adding service"});
                                            } else {
                                                var res = JSON.parse(result);
                                                if (res.length >0) {
                                                    var attributes = [];                                            
                                                    res.forEach(rr => {
                                                        if (rr.name == "Advertiser") {
                                                            attributes.push({
                                                                id: rr.id,
                                                                name: rr.name,
                                                                visible: true,
                                                                regular_price: req.body.price.toString(),                                                        
                                                                variation: true,
                                                                options: [item.advertiser]
                                                            });
                                                        } else if (rr.name == "Branch") {
                                                            attributes.push({
                                                                id: rr.id,
                                                                name: rr.name,
                                                                regular_price: req.body.price.toString(),
                                                                visible: true,                                                        
                                                                variation: true,
                                                                options: item.outlets
                                                            });
                                                        }
                                                    });
                                                    item.attributes = attributes;
                                                    callback_1(false, item);
                                                } else {
                                                    callback_1(true, {"status": "failure", "message": "Error adding service"});
                                                }
                                            }
                                        });
                                    }
                                }
                            ], function(error, result) {
                                if (error) callback(null, false, null,  {status: "error", message: "failed posting data"});
                                else {  //make product data for posting
                                    var status = req.body.status === 1 ? 'publish' : 'draft';                            
                                    data = {
                                        name: req.body.name,
                                        type: 'variable',
                                        price: req.body.price.toString(),
                                        regular_price: req.body.price.toString(),
                                        status: status,
                                        categories: result.categories,
                                        attributes: result.attributes,
                                        description: req.body.descr,
                                        short_description: req.body.terms,                                
                                        meta_data: [{
                                            key: "duration",
                                            value: req.body.duration
                                        }],
                                        images: [
                                            {
                                                src: req.body.s_images,
                                                position: 0,
                                                alt: result.advertisername + " " + req.body.name,
                                                name: result.advertisername + "-" + req.body.name + "-" + moment().format("YYYY-MM-DD-hh-mm-ss"),
                                            }
                                        ]                                
                                    };
                                    var temp = {
                                        advertiser: result.advertiser,
                                        advertisername: result.advertisername,
                                        outlets: result.outlets,
                                        outletWIds: result.outletWIds
                                    };
                                    callback(null, data, temp, null);
                                }
                            });
                        }
                    },  // post product to wp
                    function(item, temp, msg, callback) {
                        if (!item || item.length <= 0) callback(null, false, false, msg);
                        else {
                            WooCommerce.post('products', item, function(err, data, response) {
                                if (err) {
                                    callback(null, false, {"status": "failure", "message": "Error adding service"});
                                } else {
                                    var res = JSON.parse(response);
                                    if (res.message) {
                                        callback(null, false, {"status": "failure", "message": res.message});
                                    } else {                                        
                                        item.wooId = res.id;
                                        callback(null, item, temp, false);
                                    }
                                    
                                }
                            });
                        }
                    },  // post variation data for service
                    function(item, temp, msg, callback) {
                        if (!item) callback(null, false, msg);
                        else {
                            var data = [];               
                            var adId = null; 
                            item.outletWIds = temp.outletWIds;    
                            item.attributes.forEach(ii => {
                                if (ii.name == "Advertiser") adId = ii.id;                        
                                if (ii.name == "Branch") {
                                    temp.outlets.forEach(jj => {
                                        data.push({
                                            regular_price: req.body.price.toString(),
                                            "sale_price": req.body.price.toString(),                                    
                                            attributes: [
                                                {
                                                    id: ii.id,
                                                    name: ii.name,
                                                    option: jj
                                                },
                                                {
                                                    id: adId,
                                                    name: 'Advertiser',
                                                    option: temp.advertiser
                                                },
                                        ]                        
                                        });
                                    })
                                } 
                            });
                            item.variations = "";
                            if (data.length >0) {
                                var reqData = {
                                    create: data
                                };
                                var endpoint = 'products/' + item.wooId + '/variations';
                                WooCommerce.post('products/' + item.wooId + '/variations/batch', reqData, function(err, data, res) {
                                    var resp = JSON.parse(res);
                                    if (err || resp.message) callback(null, false, null);
                                    else {
                                        var vIds = [];
                                        if (resp.create && resp.create.length>0) {
                                            resp.create.forEach(ii => {
                                                vIds.push(ii.id);
                                            });
                                        }
                                        item.variations = vIds.join(",");
                                        callback(null, item, false)
                                    }
                                }); 
                            } else {                                
                                callback(null, item, null);
                            }
                        }
                    },  // post relationship of merchant and outlet to wp
                    function(item, msg, callback) {
                        if (!item) callback(null, false, msg);
                        else {
                            axios.post(mainUrl + 'wp-json/wp/v2/product_merchant_relationship', {
                                id: item.wooId,                        
                                authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",                                
                                relationship: item.outletWIds
                            }).then(function (response) {                                                       
                                callback(null, item, {"status": "success", "message": "Success posint outlet to wp"});                        
                            }).catch(function (error) {                    
                                callback(null, false, {"status": "failure", "message": "Error adding outlet to WP site"});
                            });                                      
                        }
                    },  // save woocommerce id to local database
                    function(item, msg, callback) {

                        if (!item) return callback(true, msg);
                        connection.query({sql: "INSERT INTO services (" + mustKeys.join(",") + " ,s_images, slug, outlets, woo_id, variations) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?)"},
                        [req.body.name, req.body.descr, req.body.price, req.body.type, req.body.subtype, req.body.terms, req.body.status, req.body.duration, req.body.advertiser_id, req.body.s_images, slug, req.body.outlets, item.wooId, item.variations],
                        function (error, results, fields) {                                    
                            if (error) {
                                callback(true, {"status": "error", "message": error.code});
                            }
                            else if (results.affectedRows == 1) {
                                callback(false, results.insertId);
                            } else {
                                callback(true, {"status": "error", "message": error.code});
                            }
                        });
                    }
                ], function(error, item) {
                    if (error) res.json(item);
                    else res.json({status: "success", id: item});
                });
            }
        });                

    }
}

module.exports.update = function (connection, WooCommerce, mainUrl) {
    return function (req, res) {
        if (req.body.id == "" || req.body.id == undefined) {
            res.json({"status": "failure", "message": "Invalid service id"});
        } else {
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
                    res.json({"status": "error", "message": "The Service name is used already"});
                } else {
                    var fields = ["name", "descr", "price", "type", "subtype", "terms", "status", "duration", "advertiser_id", "s_images"];
                    if (req.body.option == "activation")
                        fields = ["status"];            

                    var activeFields = [];
                    var updateData = {
                        categories: []
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
            
                            switch (field) {
                                case "name":
                                    updateData['name'] = req.body[field].replace(/'/g, "\\'");
                                    break;
                                case "price":
                                    updateData['regular_price'] = req.body[field].toString();
                                    break;
                                case 'descr':
                                    updateData['description'] = req.body[field].replace(/'/g, "\\'").trim();
                                    break;
                                case 'terms':
                                    updateData['short_description'] = req.body[field].replace(/'/g, "\\'").trim();
                                    break;
                                case 'status':
                                    var status = req.body[field] === 1 ? 'publish' : 'draft';
                                    updateData['status'] = status;
                                    break;
                                case 'type':
                                    updateData['type'] = req.body[field].trim();
                                    break;
                                case 'duration':
                                    updateData['duration'] = req.body[field].trim();
                                    break;
                                case 's_images':
                                    updateData['s_images'] = req.body[field].trim();
                                    break;
                            }
                        }
                    });
                    
                    var activateFlag = false;                    
                    async.waterfall([
                        function(callback) {
                            connection.query({sql : "select status from services where id=?"}, [req.body.id], function(error, results) {
                                if (error) callback(null, true, {status: 'message', message: 'Server error! Please contact webmaster!'});
                                else if (results.length > 0) {
                                    if (req.body.status != results[0].status) activateFlag = true;
                                    connection.query({ sql: "Update services set status=2 where id=?"}, [req.body.id], function(error, results) {
                                        if (error) callback(null, true, {status: 'message', message: 'Server error! Please contact webmaster!'});
                                        else if (results.affectedRows>0) {                                    
                                            callback(null, false, null);
                                        } else {
                                            callback(null, true, {status: 'message', message: 'Server error! Please contact webmaster!'});
                                        }
                                    })     
                                } else {
                                    callback(null, true, {status: 'message', message: 'Server error! Please contact webmaster!'});
                                }
                            });                            
                        },
                        // get categories from wp
                        function(err, msg, callback) {
                            res.json({status: "pending", message: "The action is pending now!"});
                            if (err) callback(null, false, msg);
                            var items = req.body.subtype.split(",");
                            items.push(req.body.type);
                            if (!items || items.length <= 0) return callback(null, false, msg);
                            
                            var count1 = 0;
                            var categories = [];
                            async.eachSeries(items, function(item, eachCallback) {
                                async.waterfall([
                                    function(callback_1) {
                                        WooCommerce.get('products/categories?search=' + item, function(err, data, response) {
                                            if (err) callback_1(false, {status: "error", message: "The type isn't on WP"});
                                            if (response && response.length>0) {
                                                var temp = JSON.parse(response);
                                                if (temp.message) callback_1(false, {status: "error", message: temp.message});
                                                else {
                                                    var selectedCat = null;
                                                    temp.forEach(cat => {
                                                        if (cat.name == item) selectedCat = {id: cat.id};
                                                    });
                                                    if (selectedCat != null) callback_1(selectedCat, null);
                                                    else   callback_1(false, {status: "error", message: "The type isn't on WP"});
                                                }                                            
                                            } else {
                                                callback_1(false, {status: "error", message: "The type isn't on WP"});
                                            }
                                        });            
                                    }
                                ], function(item, msg) {
                                    if (!item) return callback(null, false, msg);
                                    count1 ++;                            
                                    if (count1 == items.length) {                                
                                        categories.push(item);
                                        callback(null, categories, null);
                                    } else {
                                        categories.push(item);
                                        eachCallback();
                                    }
                                });
                            })
                        },// get woo id of service from database and integrate categories
                        function(items, msg, callback) {
                            if (!items || items.length <= 0) return callback(null, false, msg);
                            connection.query({sql: "SELECT woo_id FROM services WHERE id=" + req.body.id},
                            [],
                            function (error, results, fields) {
                                if (error) callback(null, false, {status: "error", message: "WP id isn't valid"});
                                if (results.length>0) {
                                    if (results[0].woo_id) {
                                        var temp = {
                                            wooId: results[0].woo_id
                                        }                                
                                        temp["categories"] = items;
                                        callback(null, temp, null);
                                    }
                                    else callback(null, false, {status: "error", message: "WP id isn't valid"});
                                } else {
                                    callback(null, false, {status: "error", message: "WP id isn't valid"});
                                }
                            });
                        },
                        function(items, msg, callback) {
                            if (!items || items.length <= 0) callback(null, false, null, msg);
                            else {
                                async.waterfall([ // advertiser woocommerce id
                                    function(callback_1) {
                                        connection.query({sql: "select woo_id, slug, name from advertisers where id=" + req.body.advertiser_id},
                                        [], function(error, results, filed) {
                                            if (error) callback_1(null, false, null);
                                            else if (results && results.length > 0) {
                                                var result = results[0];
                                                var temp = {
                                                    categories: items.categories,
                                                    advertiser: result.slug,
                                                    advertisername: result.name,
                                                    adWid: result.woo_id,
                                                    pId: items.wooId
                                                };                                    
                                                callback_1(null, temp, false);
                                            } else {
                                                callback_1(null, false, null);
                                            }
                                        })
                                    },  // outlet woocommerce id
                                    function(item, msg, callback_1) {
                                        if (!item) callback_1(null, false, {status: "error", message: "error in advertiser"});
                                        else {
                                            connection.query({sql: "SELECT woo_id, slug from outlets WHERE id in (" + req.body.outlets + ")"},
                                            [], function(error, results, filed) {
                                                if (error) callback_1(null, false, null);
                                                else if (results && results.length > 0) {
                                                    var temp = [];
                                                    var tempIds = [item.adWid];
                                                    results.forEach(res => {
                                                        temp.push(item.advertiser + '-' +res.slug);
                                                        tempIds.push(res.woo_id);
                                                    });
                                                    item.outlets = temp;
                                                    item.outletWIds = tempIds;
                                                    callback_1(null, item, false);
                                                } else {
                                                    callback_1(null, false, null);
                                                }
                                            });
                                        }
                                    },  //
                                    function(item, msg, callback_1) {
                                        if (!item) callback_1(null, false, {status: "error", message: "error in attributes"});
                                        else {
                                            WooCommerce.get('products/attributes', function(err, data, result) {
                                                if (err) {
                                                    callback_1(true, {"status": "failure", "message": "Error adding service"});
                                                } else {
                                                    var res = JSON.parse(result);
                                                    if (res.length >0) {
                                                        var attributes = [];
                                                        var attrIndex = 0;                                            
                                                        res.forEach(rr => {
                                                            if (rr.name == "Advertiser") {
                                                                attributes.push({
                                                                    id: rr.id,
                                                                    name: rr.name,
                                                                    visible: true,
                                                                    regular_price: req.body.price.toString(),                                                        
                                                                    variation: true,
                                                                    options: [item.advertiser]
                                                                });
                                                            } else if (rr.name == "Branch") {
                                                                attributes.push({
                                                                    id: rr.id,                                                                        
                                                                    name: rr.name,
                                                                    position: `${attrIndex}`,
                                                                    regular_price: req.body.price.toString(),
                                                                    visible: true,                                                        
                                                                    variation: true,
                                                                    options: item.outlets
                                                                });
                                                                attrIndex++;
                                                            }
                                                        });
                                                        item.attributes = attributes;
                                                        callback_1(false, item);
                                                    } else {
                                                        callback_1(true, {"status": "failure", "message": "Error adding service"});
                                                    }
                                                }
                                            });
                                        }
                                    }
                                ], function(error, result) {
                                    if (error) callback(null, false, null,  {status: "error", message: "failed posting data"});
                                    else {
                                        var status = req.body.status === 1 ? 'publish' : 'draft';                            
                                        data = {
                                            id: items.wooId,
                                            name: req.body.name,
                                            type: 'variable',
                                            price: req.body.price.toString(),
                                            regular_price: req.body.price.toString(),
                                            status: status,
                                            "attributes": result.attributes,
                                            categories: result.categories,
                                            description: req.body.descr,
                                            short_description: req.body.terms,
                                            meta_data: [{
                                                key: "duration",
                                                value: req.body.duration
                                            }],
                                            images: [
                                                {
                                                    src: req.body.s_images,
                                                    position: 0,
                                                    alt: result.advertisername +  " " + req.body.name,
                                                    name: result.advertisername + "-" + req.body.name + "-" + moment().format("YYYY-MM-DD-hh-mm-ss"),
                                                }
                                            ] 
                                        };
                                        var temp = {
                                            attributes: result.attributes,
                                            advertiser: result.advertiser,
                                            advertisername: result.advertisername,
                                            outlets: result.outlets,
                                            outletWIds: result.outletWIds,
                                            pId: result.pId,
                                            oldVariations: items.oldVariations,
                                            oldOutlets: items.oldOutlets
                                        };
                                        callback(null, data, temp, null);
                                    }
                                });
                            }
                        }, // update service data on wp
                        function(items, temp, msg, callback) {
                            if (!items || !temp.pId ) callback(null, false, null, null, msg);
                            else {                    
                                WooCommerce.put('products/'+items.id, items, function(err, data, response) {
                                    if (err) {
                                        callback(null, null, {"status": "failure", "message": "Error adding service"});
                                    } else {
                                        var vIds = [];
                                        var res = JSON.parse(response);
                                        callback(null, items, temp, res, false);
                                    }
                                });
                            }
                        }, // update variations terms
                        function(item, temp, res, msg, callback) {
                            if (!item) callback(null, false, msg);
                            else if (res.message) callback(null, false, {"status": "failure", "message": "Error adding service"});
                            else {
                                var variations = res.variations;                            
                                async.waterfall([
                                    function(callback_1) {
                                        var existedVariation = [];
                                        var unExistedVariation = [];
                                        var needVariation = [];
                                        var estep = 0;
                                        async.eachSeries(temp.outlets, function(outlet, eachOutletCallback) {
                                            async.waterfall([
                                                function(callback_2) {
                                                    WooCommerce.get('products/' + item.id + '/variations?search=' + outlet, function(err, data, res) {
                                                        if (err) callback_2(true, null);
                                                        else {
                                                            var resp = JSON.parse(res);
                                                            if (resp.length == 0) unExistedVariation.push(outlet);
                                                            else existedVariation.push(resp[0].id);
                                                            if (resp && resp[0] && !resp[0].visible) needVariation.push(resp[0].id);
                                                            callback_2(false, false);
                                                        }
                                                    });
                                                }
                                            ], function(error, result) {
                                                if (error) callback_1(null, false, null, null, null);
                                                else {
                                                    estep++;
                                                    if (estep == temp.outlets.length) callback_1(null, true, existedVariation, unExistedVariation, needVariation);
                                                    else eachOutletCallback();
                                                }
                                            })
                                        })
                                    },
                                    function(flag, existedVariation, unExistedVariation, needVariation, callback_1) {
                                        if (!flag) callback_1(true, {status: "error", message: "error on updating"});
                                        else {
                                            var data = [];               
                                            var adId = null; 
                                            item.outletWIds = temp.outletWIds;
                                            var updateVariation = [];  
                                            
                                            //new variation 
                                            temp.attributes.forEach(ii => {
                                                if (ii.name == "Advertiser") adId = ii.id;                        
                                                if (ii.name == "Branch") {
                                                    unExistedVariation.forEach(jj => {                                            
                                                        data.push({
                                                            regular_price: req.body.price.toString(),
                                                            "visible": true,                                                                                                
                                                            attributes: [
                                                                {
                                                                    id: ii.id,
                                                                    name: ii.name,
                                                                    option: jj
                                                                },
                                                                {
                                                                    id: adId,
                                                                    name: 'Advertiser',
                                                                    option: temp.advertiser
                                                                },
                                                        ]                        
                                                        });                                                        
                                                    })
                                                } 
                                            });

                                            // disable variations that exited but not related this service
                                            variations.forEach(vv=> {
                                                if (existedVariation.indexOf(vv) < 0 && needVariation.indexOf(vv) < 0) 
                                                    updateVariation.push({
                                                        "id": vv,
                                                        "visible": false,
                                                        regular_price: req.body.price.toString(),                                                        
                                                    })
                                                if (existedVariation.indexOf(vv) >=0)
                                                    updateVariation.push({
                                                        "id": vv,
                                                        "visible": req.body.status?true: false,                                                        
                                                        regular_price: req.body.price.toString(),
                                                    })
                                            });

                                            needVariation.forEach(nn=> {
                                                var tempvvs = updateVariation.filter(kk => kk.id==nn);
                                                if (tempvvs.length <= 0)
                                                    updateVariation.push({
                                                        "id": nn,
                                                        "visible": req.body.status?true:false,
                                                        regular_price: req.body.price.toString(),                                                        
                                                    });
                                            });                                            
                                            
                                            item.allVariations = variations;
                                            if (data.length >0 || updateVariation.length > 0) {
                                                var reqData = {
                                                    update: updateVariation,
                                                    create: data
                                                };
                                                var endpoint = 'products/' + item.id + '/variations';
                                                WooCommerce.post('products/' + item.id + '/variations/batch', reqData, function(err, data, res) {
                                                    if (err || res.message) callback(null, false, null);
                                                    else {
                                                        var resp = JSON.parse(res);
                                                        var allVariations = [];
                                                        
                                                        if (resp.create && resp.create.length > 0) {
                                                            resp.create.forEach(ii=> {
                                                                allVariations.push(ii.id);                                                                
                                                            });
                                                        }

                                                        if (resp.update && resp.update.length>0) {
                                                            resp.update.forEach(ii=> {
                                                                //if ( ii.visible && allVariations.indexOf(ii.id) < 0)
                                                                    allVariations.push(ii.id);
                                                            });
                                                        }
                                                        item.allVariations = allVariations;                                                        
                                                        callback(null, item, false);
                                                    }
                                                }); 
                                            } else {
                                                callback(null, item, null);
                                            }
                                        }
                                    }
                                ])
                                
                            }
                        },
                        function(item, msg, callback) {
                            if (!item) callback(true, msg);
                            else {
                                axios.post(mainUrl + 'wp-json/wp/v2/product_merchant_relationship', {
                                    id: item.id,                        
                                    authKey: "q1(mt1*4ZZj15)XW(w^jBHuD",                                
                                    relationship: item.outletWIds
                                }).then(function (response) {                                                       
                                    callback(null, item, {"status": "success", "message": "Success posint outlet to wp"});                        
                                }).catch(function (error) {                    
                                    callback(null, false, {"status": "failure", "message": "Error adding outlet to WP site"});
                                });                                      
                            }
                        },
                        function(item, msg, callback) {
                            if (!item) return callback(null, null, msg);
                            var qmarks = "?,".repeat(activeFields.length).replace(/(^\s*,)|(,\s*$)/g, '');
                            connection.query({sql: "UPDATE services SET " + activeFields.join(",") + ",slug=?, outlets=?, variations=? WHERE id= " + req.body.id},
                            [slug, req.body.outlets, item.allVariations.join(",")],
                            function (error, results, fields) {
                                if (error) {
                                    callback(null, null, {"status": "error", "message": error.code});
                                }
                                else if (results.affectedRows == 1) {
                                    var tempdata = {
                                        swId: item.id,
                                        id: req.body.id,
                                        status: req.body.status,
                                        variations: item.allVariations.join(",")
                                    }
                                    callback(null, tempdata, {status: "success", message: "Success updating!"});
                                } else {
                                    callback(null, null, {status: "error", message: "Failed updating!"});
                                }
                            });
                        },
                        function(item, msg, callback) {
                            if (!item) callback(true, msg);
                            else if (activateFlag) {
                                module.exports.doActivateService(item, connection, WooCommerce, function(err, result) {
                                    callback(err, result);
                                })
                            } else {
                                callback(false, {status: "success", message: "Success updating"});
                            }
                        }
                    ], function(error, message) {
                        req.io.emit('activatingService', message);
                    });
                }
            });
        }                
         
    }
}

module.exports.delete = function (connection, WooCommerce) {
    return function (req, res) {
        if (req.body.status == "" || req.body.status == undefined || req.body.service_id == "" || req.body.service_id == undefined) {
            res.json({"status": "error", "message": "error changing status"});
        }
        var newStatus = req.body.status == "0" ? 0 : 1;
        connection.query({sql: "UPDATE services SET status=? WHERE id=?"},
            [newStatus, req.body.service_id],
            function (error, results, fields) {
                if (error) {
                    res.json({"status": "error", "message": error.code});
                }
                else if (results.affectedRows == 1) {
                    connection.query({sql: "Select woo_id from services WHERE id= " + req.body.id + " limit 1"},
                        function (error, result) {
                            if (typeof result  !== 'undefined') {
                                var serviceId = result[0].woo_id;
                                WooCommerce.post('products/' + serviceId, {status: 'draft'}, function(err, data, response) {
                                    if (err) {
                                        res.json({"status": "failure", "message": "Error adding service"});
                                    } else {
                                        res.json({
                                            "status": "success",
                                            "message": "Service updated successfully"
                                        });
                                    }
                                });
                            } else {
                                res.json({"status": "failure", "message": "Error updating service"});
                            }
                        });

                }
                else res.json({"status": "failure", "message": "Error updating service"});
            });
    }
}

module.exports.doActivateService = function(service, connection, MyWooCommerce, pCallback) {
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

module.exports.activate = function(connection, WooCommerce) {
    return function (req, res) {
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
                        
                        doActivateService(data, connection, WooCommerce, function(err, result) {
                            callback(err, result);
                        })
                    }
                }
            ], function(err, result) {
                req.io.emit('activatingService', result);                
            });
        }
    }
}