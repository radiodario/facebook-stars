var graph = require('fbgraph');
var fs = require('fs');
var request = require('request');
var async = require('async');

graph.setAccessToken(process.env.FACEBOOK_API_TOKEN);

var eventId = '332602316935634'

var invited = async.queue(function(item, next) {
  getPicture(item, next);
});

invited.drain = function() { console.log('done')};



graph.get(eventId+'/invited', {limit: 1000}, function(err, res) {

  console.log("got", res.data.length, "users");

  fs.writeFileSync('invited.json', JSON.stringify({users: res.data}));


  invited.push(res.data);

});


function getPicture(user, next) {
  console.log("processing", user.name);
  graph.get(user.id+'/picture', {height:327}, function(err, res) {
    download(res.location, 'images/' + user.id + '.jpg', function() {
      next();
    })
  })
}


function download(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

// download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
//   console.log('done');
// });