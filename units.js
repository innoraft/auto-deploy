var _globals = require('./_globals.js');

////Demo server setup unit
////Require/import the HTTP module
//var http = require('http');
//
////Define a port we want to listen to
//const PORT=_globals.app_port; 
//
////handle requests
//function handleRequest(request, response){
//    response.end('It Works!! Path Hit: ' + request.url);
//    console.log(request);
//}
//
////Create a server
//var server = http.createServer(handleRequest);
//
////Start the server
//server.listen(PORT, function(){
//    //Callback triggered when server is successfully listening. Hurray!
//    console.log("Server listening on: http://localhost:%s", PORT);
//});


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
    token: _globals.token
});

//github.authenticate({
//    type: "oauth",
//    key: _globals.client_id,
//    secret: _globals.client_secret
//})

github.repos.createHook({ 
//    user: "",
//    repo :"",
    name : "web",
    config	: {
        url : _globals.webhook_callback_url
    }
}, function(err,res){
    console.log(JSON.stringify(res));
});
