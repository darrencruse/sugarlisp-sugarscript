'use strict';

var _http = require('http');

var server = (0, _http.createServer)(function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end("Hello World!\n");
}); //#transpile { toa: 'core', tob: 'tokens' }

server.listen(3000, "127.0.0.1");
console.log("Server running at http://127.0.0.1:3000/");
