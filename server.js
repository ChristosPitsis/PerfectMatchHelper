var logging = require('./logging.js');
const fs = require('fs');
const libxml = require("libxmljs");
const Validator = require('jsonschema').Validator;
const v = new Validator();
var express = require('express');
var builder = require('xmlbuilder');
var bodyParser = require('body-parser');
var xmlparser = require('express-xml-bodyparser');
xmlparser.regexp = /^text|application\/xml$/i;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();
var parser = require('xml2json');

var app = express();

app.use(bodyParser.json());

app.use(xmlparser());

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    // Pass to next layer of middleware
    next();
});

app.get('/', function (req, res) {
    res.send('Helloo! This is a helper ws');
})

app.get('/Numberizer', function (req, res) {

    try {
        var name = req.query.name;

        if (typeof name == 'undefined' || name.length == 0) {
            throw ("Name not passed...");
        }

        name = name.trim();
        console.log("Checking number for name " + name);
        var num = 0;

        for (var i = 0; i < name.length; i++) { 
            var letter = name.charAt(i);
            // Change the first letter to upper case
            if (i == 0) {
                letter = letter.toUpperCase();
            } else {
                letter = letter.toLowerCase();
            }
            num += letter.charCodeAt(0);
        }
    
        var response = {
            name: name,
            num: num
        };
    } catch (ex) {
        var response = {
            status: 'error',
            debugMessage: ex
        };
        console.log("An error occurred " + ex);
        res.end(JSON.stringify(response));
    }
    
    console.log("Name: " + name + "\nNumber: " + num);
    console.log(JSON.stringify(response));
    res.header('Content-Type', "application/json");
    res.end(JSON.stringify(response));
})

app.post('/NumMatcher', function (req, res) {
    console.log("Got a POST request for the homepage");

    // Gia na dw to request type
    var requestType = req.get('Content-Type');
    console.log("Content-Type: " + requestType);

    // Parse Body
    var req_params = "";
    switch (requestType) {
        case "application/json":
            // Gia to JSON
            var req_body = req.body;
            console.log("Request Body: " + req_body);
            // Validate JSON
            var jsonschema = JSON.parse(fs.readFileSync(__dirname + '/NumMatcher.json', 'utf8'));

            if (v.validate(req_body, jsonschema).valid)
                console.log("Valid!");
            else
                throw ("JSON invalid...");

            console.log("Request: " + req.body.reqNumMatcher);
            req_params = req.body.reqNumMatcher;
            break; 
        case "application/xml":
        case "text/xml":
            // Gia to XML
            var req_body = req.rawBody;
            console.log("Request Body: \n" + req_body);
            // Validate XML
            var xsd = fs.readFileSync(__dirname + '/NumMatcher.xsd', 'utf8');
            var xsdDoc = libxml.parseXml(xsd);
            var xmlDocValid = libxml.parseXml(req_body);
            
            if (xmlDocValid.validate(xsdDoc))
                console.log("Valid!");
            else
                throw ("XML invalid...");

            req_params = req.body.reqnummatcher;
            break;
        default: 
            throw ("Content-Type not supported...");
    }

    // Print parameters passed
    var name = req_params.name;
    var num = req_params.num;
    console.log("Dirname: " + __dirname);
    console.log("Name: " + name);
    console.log("Number: " + num);

    

    var female = "";
    if (num < 800)
        female = "Maria";
    else if (num < 1200)
        female = "Elena";
    else if (num < 1600)
        female = "Marina";
    else
        female = "Nancy";

    console.log("Female: " + female);

    var service_name = 'QivosHelper';
    var resp_name = 'respNumMatcher';

    var response = builder.create(resp_name);

    response.ele('male', {}, name);
    response.ele('number', {}, num);
    response.ele('female', {}, female);

    response = response.end({ pretty: true });

    console.log("XML Response: " + response);
    

    // Create the response
    res.header('Content-Type', requestType);
    if (requestType == "application/json") {
        response = parser.toJson(response);
        console.log("JSON Response: " + JSON.stringify(response));
    }
    console.log("Response: " + response);
    res.send(response);
})

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
