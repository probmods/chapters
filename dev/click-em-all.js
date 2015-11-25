/* global $ */

// a utility script for testing the html pages
// it programmatically clicks every run button

var buttons = $("button.run").toArray();

var i = 0;
var clickNext = function() {
    i++;
    var b = buttons.shift();
    if (typeof b === 'undefined') {
        return;
    }

    console.log('clicking button ' + i);

    b.focus();
    b.click();
    setTimeout(clickNext, 500);

}

clickNext();
