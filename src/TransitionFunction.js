(function() {

    /**
     *
     * @class TransitionFunction
     * @memberof Machine
     * @constructor
     * @param {Object} attribs The initialization literal.
     *
     **/
    Machine.TransitionFunction = function(attribs) {
        this._init(attribs);
    };


    Machine.TransitionFunction.prototype{ 
        // Private Methods
        _init: function(){
            this._functionHashable = new Machine.HashTable(); 

        }, 


        // Public Methods
        /** @method **/
        add: function(condition, command){

        }
    };





})();
