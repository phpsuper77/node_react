var config = require('config');
var mailgun = require('mailgun-js')({apiKey: config.get('mailgun.api_key'), domain: config.get('mailgun.domain')});
var ejs = require('ejs');
var htmlEncode = require('js-htmlencode');

module.exports = {
    sendQrEmail: sendQrEmail,
    sendRedemptionEmail: sendRedemptionEmail,
    sendEmailToAd: sendEmailToAd,
    sendRedemptionEmailToAd: sendRedemptionEmailToAd,
    sendCancellationEmailToAd: sendCancellationEmailToAd,
    sendCancellationEmailToUser: sendCancellationEmailToUser,
    sendRemainderEmailtoAdv: sendRemainderEmailtoAdv
};

function sendQrEmail(from, to, mailData, callback) {
    var advertiserName = mailData.advertiserName.split("-").join(" ");
    advertiserName = mailData.advertiserName.split("&").join(" ");
    advertiserName = advertiserName.split(" ").map(function(i){return i[0].toUpperCase() + i.substring(1)}).join(" ")
    var serviceName = mailData.serviceName.split(" ").map(function(i){return i[0].toUpperCase() + i.substring(1)}).join(" ");
    var subject = 'Your purchase confirmation and voucher for ' + advertiserName + ', ' + serviceName + ' - ' + mailData.vcode;
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName)    ;
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName)    ;
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName)    ;
    
    var text = "Order Info from Daily Vanity Singapore";
    //subject = htmlEncode.htmlEncode(subject);
    //var hrefpath = config.get('public_url') + 'voucher?' + mailData.orderId + ';;' + mailData.advertiserId;
    var hrefpath = config.get('public_url') + 'voucher';
    console.log(hrefpath);
    ejs.renderFile("./server/views/voucher.ejs", {mailData: mailData, hrefpath: hrefpath}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), html);
        } else {
            console.log(to);
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });            
        }
    });   
}

function sendRedemptionEmail(from, to, mailData, callback) {    
    var subject = mailData.serviceName + ' redeemed at ' + mailData.advertiserName + ',' + mailData.outletName + ' - ' + mailData.vcode;
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName);
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName);
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName);
    
    var text = "Voucher redeemed";
    //console.log(mailData);
    ejs.renderFile("./server/views/redeem.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), html);
        } else {
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}

function sendRedemptionEmailToAd(to, mailData, callback) {
    var subject = 'Voucher ' + mailData.vcode + ' redeemed at ' + mailData.outletName;
    var text = "Voucher redeemed";
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName)    ;
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName)    ;
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName)    ;
    ejs.renderFile("./server/views/adredeem.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), html);
        } else {
            console.log(to);
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}

function sendEmailToAd(to, mailData, callback) {
    var subject = 'NEW PURCHASE: ' + mailData.serviceName + ' ';
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName)    ;
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName)    ;
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName)    ;
    var text = "Order Info from Daily Vanity Singapore";     
    ejs.renderFile("./server/views/mailtoad.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), null);
        } else {
            console.log(to);
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}

function sendCancellationEmailToAd(to, mailData, callback) {
    var subject = 'CANCELLED: ' +  mailData.customer +' has cancelled purchased made on ' + mailData.purchaseDate;
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName)    ;
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName)    ;
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName)    ;
    var text = "Order Info from Daily Vanity Singapore";     
    ejs.renderFile("./server/views/cancellation-adv.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), null);
        } else {
            console.log(to);
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}

function sendCancellationEmailToUser(to, mailData, callback) {
    var subject = 'Voucher '+ mailData.vcode +' has been cancelled as per request';
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName)    ;
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName)    ;
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName)    ;
    var text = "Order Info from Daily Vanity Singapore";     
    ejs.renderFile("./server/views/cancellation-user.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), null);
        } else {
            console.log(to);
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}

function sendRemainderEmailtoAdv(to, mailData, callback) {
    var subject = " REMINDER - Your promotion has ended";
    subject = htmlEncode.htmlDecode(subject);
    mailData.serviceName = htmlEncode.htmlDecode(mailData.serviceName);
    mailData.advertiserName = htmlEncode.htmlDecode(mailData.advertiserName);
    mailData.outletName = htmlEncode.htmlEncode(mailData.outletName);
    var text = "Remainder for promotion from Daily Vanity Singapore";     
    ejs.renderFile("./server/views/promoremainder.ejs", {mailData: mailData}, function(err, html) {
        if (err) {
            callback(Error("Invalid mail template"), null);
        } else {
            var data = {
                from: config.get('mailgun.emailAddress'),
                bcc: config.get('mailgun.bcc'),
                to: to,
                subject: subject,
                text: text,
                html: html,
                'h:Reply-To' : 'gowtham@dailyvanity.sg',
            };
        
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    callback(error, body);
                } else {
                    callback(null, body);
                }
            });
        }
    });   
}   