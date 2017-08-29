module.exports = function(x) {
    x.type = "Real";
    x.constructor = "Sum"; 
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
