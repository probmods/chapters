module.exports = function(x) {
    x.type = "Real";
    x.constructor = "Beta"; 
    x.constructorArgs = x.args;
    x.outputVariable = x.id; 
    x.inputVariables = []; 
}
