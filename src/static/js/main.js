(function(){

  var output = document.getElementById('test'),
    video = document.getElementById('vid'),
    imgOutput = document.getElementById('imgOutput'),
    canvas = document.getElementById('canvas');

  var isStreaming = false;
  var width = 320, height = 0;
  var lastAnim;

  var bbs = [];

  var ws;

  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function(err) {
      console.error('An error occurred: ' + err);
    });


  video.addEventListener('canplay', function(ev){
    if(!isStreaming) {
      height = video.videoHeight / (video.videoWidth/width);

      video.setAttribute('width', width);
      video.setAttribute('height', height);

      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);

      isStreaming = true;
    }
  }, false);


  function sendPicture() {
    var context = canvas.getContext('2d');
    if(width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      var data = canvas.toDataURL('image/png', 0.6);

      drawBoundingBox(context);

      console.log('sending data');

      var payload = {
        'type': 'image',
        'content': data
      };

      ws.send(JSON.stringify(payload));
    }
  }


  function drawBoundingBox(context)
  {
    var dims = bbs.pop();
    if(dims)
    {
      context.rect(dims.left, dims.top, dims.width, dims.height);
      context.stroke();
    }
  }

  var host = window.location.host;
  console.log(host);
  //createSocket("ws://" + host +  "/ws", "Local");

  ws = new WebSocket('ws://' + host + '/ws');

  ws.onopen = function() {
    output.innerHTML = 'Connection open';
  };

  ws.onmessage = function(ev) {
    var data = JSON.parse(ev.data);
    output.innerHTML = 'received message';
    console.log(data);

    var type = data.type;

    switch(type)
    {
      case 'bounding_box':
        bbs.push(data.dims);
        break;

      default:
        break;
    }

  };

  ws.onclose = function(ev) {
    output.innerHTML = 'connection closed';
  };

  ws.onerror = function(ev) {
    output.innerHTML = 'error occurred';
    console.error(ev);
  };


  setInterval(sendPicture, 100);

}());