var _globals = require('./_globals.js');

var http = require('http');
const PORT=_globals.app_port; 

//handle requests
function handleRequest(request, response){
    response.end('https://github.com/login/oauth/authorize?client_id='+_globals.client_id+"&scope=repo");
    //console.log(request);
}

//Create a server
var server = http.createServer(handleRequest);

//Start the server
server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});

var request = require('request');

request.post(
    'https://github.com/login/oauth/access_token',
    { json: { code: '', client_id:_globals.client_id , client_secret:_globals.client_secret} },
    function (error, response, body) {
        console.log(response);
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);