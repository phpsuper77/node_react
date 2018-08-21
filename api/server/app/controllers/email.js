var path = require('path');
var db = require('../../db');
var qr = require('../../utils/qr');

var DIR = './uploads/';
var connection = db.createConnection();

module.exports = {
  
  me: function(req, res, next) {
    var email = req.body.email;
    var orderId = req.body.orderId;

    if (email && orderId) {
        var mailData = {};
        qr.sendQR(email, orderId, mailData, function(err, result) {
            if (err) {
                res.json({"code": "failed"});
            } else {
                if (result == true) {
                    res.json({"code": "success"});
                }
            }
        });
    } else {
        res.json({"code": "failed"});
    }
  },

  update: function(req, res, next) {
    if (req.query.email && req.query.orderId) {
        var orderId = req.query.orderId;
        connection.query({sql: "Update orders Set redemption = ? WHERE id = ?"},
            [new Date(), orderId],
            function (error, results) {
                if (error) {
                } else {
                    res.sendFile(path.join(__dirname + '/success.html'));
                }
            }
        )
    }
  }

}