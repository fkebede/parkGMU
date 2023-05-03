//import { getAuth, sendEmailVerification } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg2Dwdy17rtVvpvkRjGVSYCSsrQGkCozM",
  authDomain: "parkgmu-df148.firebaseapp.com",
  projectId: "parkgmu-df148",
  storageBucket: "parkgmu-df148.appspot.com",
  messagingSenderId: "164139708509",
  appId: "1:164139708509:web:3aee9aaee2853446d01db4",
  measurementId: "G-SQ409SM2DM"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize variables
const auth = firebase.auth()
const database = firebase.database()

// Set up our register function
function register () {
  // Get all our input fields
  full_name = document.getElementById('full-name').value
  email = document.getElementById('email').value
  password = document.getElementById('password').value

  if (full_name == "" || email == "" || password == "") {
    alert('Form must be filled out completely.')
    return;
  }

  // Validate input fields
  if (validate_email(email) == false) {
    alert('Invalid input for email field.')
    return
    // Don't continue running the code
  }
  if (validate_password(password) == false) {
    alert('Invalid input for password field.')
    return
    // Don't continue running the code
  }
  if (validate_field(full_name) == false) {
    alert('Invalid input for name field.')
    return
  }

  // Move on with Auth
  auth.createUserWithEmailAndPassword(email, password)
  .then(function() {
    // Declare user variable
    var user = auth.currentUser

    // Add this user to Firebase Database
    var database_ref = database.ref()

    // Create User data
    var user_data = {
      full_name : full_name,
      email : email,
      last_login : Date.now()
    }

    // Push to Firebase Database
    database_ref.child('users/' + user.uid).set(user_data)

    // Done
     user.sendEmailVerification();
      
    alert('Please verify your email by clicking the link in the email we sent you.')
  })
  .catch(function(error) {
    // Firebase will use this to alert of its errors
    var error_code = error.code
    var error_message = error.message

    alert(error_message)
  })
}

// Set up our login function
function login () {
  // Get all our input fields
  email = document.getElementById('signin-email').value
  password = document.getElementById('signin-password').value

  // Validate input fields
  if (email == "" || password == "") {
    alert('You must provide all login credentials.')
    return;
  }

  if (validate_email(email) == false || validate_password(password) == false) {
    alert('Email or Password is invalid!')
    return
    // Don't continue running the code
  }

  auth.signInWithEmailAndPassword(email, password)
  .then(function() {
    // Declare user variable
    var user = auth.currentUser

    if(user.emailVerified == false){
      
        auth.signOut().then(() => {
          // Sign-out successful.
        }).catch((error) => {
          // An error happened.
          alert(error);
        });
        
        alert('The email associated with this account has not been verified. You must verify your email using the email we sent you before you can log in.');
        return;
    }
    // Add this user to Firebase Database
    var database_ref = database.ref()

    // Create User data
    var user_data = {
      last_login : Date.now()
    }

    // Push to Firebase Database
    database_ref.child('users/' + user.uid).update(user_data)
    // Done

    // Get user data from firebase
    var ref = database.ref('/users/' + user.uid).once('value').then(function(snapshot) {
      var userData = snapshot.val();

      var userName = userData.full_name;
      var userEmail = userData.email;

      //alert('User Name: ' + userName + ' ' + 'User Email: ' + userEmail);

      localStorage.setItem("userNameLocalStorage", userName);
      localStorage.setItem("userEmailLocalStorage", userEmail);

      // Load map.html page
      window.location.href = 'map.html';
    })
  })
  .catch(function(error) {
    // Firebase will use this to alert of its errors
    var error_code = error.code
    var error_message = error.message

    alert(error_message)
  })
}

// Validate Functions
/*
Work on authentification here with Vinnie. 
*/
function validate_email(email) {
  //expression = /^[^@]+@\w+(\.\w+)+\w$/ 
  expression = /^\"?[\w-_\.]*\"?@gmu\.edu$/
  if (expression.test(email) == true) {
  
    // Email is good
    return true
  } else {
    // Email is not good
    return false
  }
}

function validate_password(password) {
  // Firebase only accepts lengths greater than 6
  if (password < 6) {
    return false
  } else {
    return true
  }
}

function validate_field(field) {
  if (field == null) {
    return false
  }

  if (field.length <= 0) {
    return false
  } else {
    return true
  }
}

function reset_password(){
    email = document.getElementById('signin-email').value
    if(validate_email(email) == false){
        alert('Please enter a valid email in the login email field and we will send you an email to reset your password.')
        return
    }
    auth.sendPasswordResetEmail(email)
      .then(() => {
        // Password reset email sent!
        alert('Password reset email has been sent to ' + email + '. Please check your inbox and be patient as it may take a few minutes to get to you!')
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });    
    
}
