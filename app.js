var app = require('express')();
var http = require('http').Server(app);

var _globals = require('./_globals.js');

app.get('/', function (req, res) {
    this.body = "<a href='https://github.com/login/oauth/authorize?client_id=" + _globals.client_id + "&scope=repo&redirect_uri=" + _globals.webhook_callback_url + "/chooserepo'>link</a>";
});

app.get('/chooserepo', function (req, res) {
    var request = require('request');
    request.post(
        'https://github.com/login/oauth/access_token',
        { json: { code: this.request.query.code, client_id:_globals.client_id , client_secret:_globals.client_secret} },
        function (error, response, body) {
            console.log(response);
            if (!error && response.statusCode == 200) {
                console.log(body)
                if(body.scope == 'repo') {
                    var token = body.access_token;
                    var token = "111";
                    //console.log(token);
                    getReposByToken(token, function(repolist){
                        //console.log(JSON.stringify(repolist));
                        res.send(repolist);
                    });
                }
                else {
                    this.body = "Did you mess with the request?";
                }
            }
        }
    );
});

app.get('/addwebhook/:reponame', function(req, res){
    res.send(req.params.reponame);
});

function getReposByToken(token, callback){
    var GitHubApi = require("github");

    var github = new GitHubApi({
        // optional
        debug: true,
        protocol: "https",
        host: "api.github.com", // should be api.github.com for GitHub
        pathPrefix: "", // for some GHEs; none for GitHub
        timeout: 5000,
        headers: {
            "user-agent": "auto-deploy" // GitHub is happy with a unique user agent
        },
        followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
    });

    github.authenticate({
        type: "oauth",
        token: token
    });
    
    github.repos.getAll({}, function (err, res){
        //console.log(JSON.stringify(res));
        var repolist={};
        res.forEach(function (v,i) {
          repolist[i]=v.name;
          if(i==res.length-1) {
              callback(repolist);
          }
        });
    });
}

function createHookonRepo(reponame, callback){
    var GitHubApi = require("github");

    var github = new GitHubApi({
        // optional
        debug: true,
        protocol: "https",
        host: "api.github.com", // should be api.github.com for GitHub
        pathPrefix: "", // for some GHEs; none for GitHub
        timeout: 5000,
        headers: {
            "user-agent": "auto-deploy" // GitHub is happy with a unique user agent
        },
        followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
    });

    github.authenticate({
        type: "oauth",
        token: token
    });

    github.repos.createHook({ 
    //    user: "",
        repo :reponame,
        name : "web",
        config	: {
            url : _globals.webhook_callback_url
        }
    }, function(err,res){
        console.log(JSON.stringify(res));
    });
}

http.listen(_globals.app_port, function () {
    console.log('listening on *:'+_globals.app_port);
});