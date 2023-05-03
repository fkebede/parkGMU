// Map Marker functions

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

            userLocationMarker = new google.maps.Marker({
                position: pos,
                map: map,
                title: "<div style='color:black; height:60px;width:200px'><b>Your location:</b><br>Latitude: " + pos.lat + "<br/>Longitude: " + pos.lng + "</div>",
				icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
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
            
            if(markerUserId === ""){
                var marker = new google.maps.Marker({
                    position: { lat: latitude, lng: longitude},
                    map: map,
                    title: "Coordinates: " + latitude + ", " + longitude
                });
				
				/*When marker is clicked, creates a popup window indicating that it is the currently
				selected marker and updates markerSelected variable with new location */
                google.maps.event.addListener(marker, "click", function (e) {
					if(markerInfoWindow == null){
						markerInfoWindow = new google.maps.InfoWindow();
						markerInfoWindow.setContent("<div style='color:black; height:60px;width:200px'><b>Current Selection:</b><br>Latitude: " + latitude + "<br/>Longitude: " + longitude + "</div>");
						markerInfoWindow.open(map, marker);
						markerSelected = marker.getPosition();
						console.log("Currently selecting: " + marker.getPosition());    
					}
                });
            };
        });
    });
}


function updateMarkerId(position, userIdentity){ 
	var database_ref = database.ref();

    var query = firebase.database().ref("markers").orderByKey();
    query.once("value")
    .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            // Assigns markerid, latitude, and longitude data from marker to variables
            var markerPosition = {lat: childSnapshot.child("latitude").val(), lng: childSnapshot.child("longitude").val()};
			
			//console.log(position.lat());		

            //Old one: if(markerPosition === position)
            //console.log(childSnapshot);
            if(markerPosition.lat == position.lat() && markerPosition.lng == position.lng()){
				console.log("Marker found in database, updating userID")
				
				//console.log(childSnapshot.key);
				database_ref.child('markers/' + childSnapshot.key + '/userID').set(userIdentity);
				//console.log(childSnapshot.child("userID"));
				//.set(userIdentity);

				//database_ref.child('length').set(length);
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
		alert("Check-out: Success!")
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
}

//BUG: Something's wrong here.
function storeMarker(userId){
    //var ref = database.ref('markers');
    var data = {
        //latitude: position.lat,
        //longitude: position.lng,
        latitude: userLocationMarker.getPosition().lat(),
        longitude: userLocationMarker.getPosition().lng(),
        userID: userId
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
    //ans = false;
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


