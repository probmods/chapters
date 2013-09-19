/* global $, Cookies */

$(document).ready(function() {
  $("#all-chapters").hover(function() {
    $(this).toggleClass("show");
  });
});

(function() {
  var loggedIn = Cookies.get("loggedin") || false;

if (loggedIn) {
  $("#login-link, #register-link").hide();
  $("#logout-link, #profile-link").show();
}
  
})();
