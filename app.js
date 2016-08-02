var express = require('express');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var fs = require('fs');

var _globals = require('./_globals.js');

var accessLogStream = fs.createWriteStream(_globals.dirname_log + _globals.filename_log, {flags: 'a'}); 
// setup the logger 
app.use(morgan('combined', {stream: accessLogStream}));

if (_globals.env === 'development')
{
    app.use(morgan('dev'));
    mongoose.set('debug', true);
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// prepare server
app.use('/assets', express.static('./assets/'));

mongoose.connect('mongodb://localhost/'+_globals.dbname);
Users = require('./models/users');
Pulls = require('./models/pulls');
Hooks = require('./models/hooks');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
   res.render('detailgather');
});

var _username = "";
app.get('/forwardtoauth', function (req, res) {
    _username = req.query.username;
    User = Users;
    User.findUser(_username, function(done){
        if(done.status)
        {
            var token = done.token;
            createGithubObject(token);
            res.redirect(/chooserepo/);
        }
        else
        {
            User.newUser(_username, function(done) {
                if(!done.status){
                    res.send("Please retry");
                }
                else{
                    res.redirect("https://github.com/login/oauth/authorize?client_id=" + _globals.client_id + "&scope=repo&redirect_uri=" + _globals.webhook_callback_url+':'+_globals.app_port + "/gettoken");
                }
            });
        }
    })
});

app.get('/gettoken', function (req, res) {
var request = require('request');
    request.post(
        'https://github.com/login/oauth/access_token',
        { json: { code: req.query.code, client_id:_globals.client_id , client_secret:_globals.client_secret} },
        function (error, response, body) {
            //console.log(response);
            if (!error && response.statusCode == 200) {
                console.log(body)
                if(body.scope == 'repo') {
                    var token = body.access_token;
                    User = Users;
                    User.addTokenToUser(_username, token, function(done){
                        console.log("saved token :",done.status);
                    })
                    createGithubObject(token);
                    res.redirect(/chooserepo/);
                }
                else {
                     res.send("Did you mess with the request?");
                }
            }
        }
    );
});

