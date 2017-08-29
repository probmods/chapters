module.exports = function(x) {
    x.type = "Bit";
    x.constructor = "Not"; 
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
