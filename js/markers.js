// Map Marker functions

// Custom marker
var svgMarker = {
    path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "blue",
    fillOpacity: 1,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
};

// GMU coordinates. If user does not allow geolocation, the map will hover over these coordinates.
var gmu = {lat: 38.829916684266365, lng: -77.30766697263083};
//var mostRecentPosition = gmu;
var length; 
var userId = null;
var map;
var userLocationMarker = null;
var markerSelected = null;
var markerInfoWindow = null; //currently selected marker info window
var checkedIn = false;


/* Checks if user is still signed in and assigns users id to userId variable. */
function getUserId(){
	
    return new Promise((resolve,reject)=>{
        //here our function should be implemented 
		console.log("Checking if user is still signed in ...")
		setTimeout(
			auth.onAuthStateChanged( (user) => {
			  if (user) {
				// User is signed in, sets userId variable to current user's id.
				userId = user.uid;
				console.log("User is signed in.");
				resolve(true);
			  } else {
				// User is signed out, redirected back to home page.
				console.log("User is not signed in, redirecting back to home page.");
				reject(false);
				window.location.href = 'index.html';
			  }
		}), 5000);
    });

}

isUserCheckedIn();

//console.log("isUserCheckedIn() returned: " + checkedIn);


/* Initializes basemap using users geolocation */
function initMap(){
    map = new google.maps.Map(document.getElementById("gmu-map"), {
    center: gmu,
    zoom: 16,
    });
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            };
            var googleMapsLink = "https://www.google.com/maps/search/?api=1&query=" + pos.lat + "," + pos.lng;
            var title = "<div style='color:black; height:60px;width:200px'><b>Your location:</b><br>Latitude: " + pos.lat + "<br/>Longitude: " + pos.lng + "<br><a target='_blank' href="+googleMapsLink+">View on Google Maps</a><br/</div>";
            userLocationMarker = createMarker(pos, title, "blue");
            map.setCenter(pos);
            }, () => {
                handleLocationError(true, userLocationMarker, map.getCenter());
            });
			/* If user is not selecting anything else on the map that is not a marker, markerSelected will be set to null (so geolocation will be used instead for checking in)*/
			google.maps.event.addListener(map, "click", function (e) {
				if(markerSelected != null){
					markerSelected = null;
					markerInfoWindow.close();
					console.log("Current selection: " + markerSelected)
				}
			});
			
			/*BUG: Not working for some reason. Not necessary at the moment but would be cool to have. 
			When marker is clicked, creates a popup window indicating that it is the currently
			selected marker and updates markerSelected variable with new location 
			google.maps.event.addListener(userLocationMarker, "click", function (e) {
				if(markerInfoWindow == null){
					markerInfoWindow = new google.maps.InfoWindow();
					markerInfoWindow.setContent("<div style='color:black; height:60px;width:200px'><b>This is your current location!</b></div>");
					markerInfoWindow.open(map, userLocationMarker);
					markerSelected = userLocationMarker.position;
					console.log("You are here!")
				}
			});
			*/
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, map.getCenter());
    }
}

// Creates new marker with given position and color choice for the marker
function createMarker(pos, title, color) {
    svgMarker.fillColor = color;
    var marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: title,
        icon: svgMarker,
    });

    // Create marker infoWindow
    var infoWindow = new google.maps.InfoWindow();
    marker.addListener("click", () => {
        infoWindow.close();
        infoWindow.setContent(marker.getTitle());
        infoWindow.open(marker.getMap(), marker);
    });
    return marker;
}

function getGeolocation(){
    return new Promise((resolve,reject)=>{
		setTimeout(
			navigator.geolocation.getCurrentPosition((position) => {
				const pos = {
				    lat: position.coords.latitude,
				    lng: position.coords.longitude,
				};
	
				userLocationMarker.setPosition({lat: pos.lat, lng: pos.lng});
				console.log("userLocationMarker new coordinates: " + userLocationMarker.position)
				/*
				userLocationMarker = new google.maps.Marker({
					position: pos,
					map: map,
					title: "<div style='color:black; height:60px;width:200px'><b>Your location:</b><br>Latitude: " + pos.lat + "<br/>Longitude: " + pos.lng + "</div>",
					icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
				});
				*/
				map.setCenter(pos);
				resolve(true)
			}, () => {
					alert("Check-in unavailable. Please enable geolocation to proceed with checking in.")
					reject(false);
			}), 5000);
    });	
}

function handleLocationError(browserHasGeolocation, pos) {
	
	userLocationMarker.setPosition(gmu);
	console.log("Error: userLocationMarker set to GMU by default.")
    alert(browserHasGeolocation ? "Error: The Geolocation service failed." : "Error: Your browser doesn't support geolocation.");
}

/* Called at the start of the page loading to check if user is already parked into a spot (has a marker).
If true, automatically sets the check-in button to "check out" and displays current parking spot on map. */
async function isUserCheckedIn(){
	const response = await getUserId();
	console.log("UserId check is complete. Response is: " + response)
    //Check if user id matches with any of the markers. Returns true if it does false if not.

    var database_ref = database.ref();
    var ref = database.ref("markers");
	
    ref.on("value", gotData, errData);
	
	//loop through and check with conditional
    function gotData(data){
		//return new Promise((resolve,reject)=>{
			var markers = data.val();
			var keys = Object.keys(markers);
			for(var x = 0; x < keys.length; x++){
				var k = keys[x];
				var id = markers[k].userID;
				if(id == userId){
					console.log("User marker found.");
					checkedIn = true;
					change();

					/* Adds currently parked marker to map (green) */	
					var googleMapsLink = "https://www.google.com/maps/search/?api=1&query=" + markers[k].latitude + "," + markers[k].longitude;

					var title = "<div style='color:black; height:60px;width:200px'><strong>You're parked here!</strong><br>" + getDateAndTime("of parking") + "<br><a target='_blank' href="+googleMapsLink+">View on Google Maps</a><br/</div>";
					var marker = createMarker({lat: markers[k].latitude, lng: markers[k].longitude}, title, "green");

					return;
				}
			}
			console.log("User is not checked in yet.");
    }
    function errData(err){
        console.log('Error!');
        console.log(err);
    }
}

