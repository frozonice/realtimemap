function initialize() {
  var coords = !{JSON.stringify(latlon)};
  var splitCoords = coords.split(",");
  var lat = parseFloat(splitCoords[0]);
  var lng = parseFloat(splitCoords[1]);


  var count = 0;
  var mapOptions = {
    center: new google.maps.LatLng(lat, lng),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map"),
    mapOptions);

  Pusher.log = function(message) {
    if (window.console && window.console.log) window.console.log(message);
  };

  // Flash fallback logging - don't include this in production
  WEB_SOCKET_DEBUG = false;
  var pusher = new Pusher('fe8078e2b4e8602b039e');
  var channel = pusher.subscribe('map');

  // Wait for a new user then drop them on the map
  channel.bind('new_user', function(data) {

    var image = new google.maps.MarkerImage('http://www.gravatar.com/avatar/'+data.email+'?s=40',
      new google.maps.Size(80, 80),
      new google.maps.Point(0,0),
      new google.maps.Point(18, 42));

    var myMarkerOpts = {
      position: new google.maps.LatLng(data.lat, data.lng),
      map: map,
      icon: image,
      animation: google.maps.Animation.DROP
    };

    var marker = new google.maps.Marker(myMarkerOpts);
    map.panTo(marker.getPosition());

    count++;

    if ($("#info").is(":visible")) {
      $("#counter").html(count);
    } else {
      $("#info").fadeIn("slow");
      $("#counter").html(count);
    }


  });
};