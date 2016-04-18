// Generated by SugarLisp v0.6.6
import;
createServer;
from;
"http";

var server = createServer(function(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  return response.end("Hello World!\n");
});
server.listen(3000, "127.0.0.1");
console.log("Server running at http://127.0.0.1:3000/");