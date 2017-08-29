module.exports = function(x) {
    x.type = "Bit";
    x.constructor = "Or"; 
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
