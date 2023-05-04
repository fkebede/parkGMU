// Map Marker functions
var mostRecentPosition;
var length;
var userId = null;
var map;
var userLocationMarker = null;
var markerSelected = null;
var markerInfoWindow = null; //currently selected marker info window
var checkedIn = isUserCheckedIn();

// Custom marker
var svgMarker = {
    path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "blue",
    fillOpacity: 1,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
};

/* Checks if user is still signed in and assigns users id to userId variable. */
auth.onAuthStateChanged( (user) => {
    if (user) {
        // User is signed in, sets userId variable to current user's id.
        userId = user.uid;
        console.log("User (" + userId + ") is signed in.")
    } else {
        // User is signed out, redirected back to home page.
        window.location.href = 'index.html'
    }
});

/* Initializes basemap using users geolocation */
initMap();

function initMap(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (p) {
            var LatLng = {lat: p.coords.latitude, lng: p.coords.longitude};
            var mapOptions = {
                center: LatLng,
                zoom: 13,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById("gmu-map"), mapOptions);
            userLocationMarker = createMarker(LatLng, "blue");
            map.setCenter(LatLng);
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
function createMarker(pos, color) {
    svgMarker.fillColor = color;
    var marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: "<div style='color:black; height:60px;width:200px'><b>Your location:</b><br>Latitude: " + pos.lat + "<br/>Longitude: " + pos.lng + "</div>",
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
        alert("Check-in unavailable. Please enable geolocation to proceed with checking in.")
    });
}
function handleLocationError(browserHasGeolocation, pos) {
    userLocationMarker = new google.maps.Marker({
        position: gmu,
        map: map,
        title: "<div style='color:black; height:60px;width:200px'><b>George Mason University:</b><br>Latitude: " + gmu.lat + "<br/>Longitude: " + gmu.lng + "</div>"
    });
    alert(browserHasGeolocation ? "Error: The Geolocation service failed." : "Error: Your browser doesn't support geolocation.");
}

/* Called at the start of the page loading to check if user is already parked into a spot (has a marker).
If true, automatically sets the check-in button to "check out" and displays current parking spot on map.
*/
function isUserCheckedIn(){

    var query = firebase.database().ref("markers").orderByKey();
    query.once("value")
        .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {

                if(childSnapshot.child("userID").val() === userId){
                    console.log("User already checked in. Loading current parking data.")
                    change();
                    var marker = new google.maps.Marker({
                        position: { lat: childSnapshot.child("latitude").val(), lng: childSnapshot.child("longitude").val()},
                        map: map,
                        title: "You're parked here!",
                        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    });

                    /*When marker is clicked, creates a popup window indicating that it is the currently
                    selected marker and updates markerSelected variable with new location */
                    google.maps.event.addListener(marker, "click", function (e) {
                        if(markerInfoWindow === null){
                            markerInfoWindow = new google.maps.InfoWindow();
                            markerInfoWindow.setContent("<div style='color:black; height:60px;width:200px'><b>You're parked here!</b></div>");
                            markerInfoWindow.open(map, marker);
                            markerSelected = marker.position;
                            console.log("You're parked here!")
                        }
                    });

                    return true;
                };
            });
        });
    return false;
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

function checkIn(){
    getGeolocation();
    console.log("Currently selected? " + !(markerSelected === null));
    if(checkedIn){
        checkOut();
        checkedIn = false;
    }
    else {
        if (markerSelected === null) {
            storeMarker(mostRecentPosition, userId);
        } else {
            //updateMarker() using currently selected marker with current user id
            updateMarkerId(markerSelected, userId);
        }
    }
    change();
    displayMarkers();
}

//BUG: Something's wrong here.
function storeMarker(position, userId){
    //var ref = database.ref('markers');
    var data = {
        latitude: position.lat,
        longitude: position.lng,
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

    alert("Check-in: Success!")
}

/* Shows parking notification */

var flage = false
var marker = null

function change() {
    flage = !flage
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
    alert("Checkout success!");
}