var _github = "";
var createGithubObject = function(token){
    var GitHubApi = require("github");

        _github = new GitHubApi({
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

    _github.authenticate({
        type: "oauth",
        token: token
    });
}

app.get('/chooserepo', function (req, res) {
    if(_github != "")
    {
        getRepos(_github, 1, [], function(repolist){
            res.render('hookform',{repolist:repolist});
        });
    }
    else
    {
        res.send("No Direct access");
    }
});

app.get('/choosebranch/:reponame/:owner', function(req, res){
    //res.send(req.params.reponame);
    getBranches(_github, req.params.reponame, req.params.owner , 1, [], function(branchlist){
        res.send(branchlist);
    });
});

app.post('/addwebhook', function(req, res){
    console.log(req.body);
    var owner = req.body.owner,
        reponame = req.body.reponame,
        branch = req.body.branch,
        serverip = req.body.serverip,
        serveruser = req.body.serveruser,
        serverpass = req.body.serverpass,
        serverpath = req.body.serverpath,
        command = req.body.command;
        _github = _github;
    
    Hook = Hooks;
    Pull = Pulls;
    Hook.getHook(owner, reponame, function(done){
        if(done.status && done.data)
        {
            var hookid = done.data.hookid;
            Pull.getPull(hookid, branch, function(done){
                if(!done.status || (done.serverip != serverip || done.serveruser != serveruser || done.serverpass != serverpass || done.serverpath != serverpath || done.command != command )) //Check if there is no exact same pull already in db
                {
                  res.send(addNewPull(hookid, branch,serverip,serveruser,serverpass,serverpath,command));  
                }
                else
                {
                    res.send("Exact same pull already exists. I wonder why would you wanna make it again.");
                }
           });
        }
        else
        {
            createHookonRepo(owner, reponame, branch, _github , function(resl){
                var hookid = resl.id;
                Hook.newHook(hookid, owner, reponame, function(done){
                    if(done.status)
                    {
                        res.send(addNewPull(hookid, branch,serverip,serveruser,serverpass,serverpath,command)); 
                    }
                    else
                    {
                        deleteHookId(owner, reponame, hookid , _github, function(result){
                            res.send("Opps try again.")
                        });
                    }
                });
            });
        }
    });
});

function addNewPull(hookid, branch,serverip,serveruser,serverpass,serverpath,command){
    Pull = Pulls;
    Pull.newPull(hookid, branch,serverip,serveruser,serverpass,serverpath,command, function(done){
        if(done.status)
            return(done.data);
        else
        {
            deleteHookId(owner, reponame, hookid , _github, function(result){
                return("Opps try again.")
            });
        }
    }); 
}

app.post('/pullrepo/:user/:reponame', function(req, res){
    res.send("Hey Mate!");
    var repo =  req.params.reponame,
        branch = (JSON.parse(req.body.payload)).ref,
        user = req.params.user;
    branch=branch.split('/');
    branch=branch[2];
    Hook = Hooks;
    Hook.getHook(user, repo, function(done){
        if(done.status && done.data)
        {
            hookid = done.data,
            Pull = Pulls;
            Pull.getPull( hookid, branch, function(done){
                if(!done.status && !done.data){
                    console.log("Repo and branch not foundin DB.", repo, branch);
                }
                else
                {
                    var SSH = require('simple-ssh');

                    var ssh = new SSH({
                        host: done.data.serverip,
                        user: done.data.serveruser,
                        pass: done.data.serverpass
                    });

                    ssh.exec("cd "+done.data.serverpath+" && "+done.data.command, {
                        out: function(stdout) {
                            console.log(stdout);
                        },
                        err: function(stderr) {
                            console.log(stderr); // this-does-not-exist: command not found 
                        }
                    }).start();
                }
            });
        }
    });
});

function getRepos(github, page, repolist, callback){    
    github.repos.getAll({per_page:100, page:page}, function (err, resl){
        //console.log(JSON.stringify("one fetch = ",resl));
        packRepos(resl);
        if (github.hasNextPage(resl)) {
            getRepos(github, ++page, repolist, callback);
        }
        else
            packRepos(null);
        function packRepos(resl)
        {
            if(resl == null) {
                console.log(JSON.stringify(repolist));
                callback(repolist);
            }
            else
            {
                resl.forEach(function (v,i) {
                  repolist.push({name: v.name, owner: v.owner.login, fullname:v.full_name});
                });
            }
        }
    });
}

function getBranches(github, repo, user, page, branchlist, callback){    
    github.repos.getBranches({user: user, repo:repo, per_page:100, page:page}, function (err, resl){
        //console.log(JSON.stringify(resl));
        packBranches(resl);
        if (github.hasNextPage(resl)) {
            getBranches(github, repo, user, ++page, branchlist, callback);
        }
        else
            packBranches(null);
        function packBranches(resl)
        {
            if(resl == null) {
                console.log(JSON.stringify(branchlist));
                callback(branchlist);
            }
            else
            {
                resl.forEach(function (v,i) {
                  branchlist.push({name: v.name});
                });
            }
        }
    });
}

function createHookonRepo(username, reponame, branch , github, callback){
    github.repos.createHook({ 
        user: username,
        repo :reponame,
        name : "web",
        config	: {
            url : _globals.webhook_callback_url+":"+_globals.app_port+'/pullrepo/'+username+'/'+reponame
        }
    }, function(err,resl){
        console.log(JSON.stringify(resl));
        callback(resl);
    });
}

function deleteHookId(username, reponame, id , github, callback){
    github.repos.deleteHook({
        user: username,
        repo :reponame,
        id : id,
    }, function(err,resl){
        console.log(JSON.stringify(resl));
        callback(resl);
    });
}

http.listen(_globals.app_port, function () {
    console.log('listening on *:'+_globals.app_port);
});
