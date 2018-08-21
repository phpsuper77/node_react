var path = require('path');
var db = require('../../db');
var mail = require('../services/mail');
var async = require('async');
var config = require('config');
var moment = require('moment');

var DIR = './uploads/';
var dbConnection = db.createConnection();
var wpDbConnection = db.createWpDbConnection();

module.exports = {

    confirm: function(req, res, next) {
        var params = req.body.reqparam;    
        if (!params.vcode || typeof params.vcode === "undefined" || params.vcode == "") return res.json({status: false, msg: "You have wrong url"});
        var vcode = params.vcode.trim();        
    
    dbConnection.query({sql: "SELECT * FROM `voucher_code` WHERE voucher=?"},
    [vcode], function(err, rows, fields) {         
       if (err) {
           res.json({status: true, msg: "The voucher code input is invalid"});
       } else if (rows) {
           if (rows.length > 0) {
               var voucher = rows[0];
                // if (voucher.order_id != parseInt(params.orderId) || voucher.advertiser_id != parseInt(params.advertiserId))
                //     res.json({status: false, msg: "You have wrong voucher code"});
                if (voucher.voucher !== vcode)
                    res.json({status: false, msg: "The voucher code input is invalid"});
                else if (moment(voucher.expirey_date) < moment())
                   res.json({status: false, msg: "Your voucher code is expired"});
                else if (voucher.state)
                   res.json({status: false, msg: "You have used the voucher code already!"});
                else
                   res.json({status: true, vcode: vcode});
           } else {
               //callback(null, item, null);
               res.json({status: false, msg: "The voucher code input is invalid"});
           }
       } else {
           res.json({status: false, msg: "The voucher code input is invalid"});
       }        
    });    
  },
  sendRedeemMail: function(req, res, next) {
    var params = req.body.params;
	//if (typeof params.vcode === "undefined") return res.json({status: false, msg: "You have wrong url"});
    var vcode = params.vcode;
	var aname = params.advertiserName;
	//aname = aname.replace("-", "").trim();
    var ocode = params.outletCode.toLowerCase();    
	async.waterfall([
        function(callback) {
            var sql = "SELECT b.name ad_name, a.ad_email ad_email, c.outlet_code ocode, c.id outletid, a.state vstate, a.first_name sirname, c.name outletname FROM `voucher_code` as a \
                INNER JOIN `advertisers` as b on a.advertiser_id=b.id \
                INNER JOIN `outlets` as c on a.advertiser_id=c.advertiser_id \
                WHERE a.voucher=?";
            dbConnection.query({sql: sql}, [vcode], function(err, rows, fields) {                                         
               if (err) {
                   callback(null, null, {status: true, msg: "The voucher code input is invalid"});
               } else if (rows) {                   
                   if (rows.length > 0) {                      
                       var adname = "";
                       var sirname = "";
                       var outletname = "";
                       var vstate = "";
                       var ad_email = "";
                       var outletid = null;
                       rows.forEach(function(element) {
                           adname = element.ad_name.replace(/\s/g, " ");
                           sirname = element.sirname;
                           vstate = element.vstate;                  
                           ad_email = element.ad_email;         
                           if (ocode == element.ocode.toLowerCase()) {
                               outletname = element.outletname;                        
                               outletid = element.outletid;
                           }
                                
                        
                       });
                       var voucher = {
                           ad_name: adname.replace(/\s/g, " "),
                           ad_email: ad_email,
                           sirname: sirname,
                           outletname: outletname,
                           outletid: outletid
                       };
                       
                    //    if (voucher.ad_name != aname.replace(/\s/g, "")){
                    //     callback(null, null, {status: false, msg: "Advertiser Name is Invalid"});
                    //    } else if (voucher.outletname == "") {
                       if (voucher.outletname == "") {
                            callback(null, null, {status: false, msg: "Outlet Code is Invalid"});
                       } 
					   else if (vstate) {
                            callback(null, null, {status: false, msg: "You have used the voucher code already!"});
                       }
					   else {
                            callback(null, voucher, {status: true, msg: "Thanks for your effort!"});
                       }                           
                   } else {
                       //callback(null, item, null);
                       callback(null, null, {status: false, msg: "You have wrong Information"});
                   }
               } else {
                callback(null, null, {status: false, msg: "You have wrong Information"});
               }        
           });
        },
        function(item, msg, callback) {
            if (!item)
                return callback(null, null, msg);

            var maildata = {
                sirName: item.sirname,
                outletName: item.outletname,
                advertiserName: item.ad_name,
                ad_email: item.ad_email,
                outletid: item.outletid
            };
            
            var sql = "SELECT a.email email, b.service_id servicename, a.service_id serviceid, a.quantity quantity, a.id orderid, a.redeemed, b.item_id FROM `orders` as a \
                INNER JOIN `voucher_code` as b on a.id=b.order_id \
                WHERE b.voucher=?"
            dbConnection.query({sql: sql}, [vcode], function(err, rows, fields) { 
                if (err) {
                    callback(null, null, msg);
                } else if (rows) {
                    if (rows.length > 0) {
                        var outlet = rows[0];
                        maildata.email = outlet.email;
                        maildata.serviceName = outlet.servicename;
                        maildata.orderId = outlet.orderid;
                        maildata.redeemed = outlet.redeemed;
                        maildata.serviceId = outlet.serviceid;
                        maildata.quantity = outlet.quantity;
                        maildata.itemId = outlet.item_id;                        
                        callback(null, maildata, msg);                        
                    } else {
                        //callback(null, item, null);
                        callback(null, null, msg);
                    }
                } else {
                    callback(null, null, msg);
                }        
            });

        },
        function(item, msg, callback) {
            if (!item) return callback(null, false, msg);
            dbConnection.query({sql: "UPDATE voucher_code SET state=1, redeemption_date=?, outlet=? WHERE voucher=?"},
             [moment().format(), item.outletid, vcode], function(err, rows, fields) {
                if(err || rows.length>0) callback(null, false, {status: false, msg: "The voucher code can't redeem"});
                else callback(null, item, msg);
             });
        },
        function(item, msg, callback) {
            if (!item) return callback(null, false, msg);            
            item.redeemed = parseInt(item.redeemed) + 1;
            dbConnection.query({sql: "UPDATE orders SET redemption = ?, redeemed=? WHERE id=?"},
             [moment().format("YYYY-MM-DD"), item.redeemed, item.orderId], function(err, rows, fields) {
                if(err || rows.length>0) callback(null, false, {status: false, msg: "The voucher code can't redeem"});
                else callback(null, item, msg);
             });
        },
        function(item, msg, callback) {
            if (!item) return callback(null, item, msg);
            wpDbConnection.query({sql: "Update f5ATe_postmeta Set meta_value = ? WHERE post_id = ? AND meta_key = 'redeemed_count'"},
            [item.redeemed, item.itemId],
                function (error, results) {
                    if (error) {
                        callback(Error("WP DB Update Query Error!"), null, msg);
                    } else {
                        callback(null, item, msg);
                    }
                }
            );
        },
        function(item, msg, callback) {
            if (!item) return callback(null, item, msg);

            if (item.redeemed == item.quantity) {
                wpDbConnection.query({sql: "INSERT INTO f5ATe_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)"},
                    [item.itemId, 'redeemed_date', moment().format("DD/MM/YYYY")],
                    function (err, post_metas, fields) {
                        if (err) {
                            callback(Error("WP DB Insert Query Error!"), false, msg);
                        } else if (post_metas) {
                            callback(null, item, msg);
                        } else {
                            callback(Error("WP DB Insert Query Error!"), false, msg);
                        }
                    }
                )
            } else {
                callback(null, item, msg);
            }
        },
        function(maildata, msg, callback) {
          dbConnection.query({sql: "SELECT ad.id, outs.email outletsemails FROM `advertisers` as ad left join outlets as outs on outs.advertiser_id = ad.id where ad.name = ? "},
                [maildata.advertiserName],
                function (err, results, fields) {
                    //console.log(mailData.advertiserName,results, advertiser)
                     if (results) {
                        if (results.length > 0) {
                          maildata.ouletsredeem = results
                        }
                    }
                  });
            if (maildata) {
				//console.log(maildata);
				maildata.vcode = vcode;
                mail.sendRedemptionEmail(config.get('mailgun.from'), maildata.email, maildata, function(err, body) {
                    if (err)
                        callback(null, false, msg);
                    else
                        callback(null, maildata, msg);
                });

            } else {
                callback(null, false, msg);
            }
        },    
        function(mailData, msg, callback) {
            if (mailData) {
                var now = moment().format("D MMM YYYY");
                var time = moment().format("h:mm:ss a");
                mailData.now = now;
                mailData.time = time;
                outletsredeem = mailData.ouletsredeem;
                var lcount = 0;
                if(outletsredeem){
                async.eachSeries(outletsredeem, function(outlet, eachOCallback) {
                    async.waterfall([
                        function(callback_1) {
                          //console.log(outlet)
                               
                               mail.sendRedemptionEmailToAd(outlet.outletsemails, mailData, function(err, body) {
                                
                                if (err)
                                     callback(null, mailData,msg);
                                else{
                                  lcount++;
                            
                            if (lcount == outletsredeem.length) callback(null, mailData,msg);
                            else eachOCallback();
                          }
                            });   
                        }
                    ], function(err, result) {
                        if (err) callback(err, {code: "failed"});
                        else {
                            lcount++;
                            
                            if (lcount == outletsredeem.length) callback(null, mailData,msg);
                            else eachOCallback();
                        }
                    })
                });
                       
               
            } else {
                callback(null, mailData,msg);
            }
          }else{
            callback(null, mailData,msg);
          }
        },
        function(item, msg, callback) {
            if (item) {
                var now = moment().format("D MMM YYYY");
                var time = moment().format("h:mm:ss a");
                item.now = now;
                item.time = time;
                mail.sendRedemptionEmailToAd(item.ad_email, item, function(err, body) {
                    if (err)
                        callback(null, msg);
                    else
                        callback(null, msg);
                })
            } else {
                callback(null, msg);
            }
        }
    ],
    function (err, msg) {
        if (!err) {
            req.io.emit('updatingFinance');
            //res.json({status:"success", message: "thank"})
            res.json(msg);
        } else
            res.json({status: false, msg: "Server Internal Error!"});
    });        
  }
}