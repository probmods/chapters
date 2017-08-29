module.exports = function(x) {
    x.type = "Real";
    x.constructor = "Product";
    x.outputVariable = x.id; 
    x.inputVariables = x.args; 
}
