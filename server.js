//provides HTTP server and functionality
let http = require('http'); 

//provides filesystem path -related functionality
let fs = require('fs');

let path = require('path');

//provides ability to derive a MIME type based on a filename extension
let mime = require('mime');

//contents of cached files are stored
let cache = {};

//Socket.IO-based server-side chat functionality
let chatServer = require('./lib/chat_server');



function send404(response){
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}

function sendFile(response, filePath, fileContents){
    response.writeHead(
        200,
        {"content-type": mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

//serving static files
function serveStatic(response, cache, absPath){
    //check if file is cached in memory
    if(cache[absPath]){
        //serve file from memory
        sendFile(response, absPath, cache[absPath]);
    }else{
        //check if file exists
        if(fs.existsSync(absPath)){
            //read file from disk
            fs.readFile(absPath, function(err, data){
                if(err){
                    send404(response);
                }else{
                    cache[absPath] = data;
                    //serve file read from disk
                    sendFile(response, absPath, data);
                }
            });
        }else{
            //send HTTP 404 response
            send404(response);
        }
    }
}

//creating the HTTP server
let server = http.createServer(function(request, response){
    let filePath = false;

    if(request.url == '/'){
        console.log('got request here')
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + request.url;
    }

    let absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

//starting the HTTP server
server.listen(3000, function(){
    console.log("Server listening on port 3000.");
});

chatServer.listen(server);