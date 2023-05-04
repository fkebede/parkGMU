// Retrieve user information and load onto user profile page
var name = localStorage.getItem("userNameLocalStorage");
var email = localStorage.getItem("userEmailLocalStorage");

// Update html elements with user data
document.getElementById('changeDisplay').innerText = email;
document.getElementById('userEmail').innerText = email;
document.getElementById('userName').innerText = 'Name: ' + name;
document.getElementById('userEmailAdd').innerText = 'Email: ' + email;

// User profile page display toggle
document.getElementById('changeDisplay').onclick = function changeContent() {

    if (document.getElementById('profile').style.display === "none"){
        document.getElementById('profile').style.display = "block";
    }
    else {
        document.getElementById('profile').style.display = "none";

        // Move to top of page when user profile page is not displayed
        window.scrollTo(0, 0);
    }
}

//Sign out the current user
const logoutBtn = document.querySelector('#sign-out-btn');
logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    auth.signOut();
    alert("You have signed out successfully!");

    //Refresh the page to insure proper display
    window.location.reload();
});