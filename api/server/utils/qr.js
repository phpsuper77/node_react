var config = require('config');
var QRCode = require('qrcode');
var fs = require('fs');
var mail = require('../app/services/mail');
var db = require('../db');
var dbConnection = db.createConnection();
module.exports = {
  
    sendQR: function(email, orderId, mailData, callback) {
        var imageName = "order_qr_" + orderId + "_" + mailData.vcode + ".png";
        var path = "./uploads/" + imageName;
        
        var opts = {
            color: {
                dark: '#000',
                light: '#FFF'
            }
        };

        var hrefpath = config.get('public_url') + 'voucher?' + mailData.orderId + ';;' + mailData.advertiserId + ';;' + mailData.vcode;         
        console.log(hrefpath);
        if (!fs.existsSync(path)) {
            fs.writeFile(path, '', function(err) {
                QRCode.toFile(path, hrefpath,
                    opts, function (err) {
                    if (err) { 
                        callback(err, false);
                    } else {
                        mailData.url = config.get('upload_url') + imageName;
                        mail.sendQrEmail(config.get('mailgun.from'), email, mailData, function(err, result) {
                            if (err) {
                                callback(err, result);
                            } else {
                                callback(null, true);
                            }
                        });
                    }
                });
            });
        } else {            
            QRCode.toFile(path, hrefpath,
                opts, function (err) {
                if (err) {
                    callback(err, false);
                } else {
                    mailData.url = config.get('upload_url') + imageName;
                    mail.sendQrEmail(config.get('mailgun.from'), email, mailData, function(err, result) {
                        if (err) {
                            callback(err, result);
                        } else {
                            callback(null, true);
                        }
                    });
                }
            });
        }
    }

}
