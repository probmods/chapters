module.exports = function(x) {
    x.type = "Bit";
    x.constructor = "Bernoulli"; 
    x.constructorArgs = x.args;
    x.outputVariable = x.id; 
    x.inputVariables = []; 
}
