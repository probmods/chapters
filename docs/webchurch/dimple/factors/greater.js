module.exports = function(x) {
    x.type = "Real";
    x.constructor = "GreaterThan"; 
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
