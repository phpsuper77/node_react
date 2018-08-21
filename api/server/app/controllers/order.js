var config = require('config');
var async = require('async');
var db = require('../../db');
var qr = require('../../utils/qr');
var mail = require('../../app/services/mail');
var moment = require('moment');
var voucher_codes = require('voucher-code-generator');
var dbConnection = db.createConnection();
var wpDbConnection = db.createWpDbConnection();

module.exports = {

    qr: function(req, res, next) {
        if (req.body.id){
            var req_type = req.body.type;

            if (req_type && req_type == 'email_me') {
                var expiryDate = moment(req.body.expiredate).add(60, 'days').format("D MMM YYYY");
                var orderedAdvertiserNameInfo = new Array();
                var orderedProductNameInfo = new Array();
                var email = req.body.email;
                var firstName = req.body.firstName;
                var lastName = req.body.lastName;

                var item = {
                    product_id: req.body.productId
                };

                async.waterfall([
                    function(callback) {
                        var itemName = req.body.itemName;
                        var itemNameArray = itemName.split(",");
                        if (itemNameArray.length == 2) {
                            var serviceName_advertiserName = itemNameArray[0].trim();
                            var advertiserName_outletName = itemNameArray[1].trim();

                            var serviceName_advertiserName_Array = serviceName_advertiserName.split(" - ");
                            if (serviceName_advertiserName_Array.length == 2) {
                                var serviceName = serviceName_advertiserName_Array[0].trim();                                               // Simple haircut
                                var advertiserName = serviceName_advertiserName_Array[1].trim();                                            // phs-hairscience

                                var indexOf_advertiserName = advertiserName_outletName.indexOf(advertiserName);
                                var lengthOf_advertiserName = advertiserName.length;
                                var outletName = advertiserName_outletName.substr(indexOf_advertiserName + lengthOf_advertiserName + 1);    // ngee-ann-city

                                if (advertiserName && advertiserName != "" && outletName && outletName != "" && serviceName && serviceName != "") {
                                    item.advertiserName = advertiserName;
                                    item.outletName = outletName;
                                    item.serviceName = serviceName;


                                    callback(null, item);
                                } else {
                                    callback(Error("Invalid Advertiser Name and Outlet Name"), item);
                                }
                            } else {
                                callback(Error("Invalid Service Name and Advertise Name"), item);
                            }
                        } else {
                            callback(Error("Invalid Item Name Array"), item);
                        }
                    },
                    function(item, callback) {
                        wpDbConnection.query({sql: "SELECT ID as id,post_excerpt, post_content FROM f5ATe_posts WHERE ID = ? limit 1"},
                            [item.product_id],
                            function (err, results, fields) {
                                
                                if (err) {
                                    callback(Error("WP DB Select Query Error!"), item);
                                } else if (results) {

                                    if (results.length > 0) {
                                       
                                        item.outletTerms = results[0].post_excerpt;
                                        item.postContent = results[0].post_content;
                                        
                                        callback(null,item);
                                    } else {
                                        callback(Error("WP DB Select Query No Result!"), item);
                                    }
                                } else {
                                    callback(Error("WP DB Select Query Error!"), item);
                                }
                            }
                        );
                    },
                    function(item, callback) {

                        wpDbConnection.query({sql: "SELECT * FROM f5ATe_postmeta WHERE post_id = ? AND meta_key = 'redeemed_count' limit 1"},
                            [item.product_id],
                            function (err, results, fields) {
                              // console.log(results)
                                if (err) {
                                    callback(null, item, null);
                                } else if (results) {
                                    if (results.length > 0) {
                                        callback(null, item, results[0].meta_id);
                                    } else {
                                        callback(null, item, null);
                                    }
                                } else {
                                    callback(null, item, null);
                                }
                            }
                        );
                    },
                    function(item, redeemed_count_id, callback) {
                        
                        if (redeemed_count_id) {
                            callback(null, item);
                        } else {
                            wpDbConnection.query({sql: "INSERT INTO f5ATe_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)"},
                                [item.product_id, 'redeemed_count', 0],
                                function (err, post_metas, fields) {
                                   // console.log(err, post_metas, fields)
                                    if (err) {

                                        callback(Error("WP DB Insert Query Error!"), item);
                                    } else if (post_metas) {
                                        callback(null, item);
                                    } else {
                                        callback(Error("WP DB Insert Query Error!"), item);
                                    }
                                }
                            );
                        }
                    },
                    function(item, callback) {
                        
                        dbConnection.query({sql: "SELECT A.*, A.id AS advertiser_id, A.name AS advertiser_name, B.name AS outlet_name, B.descr AS outlet_descr, B.email AS outlet_email, B.phone AS outlet_contact, " +
                                "B.address AS outlet_address, B.linked_services AS outlet_linked_services" +
                                " FROM advertisers A LEFT JOIN outlets B ON A.id = B.advertiser_id WHERE A.slug = ?"},
                            [item.advertiserName],
                            function (err, results, fields) {
                                //console.log(item)
                                if (err) {
                                    callback(Error("DB Select Query Error!"), item, null);
                                } else if (results) {
                                    if (results.length > 0) {
                                       //console.log(item)  
                                        var outlet_info = [];
                                        results.forEach(function(row) {
                                            var outletNameregen = row.outlet_name.replace(/[^\w\s]/gi, '').replace(/\s\s+/g, ' ').replace(/\s+/g, '-').toLowerCase();;
                                            outlet_info.push({
                                                outlet_address: row.outlet_address,
                                                outlet_contact: row.outlet_contact,
                                                outlet_brandname: row.outlet_name,
                                                email: row.outlet_email,
                                                url: 'https://services.dailyvanity.sg/merchant/'+ outletNameregen                                              
                                            });
                                            item.advertiserId = row.advertiser_id;
                                            item.outletEmail = row.outlet_email;
                                        });
                                        callback(null, item, outlet_info);
                                    } else {
                                        callback(Error("DB Select Query No Result!"), item, null);
                                    }
                                } else {
                                    callback(Error("DB Select Query Error!"), item, null);
                                }
                            }
                        );
                    },
                    function(item, outletObj, callback) {
                       // console.log(item)
                        var sql = "SELECT a.voucher vcode, a.expirey_date expiryDate, b.id orderId, a.advertiser_id adId FROM voucher_code as a LEFT JOIN orders as b on a.order_id=b.id \
                        WHERE b.order_id=? AND b.service_id=? AND a.state=0";                        
                        dbConnection.query({sql: sql},
                            [req.body.id, req.body.productId],
                            function (err, results, fields) {                                
                                if (err) {
                                    callback(Error("DB Select Query Error!"), item, outletObj, null);
                                } else if (results) {
                                    if (results.length > 0) {
                                        callback(null, item, outletObj, results);
                                    } else {
                                        callback(Error("DB Select Query No Result!"), item, outletObj, null);
                                    }
                                } else {
                                    callback(Error("DB Select Query Error!"), item, outletObj, null);
                                }
                            }
                        );
                    },
                    function(item, outletObj, voucherObj, callback) {   
                    //console.log(item, outletObj, voucherObj, callback)                     
                        var eachCounter_1 = 0;
                        // console.log(voucherObj) 
                        async.eachSeries(voucherObj, function(voucher, eachVcallback) {  

                            async.waterfall([
                                function(callback_1) {
                                    var mailData = {
                                        serviceName: item.serviceName,
                                        firstName: firstName,
                                        lastName: lastName,
                                        advertiserName: item.advertiserName.split("-").join(" ").split(" ").map(function(i){return i[0].toUpperCase() + i.substring(1)}).join(" "),
                                        outletName: item.outletName,
                                        outletEmail: item.outletEmail,
                                        outletInfo: outletObj,
                                        expiryDate: expiryDate,
                                        outletTerms: item.outletTerms,
                                        vcode: voucher.vcode,
                                        orderId: voucher.orderId,
                                        advertiserId: item.advertiserId,
                                        price: req.body.total
                                    }; 
                                    qr.sendQR(email, voucher.orderId, mailData, function(err, result) {
                                        if (err) {
                                            callback_1(err, null);
                                        } else {
                                            if (result == true) {
                                                callback_1(null, mailData);
                                            }
                                        }
                                    });										
                                }
                            ], function(err, result) { 
                                if (!result) {
                                    callback(Error("Send qr email Error!"), null);
                                } else {
                                    eachCounter_1++;
                                    if (eachCounter_1 === voucherObj.length) {
                                        callback(null, result);
                                    } else {
                                        eachVcallback();
                                    }
                                }
                            });
                        });                        
                    }
                ], function (err, result) {
                    res.json({"code": "succeed", "err": err});
                });

            } else {
 
                var expiryDate = moment(datePaidGMT).add(60, 'days').format("YYYY-MM-DD");
                var email = req.body.billing.email;
                var gender = req.body.billing.gender;
                var age = req.body.billing.age;                
                var items = req.body.line_items;                
                var firstName = req.body.billing.first_name;
                var lastName = req.body.billing.last_name;
                var datePaidGMT = req.body.date_paid_gmt;
                //var expiryDate = new Date(datePaidGMT);
                //expiryDate.setDate(expiryDate.getDate() + 60);
                //expiryDate = expiryDate.getDate() + '/' + (expiryDate.getMonth() + 1).toString() + '/' + expiryDate.getFullYear();
//console.log(req.body)

                var expiryDate = moment(datePaidGMT).add(60, 'days').format("D MMM YYYY");
                console.log(expiryDate);
                var orderedAdvertiserNameInfo = new Array();
                var orderedProductNameInfo = new Array();

                var eachCounter = 0; var eachCounter_1 = 0;                
                async.eachSeries(items, function(item, eachCallback) {                    
                    async.waterfall([
                        function(callback) {
                            var serviceId = item.product_id;
                            var variationId = item.variation_id;
                            var itemName = item.name;
                            var itemNameArray = itemName.split(",");                            
                            if (itemNameArray.length == 2) {
                                var serviceName_advertiserName = itemNameArray[0].trim();
                                var advertiserName_outletName = itemNameArray[1].trim();

                                var serviceName_advertiserName_Array = serviceName_advertiserName.split(" - ");
                                if (serviceName_advertiserName_Array.length == 2) {
                                    var serviceName = serviceName_advertiserName_Array[0].trim();                                               // Simple haircut
                                    var advertiserName = serviceName_advertiserName_Array[1].trim();                                            // phs-hairscience

                                    var indexOf_advertiserName = advertiserName_outletName.indexOf(advertiserName);
                                    var lengthOf_advertiserName = advertiserName.length;
                                    var outletName = advertiserName_outletName.substr(indexOf_advertiserName + lengthOf_advertiserName + 1);    // ngee-ann-city
                                    
                                    if (advertiserName && advertiserName != "" && outletName && outletName != "" && serviceName && serviceName != "") {
                                        item.advertiserName = advertiserName;
                                        item.outletName = outletName;
                                        item.serviceName = serviceName;
                                        callback(null, item);
                                    } else {
                                        callback(Error("Invalid Advertiser Name and Outlet Name"), item);
                                    }
                                } else {
                                    callback(Error("Invalid Service Name and Advertise Name"), item);
                                }
                            } else {
                                callback(Error("Invalid Item Name Array"), item);
                            }
                        },
                        function(item, callback) {
                            wpDbConnection.query({sql: "SELECT post_excerpt, post_content FROM f5ATe_posts WHERE ID = ? limit 1"},
                                [item.product_id],
                                function (err, results, fields) {
                                  //  console.log(results, 'this is f5ATe_posts')
                                    if (err) {
                                        callback(Error("WP DB Select Query Error!"), item);
                                    } else if (results) {
                                        if (results.length > 0) {
                                            item.outletTerms = results[0].post_excerpt;
                                            item.postContent = results[0].post_content;
                                            callback(null, item);
                                        } else {
                                            callback(Error("WP DB Select Query No Result!"), item);
                                        }
                                    } else {
                                        callback(Error("WP DB Select Query Error!"), item);
                                    }
                                }
                            );
                        },
                        function(item, callback) {
                            wpDbConnection.query({sql: "SELECT * FROM f5ATe_postmeta WHERE post_id = ? AND meta_key = 'redeemed_count' limit 1"},
                                [item.id],
                                function (err, results, fields) {
                                   // console.log(results, 'this is f5ATe_postmeta')
                                    if (err) {
                                        callback(null, item, null);
                                    } else if (results) {
                                        if (results.length > 0) {
                                            callback(null, item, results[0].meta_id);
                                        } else {
                                            callback(null, item, null);
                                        }
                                    } else {
                                        callback(null, item, null);
                                    }
                                }
                            );
                        },
                        function(item, redeemed_count_id, callback) {
                            if (redeemed_count_id) {
                                callback(null, item);
                            } else {
                                wpDbConnection.query({sql: "INSERT INTO f5ATe_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)"},
                                    [item.id, 'redeemed_count', 0],
                                    function (err, post_metas, fields) {
                                        //console.log(post_metas, 'this is 3rd f5ATe_postmeta')
                                        if (err) {
                                            callback(Error("WP DB Insert Query Error!"), item);
                                        } else if (post_metas) {
                                            callback(null, item);
                                        } else {
                                            callback(Error("WP DB Insert Query Error!"), item);
                                        }
                                    }
                                );
                            }
                        },
                        function(item, callback) {
                            console.log(item)
                            item.service_id = null;
                            dbConnection.query({sql: "SELECT id FROM services WHERE woo_id=? LIMIT 1"},
                            [item.product_id],
                                function (err, services, fields) {
                                    console.log(services, 'this is  service')
                                    if (err) {
                                        callback(Error("DB Insert Query Error!"), item);
                                    } else if (services.length > 0) {
                                        item.service_id = services[0].id ;
                                        callback(null, item);
                                    } else {
                                        callback(null, item);
                                    }
                                }
                            );
                        },
                        function(item, callback) {
                            console.log(item,expiryDate, 'this is insertions')
                            var exDate = expiryDate;                                                                      
                            dbConnection.query({sql: "INSERT INTO orders (descr, service_id, local_service_id, payment_info, redemption, redeemed, quantity, order_id, email, status, user_id, adate, customer, expireyDate, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"},
                                [null, item.product_id, item.service_id,item.total, null, 0, item.quantity, req.body.id, email, 1, null, datePaidGMT, firstName + ' ' + lastName, exDate, item.price],
                                function (err, orders, fields) {
                                    console.log(orders, 'this is  service')
                                    if (err) {
                                        callback(Error("DB Insert Query Error!"), item, null);
                                    } else if (orders) {
                                        callback(null, item, orders);
                                    } else {
                                        callback(Error("DB Insert Query Error!"), item, null);
                                    }
                                }
                            );
                        },
                        // get advertiser id and email information on admin dahsboard database
                        function(item, orderObj, callback) {
                            dbConnection.query({sql: "SELECT id, email, name, commission FROM advertisers WHERE slug = ? limit 1"},
                            [item.advertiserName],
                            function (err, results, fields) {
                                console.log(results, 'this is  advertiser')
                                if (err) {
                                    callback(null, item, orderObj, null);
                                } else if (results) {
                                    if (results.length > 0) {
                                        callback(null, item, orderObj, results[0]);
                                    } else {
                                        callback(null, item, orderObj, null);
                                    }
                                } else {
                                    callback(null, null, orderObj, null);
                                }
                            }); 
                        },
                        function(item, orderObj, advertiser, callback) {
                            var eachCounter_1 = 0;
                            var new_items = [];
                            async.eachSeries(item.outlet_info, function(qitem, eachVCallback) {
                                console.log(qitem.outlet_brandname)
                                async.waterfall([
                                    function(callback_1) {
                                        dbConnection.query({sql: "select email FROM outlets WHERE name=?"}, 
                                            [qitem.outlet_brandname], 
                                            function(err, results, fields) {
                                                console.log(results, 'this is  outlets')
                                                if (err) {
                                                    callback_1(Error("DB Select Query Error!"), null);
                                                } else if (results) {
                                                    var outlet = results[0];
                                                    // if (outlet.slug == item.outletName)
                                                    //     item.outletName = outlet.name;

                                                    qitem.email = outlet.email;
                                                    callback_1(null, qitem);
                                                } else {
                                                    callback_1(Error("DB Insert Query Error!"), null);
                                                }                                
                                        });
                                    }
                                ], function(error, res) {
                                    if (error) callback(null, item, orderObj, advertiser);
                                    else {
                                        eachCounter_1++;
                                        if (eachCounter_1==item.outlet_info.length) {
                                            new_items.push(res);
                                            item.outlet_info = new_items;
                                            callback(null, item, orderObj, advertiser)
                                        } else {
                                            new_items.push(res);
                                            eachVCallback();
                                        }
                                    }
                                })
                            })
                        },                        
                        function (item, orderObj, advertiser, callback) {
                            var qItems = [];                            
                            for(i=0; i< item.quantity; i++) {                                
                                qItems.push({key: i, data: item})
                            };
                            var eachCounter_1 = 0;
                            async.eachSeries(qItems, function(qitem, eachVcallback) {
                                var sitem = qitem.data;      
                               // console.log(qitem, 'this is  qitemmmmmmmmmmmmmmmmmmmmm')                          
                                async.waterfall([
                                    function(callback_1) {
                                        let vcodes = voucher_codes.generate({
                                            length: 6,
                                            count: 1,
                                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                                        });
                                        let vcode = vcodes[0]; 
                                        //console.log(vcode);  

                                       var exDate = expiryDate;
                                        //var exDate = moment(datePaidGMT).add(60, 'days');
                                        var purchaseDate =   moment().format('D MMM YYYY hh:mm A');                                          
                                        dbConnection.query({sql:  "INSERT INTO voucher_code (voucher, order_id, advertiser_id, ad_email, service_id, expirey_date, state, first_name, last_name, age, gender, item_id, purchase_date, commission, outlet_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"}, 
                                        [vcode, orderObj.insertId, advertiser.id, advertiser.email, sitem.serviceName, exDate, 0, firstName, lastName, age, gender, item.id, purchaseDate, advertiser.commission, sitem.outletName], 
                                            function(err, vouchers, fields) {
                                                //console.log(results, 'this is  voucher')
                                                if (err) {
                                                    callback_1(Error("DB Insert Query Error!"), null);
                                                } else if (vouchers) {
                                                    sitem.vcode = vcode;
                                                    callback_1(null, sitem);
                                                } else {
                                                    callback_1(Error("DB Insert Query Error!"), null);
                                                }                                
                                        });
                                    },
                                    function(gitem, callback_1) {
                                        if (!gitem) return callback_1(Erro("Voucher generating error"), null);
                                        var mailData = {
                                            serviceName: gitem.serviceName,
                                            firstName: firstName,
                                            lastName: lastName,
                                            advertiserName: advertiser.name,
                                            outletName: gitem.outletName,
                                            outletInfo: gitem.outlet_info,
                                            expiryDate: expiryDate,
                                            outletTerms: gitem.outletTerms,
                                            vcode: gitem.vcode,
                                            orderId: orderObj.insertId,
                                            advertiserId: advertiser.id,
                                            price: gitem.price,
                                            quantity: gitem.quantity,
                                            postContent: gitem.postContent
                                        }; 
                                        qr.sendQR(email, orderObj.insertId, mailData, function(err, result) {
                                            if (err) {
                                                callback_1(err, null);
                                            } else {
                                                if (result == true) {
                                                    callback_1(null, mailData);
                                                }
                                            }
                                        });										
                                    }
                                ], function(err, result) {                                    
                                    if (!result) {
                                        callback(Error("Send qr email Error!"), null);
                                    } else {
                                        eachCounter_1++;
                                        if (eachCounter_1 === qItems.length) {
                                            callback(null, result, advertiser);
                                        } else {
                                            eachVcallback();
                                        }
                                    }
                                });
                            }); 
                        },
                        // to send voucher mail to advertiser
                        function(mailData, advertiser, callback) {
                            mailData.paidDate = moment(req.body.date_paid).format("D MMM YYYY ");                                
                            mailData.email = email.substr(0, email.indexOf('@') + 1);
                            mailData.email += "******";
                            mailData.gender = gender;
                            mailData.age = age;
                            if (advertiser.email) {
                                
                                mail.sendEmailToAd(advertiser.email, mailData, function(err, result) {
                                    if (err) {
                                        callback(null, mailData);
                                    } else {
                                        callback(null, mailData);
                                    }
                                })
                            } else {
                                callback(null, mailData);
                            }                            
                        }, 
                        // to send voucher email to outlet
                        function(mailData, callback) {
                            var lcount = 0;
                            async.eachSeries(mailData.outletInfo, function(outlet, eachOCallback) {
                                async.waterfall([
                                    function(callback_1) {
                                        mail.sendEmailToAd(outlet.email, mailData, function(err, result) {
                                            if (err) callback_1(true, null);
                                            else callback_1(false, result);
                                        });    
                                    }

                    ],  function(err, result) {
                        if (err) callback(err, {code: "failed"});
                        else {
                            lcount++;
                            if (lcount == mailData.outletInfo.length) callback(false, null);
                            else eachOCallback();
                        }
                    })
                });
            }

        ],          function (err, result) {
                        eachCounter++;
                        if (eachCounter === items.length) {
                            res.json({"code": "succeed"});
                        } else {
                            eachCallback();
                        }
                    });
                }, function(err) {
                    res.json({"code": "failed"});
                });
            }
        } else {
            res.json({"code": "failed"});
        }
    },

    templateOrder: function(req, res, next) {
		wpDbConnection.query({sql: "update f5ATe_postmeta set post_id=1, meta_key='1112323', meta_value='wow' where 1"},
         [],
         function (err, post_metas, fields) {
             if (err) {
                 res.json({status: 'failed', msg: 'failed action'});
             } else if (post_metas.affectedRows > 0) {
				 wpDbConnection.query({sql: "update f5ATe_posts set post_excerpt=1, post_content='kkkkk' where 1"},
         		 [],
         		 function (err, post_metas, fields) {
             		if (err) {
                 		res.json({status: 'failed', msg: 'failed action'});
             		} else if (post_metas.affectedRows > 0) {
				
                		 res.json({status: 'success', msg: 'success action'});
             		} else {
                  		res.json({status: 'failed', msg: 'failed action'});
             		}
         		 });                 
             } else {
                  res.json({status: 'failed', msg: 'failed action'});
             }
         });		
	},
    
    update: function(req, res, next) {
        if (req.query.email && req.query.itemId && req.query.orderId && req.query.firstName && req.query.advertiserName && req.query.outletName && req.query.serviceName) {
            var orderId = req.query.orderId;

            async.waterfall([
                function(callback) {
                    dbConnection.query({sql: "SELECT id, descr, service_id, payment_info, redemption, redeemed, quantity, email, status, user_id, adate FROM orders WHERE id = ? limit 1"},
                        [orderId],
                        function (err, results, fields) {
                            if (err) {
                                callback(Error("DB Select Query Error!"), null);
                            } else if (results) {
                                if (results.length > 0) {
                                    callback(null, results[0]);
                                } else {
                                    callback(Error("DB Select Query No Result!"), null);
                                }
                            } else {
                                callback(Error("DB Select Query Error!"), null);
                            }
                        });
                },
                function(orderObj, callback) {
                    if (orderObj.redeemed < orderObj.quantity) {
                        dbConnection.query({sql: "Update orders Set redemption = ?, redeemed = redeemed + 1 WHERE id = ?"},
                            [new Date(), orderId],
                            function (error, results) {
                                if (error) {
                                    callback(Error("DB Update Query Error!"), orderObj);
                                } else {
                                    callback(null, orderObj);
                                }
                            }
                        )
                    } else {
                        callback(Error("Redeemed count exceeds quantity!"), orderObj);
                    }
                },
                function(orderObj, callback) {
                    if (orderObj.redeemed < orderObj.quantity) {
                        wpDbConnection.query({sql: "Update f5ATe_postmeta Set meta_value = ? WHERE post_id = ? AND meta_key = 'redeemed_count'"},
                            [orderObj.redeemed + 1, req.query.itemId],
                            function (error, results) {
                                if (error) {
                                    callback(Error("WP DB Update Query Error!"), orderObj);
                                } else {
                                    callback(null, orderObj);
                                }
                            }
                        )
                    } else {
                        callback(Error("Redeemed count exceeds quantity!"), orderObj);
                    }
                },
                function(orderObj, callback) {
                    if (orderObj.redeemed + 1 == orderObj.quantity) {
                        wpDbConnection.query({sql: "INSERT INTO f5ATe_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)"},
                            [req.query.itemId, 'redeemed_date', new Date()],
                            function (err, post_metas, fields) {
                                if (err) {
                                    callback(Error("WP DB Insert Query Error!"), orderObj);
                                } else if (post_metas) {
                                    callback(null, orderObj);
                                } else {
                                    callback(Error("WP DB Insert Query Error!"), orderObj);
                                }
                            }
                        )
                    } else {
                        callback(null, orderObj);
                    }
                },
                function(orderObj, callback) {
                    var redemptionDate = new Date();
                    redemptionDate = redemptionDate.getDate() + '/' + (redemptionDate.getMonth() + 1).toString() + '/' + redemptionDate.getFullYear();

                    var redemption_left = orderObj.quantity - orderObj.redeemed - 1;
                    if (redemption_left < 0) {
                        callback(Error("Redemption number reaches quantity!"), 0);
                    } else {
                        var mailData = {
                            firstName: req.query.firstName,
                            redemptionDate: redemptionDate,
                            redemptionLeft: redemption_left,
                            outletName: req.query.outletName,
                            serviceName: req.query.serviceName,
                            advertiserName: req.query.advertiserName
                        };

                        mail.sendRedemptionEmail(config.get('mailgun.from'), req.query.email, mailData, function(err, result) {
                            if (err) {
                                callback(err, redemption_left);
                            } else {
                                callback(null, redemption_left);
                            }
                        });
                    }
                }
            ], function(err, result) {
                if (err) {
                    res.render('reached');
                } else {
                    if (result < 0) {
                        res.render('reached');
                    } else {
                        res.render('success', { redemption_left : result.toString() });
                    }
                }
            });
        }
    },
    test: function(req, res, next) {
        res.json({"code": "test API call succeed!"});
    }
}