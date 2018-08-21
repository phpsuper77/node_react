var express = require('express');
var bodyParser = require('body-parser');
var config = require('config');
var app = express();
var multer = require('multer');
var morgan = require('morgan');
var passport = require("passport");
var db = require('./server/db');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var WooCommerceAPI = require('woocommerce-api');
var WPAPI = require('wpapi');
var path = require('path');
var cors = require('cors');
var ejs = require('ejs');
var http = require('http');
var socketIO = require('socket.io');
var htmlEncode = require('js-htmlencode');
var cron = require('node-cron');

const server = http.createServer(app);
const io = socketIO(server);
var Promo = require('./routes/promo');

app.use(cors({origin: '*'}));

var wordpress = new WPAPI({
    endpoint: config.get('url') + 'wp-json',
    username: config.get('wp.user'),
    password: config.get('wp.password')
});

var WooCommerce = new WooCommerceAPI({
    url: config.get('url'),
    consumerKey: config.get('woo.key'),
    consumerSecret: config.get('woo.secret'),
    wpAPI: true,
    version: 'wc/v2',
    queryStringAuth: true
});

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./Images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: Storage
});
//.array("files", 3);

app.use(morgan('dev'));
app.use(bodyParser.json({limit: '100MB'}));
app.use(bodyParser.urlencoded({limit: '100MB', extended: true}));

app.use(function (req, res, next) {
    req.io = io;
    if (req.method === 'OPTIONS') {
        var headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400';
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    } else {
        var allowedOrigins = ['https://sf-api.dailyavnity.sg','http://127.0.0.1:8055', 'http://localhost:8055', 'http://sfadmin.novalymedia.com', 'https://sfadmin.novalymedia.com'];
        var origin = req.headers.origin;
        if (allowedOrigins.indexOf(origin) > -1) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', true);
        return next();
    }    
    res.setHeader('Authorization', 'Basic '.base64_encode(config.get('wp.user') + ':' + config.get('wp.password')));
});

cron.schedule("59 * * * *", function() {
    console.log('tick is occured');
    Promo.expired(db.createConnection(), WooCommerce);
});

//socket configuration
io.on("connection", socket => {
    socket.on("disconnect", () => console.log("Client disconnected"));
});

io.set('heartbeat timeout', 24*60*60); 
io.set('heartbeat interval', 20000);

app.use(cookieParser('_x9Bur_fH9221'));
app.use(cookieSession({
    key: 'dv.sg',
    secret: '_x9Bur_fH9221',
    cookie: {domain: '.dailyvanity.sg', maxAge: 365 * 24 * 60 * 60 * 1000}
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('Images'));
app.use('/uploads', express.static(__dirname + './uploads'));

var port = process.env.PORT || 8055; // set our port
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var router = require("./routes")(
    app, passport, db, WooCommerce, wordpress,
    config.get('domain'), config.get('url'), upload, io
);

app.use('/api/v1', router);
// Service static assets
app.use(express.static(path.join(__dirname, '/Images')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/server/views'));

app.get('/', function (req, res) {
    var str = "hellow & world & this is sample"
    str = htmlEncode.htmlEncode(str);
    res.send(str);
});

app.get('/*', function(req, res, next){ 
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    next(); 
});

app.disable('etag');


server.listen(port);
var schedule = require('node-schedule');
var axios = require('axios');

var j = schedule.scheduleJob('0 12 * * *', function() {
    axios.get(config.get('domain') + '/api/v1/order_remind')
    .then(function (response) {
        console.log(response.data);
    }).catch(function (error) {
        console.log(error);
    });
});

console.log('API Server running on port ' + port);