//Initialize map markers
displayMarkers();


function displayMarkers(){
    var query = firebase.database().ref("markers").orderByKey();
    query.once("value")
    .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            // Assigns markerid, latitude, and longitude data from marker to variables
            var markerUserId = childSnapshot.child("userID").val();
            var latitude = childSnapshot.child("latitude").val();
            var longitude = childSnapshot.child("longitude").val();
            var time = childSnapshot.child("time").val();
            var pos = { lat: latitude, lng: longitude};

            if(markerUserId === ""){
                var googleMapsLink = "https://www.google.com/maps/search/?api=1&query=" + pos.lat + "," + pos.lng;
                var title = "<div style='color:black; height:60px;width:200px'><strong>Available Parking Spot</strong><br>" + time + "<br><a target='_blank' href="+googleMapsLink+">View on Google Maps</a><br/</div>";
                var marker = createMarker(pos, title, "red");
				
				/*When marker is clicked, creates a popup window indicating that it is the currently
				selected marker and updates markerSelected variable with new location */
                google.maps.event.addListener(marker, "click", function (e) {
					markerSelected = marker.getPosition();
                });
            };
        });
    });
}

function getDateAndTime(type){
	var d = new Date();
	var amOrPm = 'am';
	if(d.getHours() >= 12){
		if(d.getHours() != 12){
			d.setHours(d.getHours() % 12);
		}
		amOrPm = 'pm';
		
	}
	var h = addZero(d.getHours());
	var m = addZero(d.getMinutes());
	return 'Time' + ' ' + type + ':<br>' + (d.getMonth() + 1) + '/' + d.getDate() + ', ' + h + ':' + m + ' ' + amOrPm;
}

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}

function updateMarkerId(position, userIdentity){ 
	var database_ref = database.ref();

    var query = firebase.database().ref("markers").orderByKey();
    query.once("value")
    .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            // Assigns markerid, latitude, and longitude data from marker to variables
            var markerPosition = {lat: childSnapshot.child("latitude").val(), lng: childSnapshot.child("longitude").val()};
			
            if(markerPosition.lat == position.lat() && markerPosition.lng == position.lng()){
				console.log("Marker found in database, updating userID")
				database_ref.child('markers/' + childSnapshot.key + '/userID').set(userIdentity);
				database_ref.child('markers/' + childSnapshot.key + '/time').set(getDateAndTime("of parking"));
				return;
            };
        });
    });
}

async function checkIn(){
    const response = await getGeolocation();
	console.log("Geolocation success: " + response);
	if(response == false){
		alert("You must enable geolocation to proceed.")
		return;
	}
	console.log("Currently selected? " + !(markerSelected === null));
    if(checkedIn){
        checkOut();
        checkedIn = false;
		change();
		alert("Check-out: Success!");
    }
    else {
        if (markerSelected === null) {
			console.log("Checking in with geolocation.");
            storeMarker(userId);
			alert("Check-in with geolocation: Success!")
        } else {
            //updateMarker() using currently selected marker with current user id
			console.log("Checking in with selected marker.");
            updateMarkerId(markerSelected, userId);
			alert("Check-in with selected marker: Success!")
        }
        checkedIn = true;
		change();
    }
	displayMarkers();
    //Refresh the page to insure proper display
    window.location.reload();
}

function storeMarker(userId){

    var data = {
        latitude: userLocationMarker.getPosition().lat(),
        longitude: userLocationMarker.getPosition().lng(),
        userID: userId,
		time: getDateAndTime("of parking")
    };

    //console.log(data); //This is working
    //ref.push(data);
    var database_ref = database.ref();

    var ref = database.ref("length");
    ref.on("value", gotData, errData);

    function gotData(data){
        length = data.val(); 
    }

    function errData(err){
        console.log("Error!");
        console.log(err);
    }
	
    database_ref.child('markers/' + length).set(data); //Testing
    length += 1; 
    database_ref.child('length').set(length);
}

/* Shows parking notification */

var flage = false
var marker = null

function change() {
	flage = !flage;
	if (flage) {
		$(".check-in-text").html('Check-Out')
		$(".info-box").show()
	} else {
		$(".check-in-text").html('Check-In')
		$(".info-box").hide()
	}
}

//Just disassociate user with marker in database
function checkOut(){
    //Check if user id matches with any of the markers. Returns true if it does false if not.
    //loop through and check with conditional
    var database_ref = database.ref();
    var ref = database.ref("markers");
    ref.on("value", gotData, errData);

    function gotData(data){
        var markers = data.val();
        var keys = Object.keys(markers);
        for(var x = 0; x < keys.length; x++){
            var k = keys[x];
            var id = markers[k].userID;
            if(id == userId){
                //Change user Id of this marker to ""
                database_ref.child('markers/' + k + '/userID').set("");
                database_ref.child('markers/' + k + '/time').set(getDateAndTime("vacated"));
                return
            }
        }
    }
    function errData(err){
        console.log('Error!');
        console.log(err);
    }
    displayMarkers();
}


