module.exports = function(x) {
    x.type = "Bit";
    x.constructor = "And"; 
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
