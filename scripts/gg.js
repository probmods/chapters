/* global Cookies */

(function() {
  $.ajax({
    type: "GET",
    url: "/account_status",
    async: false,
    success: function(x) {
      if (!!x) {
        if (!Cookies.get("gg")) {
          Cookies.set("gg","1", {expires: 1234567});
        }
      } else {
        if (Cookies.get("gg")) {
          Cookies.expire("gg");
          alert("Your login has expired. Re-login for code saving / loading");
        }
      }
    },
    error: function() {
      if (!location.protocol.match(/file/)) {
        alert('accounts server appears to be down. saving/loading code won\'t work');
      }
    }
  });

})();
