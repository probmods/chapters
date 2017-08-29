module.exports = function(x) {
    x.type = "Real";
    x.constructor = "Normal"; 
    x.constructorArgs = x.args;
    x.outputVariable = x.id; 
    x.inputVariables = []; 
}
