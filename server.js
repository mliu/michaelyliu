var express = require('express'),
  app = express();

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
  res.render('index.html');
});

console.log('Server running on port 8080');
app.listen(8080);
