var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');

var _globals = require('./_globals.js');

mongoose.connect('mongodb://localhost/'+_globals.dbname);
Users = require('./models/users');
Pulls = require('./models/pulls');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
   res.render('detailgather');
});
app.get('/forwardtoauth', function (req, res) {
    User = Users;
    User.newUser(req.query.username, function(done) {
        if(!done.status){
            res.send("Please retry");
        }
        else{
            res.redirect("https://github.com/login/oauth/authorize?client_id=" + _globals.client_id + "&scope=repo&redirect_uri=" + _globals.webhook_callback_url + "/chooserepo");
            //res.send("<a href='https://github.com/login/oauth/authorize?client_id=" + _globals.client_id + "&scope=repo&redirect_uri=" + _globals.webhook_callback_url + "/chooserepo'>link</a>");
        }
    });
});

app.get('/chooserepo', function (req, res) {
    var request = require('request');
    request.post(
        'https://github.com/login/oauth/access_token',
        { json: { code: req.query.code, client_id:_globals.client_id , client_secret:_globals.client_secret} },
        function (error, response, body) {
            console.log(response);
            if (!error && response.statusCode == 200) {
                console.log(body)
                if(body.scope == 'repo') {
                    var token = body.access_token;
                    //console.log(token);
                    getReposByToken(token, function(repolist){
                        console.log(JSON.stringify(repolist));
                        res.render('repolist',{repolist:repolist, token:token});
                    });
                }
                else {
                     res.send("Did you mess with the request?");
                }
            }
        }
    );
});

app.get('/addwebhook/:reponame/:owner/:token', function(req, res){
    //res.send(req.params.reponame);
    createHookonRepo(req.params.reponame, req.params.owner ,req.params.token , function(resl){
       res.send(res); 
    });
});

app.get('/pullrepo/:reponame', function(req, res){
    //to the server of reponame and pull it
    //SSH unit
    //var SSH = require('simple-ssh');
    // 
    //var ssh = new SSH({
    //    host: _globals.ssh_host,
    //    user: _globals.ssh_user,
    //    pass: _globals.ssh_pass
    //});
    // 
    //ssh.exec('pwd', {
    //    out: function(stdout) {
    //        console.log(stdout);
    //    },
    //    err: function(stderr) {
    //        console.log(stderr); // this-does-not-exist: command not found 
    //    }
    //}).start();
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
    
    github.repos.getAll({}, function (err, resl){
        //console.log(JSON.stringify(resl));
        var repolist=[];
        resl.forEach(function (v,i) {
          repolist.push({name: v.name, owner: v.owner.login, fullname:v.full_name});
          if(i==resl.length-1) {
              callback(repolist);
          }
        });
    });
}

function createHookonRepo(reponame, username, token, callback){
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
        user: username,
        repo :reponame,
        name : "web",
        config	: {
            url : _globals.webhook_callback_url+'/pullrepo/'+reponame
        }
    }, function(err,resl){
        console.log(JSON.stringify(resl));
        callback(resl);
    });
}

http.listen(_globals.app_port, function () {
    console.log('listening on *:'+_globals.app_port);
});
