(function() {

    /**
     *
     * This class represents a Deterministic Finite  Automaton (DFA). For more information
     * consult the wikipedia article at {@link http://en.wikipedia.org/wiki/Deterministic_finite_automaton}
     * and also suggestions for further reading.
     *
     *
     * @class DFA
     * @constructor
     * @memberof Machine
     * @augments {Machine.BaseMachine}
     * @param {Object} attribs A configuration object
     * @param {Machine.Alphabet} [attribs.alphabet={@link Machine.Alphabet.UNRESTRICTED}] The alphabet.    
     * @param {Boolean} [attribs.allowEpsilonTransitions=false] Permit epsilon transitions 
     **/
    Machine.DFA = function(attribs) {
        this._init(attribs);
    };



    Machine.DFA.prototype = {

        // Private Methods
        _init: function(attribs) {

            if(attribs){
                Machine.BaseMachine.prototype._init.call(this, attribs); 
            } else {
                Machine.BaseMachine.prototype._init.call(this); 
            }


            if(attribs && attribs.hasOwnProperty("allowEpsilonTransitions")){
                this.setAllowEpsilonTransitions(attribs.allowEpsilonTransitions); 
            } else { 
                this.setAllowEpsilonTransitions(true); 
            }


            // The indicator that the DFA has processed its last cell of 
            // input and it is in an accepting state
            this.isAccepted = false; 


            // Now iniitialize the tape. 
            this.tape = new Machine.Tape({
                alphabet: this.getAlphabet(), 
                chars: ""
            });

            // There is only one pointer on a DFA tape
            // We initialize it here at posiiton 0
            this.pointerPosition = 0; 

            //Some custom listener functions for DFA class
            this.onAccept = function(state, stepCount, indexPointer){}; 
            this.onReject = function(state, stepCount, indexPointer){};
            this.onPointerChange = function(position){};  

        },

        //Public Methods

        /**
         * Retrives whether or not this machine allows epsilon  
         * transitions. 
         * @returns {Boolean} True if epsilon transitions allowed
         */
        
        getAllowEpsilonTransitions: function() { 
            return this.allowEpsilonTransitions; 
        }, 

        /**
         * Sets whether or not this machine allows epsilon transitions. 
         * @param {Boolean} allowEpsilonTransitions True if epsilon transitions allowed.
         */
        setAllowEpsilonTransitions: function(allowEpsilonTransitions){

            this.allowEpsilonTransitions = allowEpsilonTransitions; 
        }, 


        /**
         * Returns whether the DFA is in an accepting state. 
         * @method 
         * @return {Boolean} True if in accepted state.
         */
         getIsAccepted: function()  {
            return this.isAccepted; 
         }, 


         /**
          * Sets the value of the accepted state of the DFA.
          * @method
          * @param {Boolean} isAccepted The new accepted state.
          * 
          */
         setIsAccepted: function(isAccepted){
            this.isAccepted = isAccepted;
         },


         /**
          * Returns the tape pointer position. 
          * @method 
          * @return {Number} The pointer position.
          * 
          */
         getPointerPosition: function(){
            return this.pointerPosition;
         }, 

         /**
          * Sets the pointer position. 
          * @method
          * @param {Number} pointerPosition The pointer position.
          */
         setPointerPosition: function(pointerPosition){
            this.pointerPosition = pointerPosition; 
            this.onPointerChange.call(this.pointerPosition);
         },


         /**
          * Returns the tape object. 
          * @method
          * @return {Machine.Tape} The input tape.
          */
         getTape: function() { 
            return this.tape;
         }, 


         /** 
          * Sets the tape object. Beware when using this 
          * method, there are no checks of internal consistency
          * with other aspects of the DFA. 
          * 
          * @method
          * @param {Machine.Tape} tape The tape
          */
         setTape: function(tape){
            this.tape = tape; 
         }, 

         /**
          * Sets the input string on the tape for the DFA and
          * sends the pointer back to the beginning of th string.
          * 
          * @method
          * @param {String} input The input string
          * 
          */
         setInputString: function(input) { 
                this.getTape().setChars(input);
                this.setPointerPosition(0); 

         },

        /** 
         * Resets the current state to the initial state (i.e. start state)
         * and resets the tape position to 0.
         * @method
         */
        reset: function() {
            Machine.BaseMachine.prototype.reset.call(this); 
            this.setPointerPosition(0);
            this.setIsAccepted(false); 
        },




        /** 
         * Adds a transition.
         * @method
         * @param {Mahine.State} conditionState The condition state.
         * @param {String} conditionCharacter The condition character.
         * @param {Machine.State} transitionState  The state to transition to.
         */
        addTransitionByStatesAndCharacter: function(conditionState, currentCharacter, transitionState){

            if(this.getAllowEpsilonTransitions() == false && currentCharacter == Machine.Alphabet.EPSILON_STRING){ 
                throw new Error("Epsilon transitions not permitted in this machine"); 
            }


            var condition = new Machine.Condition({
                state: conditionState,
                character:currentCharacter
            }); 

            var command = new Machine.Command({state:transitionState});
            this.addTransition(condition,command); 
        }, 

        /** 
         * Adds a transition by state label.
         * @method
         * @param {String} conditionStateLabel The condition state label.
         * @param {String} conditionCharacter The condition character.
         * @param {String} transitionStateLabel  The state label to transition to.
         */
        addTransitionByStateLabelsAndCharacter: function(conditionStateLabel, currentCharacter, transitionStateLabel){
            var conditionState = this.getStateTable().getStateByLabel(conditionStateLabel); 
            var transitionState = this.getStateTable().getStateByLabel(transitionStateLabel); 
            this.addTransitionByStatesAndCharacter(conditionState, currentCharacter, transitionState); 
        }, 


        /**
         * Removes a transition by label and character
         * @method 
         * @param {String} conditionStateLabel The condition state label
         * @param {String} conditionCharacter The condition character
         */
        removeTransitionByStateLabelsAndCharacter: function(conditionStateLabel, conditionCharacter){ 
            var conditionState = this.getStateTable().getStateByLabel(conditionStateLabel); 
            var condition = new Machine.Condition({state:condiitonState, 
                character:conditionCharacter}); 
            this.removeTrandition(condition);
        }, 



        /**
         * Checks to see if the machine should halt and configures the machine
         * accordingly. 
         * 
         * @method
         * @return {Boolean} True if the machine has halted
         */
        halt: function(){ 
            if(this.getPointerPosition() >= this.getTape().length() && this.getTransitionFunction().hasEpsilonTransition(this.getCurrentState()) == false ){
                
                this.setIsHalted(true); 
                // We have run out of characters to read
                // Are we in an accepting state?
                if(this.getCurrentState().getIsAccepting() == true){
                    this.setIsAccepted(true);
                    this.onAccept.call(this.getCurrentState(),this.getStepCount(), this.getPointerPosition());
                } else {
                    this.setIsAccepted(false); 
                    this.onReject.call(this.getCurrentState(),this.getStepCount(), this.getPointerPosition());

                }

                this.onHalt.call(this.getCurrentState(),this.getStepCount(), this.getPointerPosition());
                return true; 
            }

            return false; 


        },

        /** 
         * Executes one step of the DFA. 
         * @method
         * @return {Boolean} True if halted
         */
        step: function() { 
            if(this.getIsHalted() == true)  {
                //The DFA is halted so there is nothing do so, so return. 
                return true; 

            }

            // Increment the stepCount
            this.setStepCount(this.getStepCount() + 1); 
            var currentState = this.getCurrentState(); 

            if(this.halt() == true){
                return true; 
            }


            var currentCharacter = null; 
            var condition = null; 



            if (this.getTransitionFunction().hasEpsilonTransition(currentState)) {
                //take the epsilon transition

                currentCharacter = Machine.Alphabet.EPSILON_STRING;
                condition = this.getTransitionFunction().getEpsilonTransitionCondition(currentState);


            } else {
                currentCharacter = this.getTape().charAt(this.getPointerPosition());  


                condition = new Machine.Condition (
                {
                    state: currentState, 
                    character: currentCharacter
                }); 
            }

            var command = this.getTransitionFunction().getCommand(condition); 

            if(command == null){ 
                // There was no transition for the appropriate condition
                // so we have to halt and reject.
                this.setIsHalted(true); 
                this.setIsAccepted(false); 
                this.onReject.call(currentState,this.getStepCount(), this.getPointerPosition());
                this.onHalt.call(currentState,this.getStepCount(), this.getPointerPosition());
                return true; 
            }


            // Now we come to the nondegenerate case

            // Increment the pointer position as long as we are not reading an epsilon string
            if(currentCharacter != Machine.Alphabet.EPSILON_STRING){
                this.setPointerPosition(this.getPointerPosition() + 1); 
            }

            // Change the state
            this.setCurrentState(command.getState()); 

            // Fire the event
            this.onStep.call(condition, command, this.getStepCount(), this.getPointerPosition());


            // Check again for halting conditions

            if(this.halt() == true){
                return true; 
            }


            return false; 

        }, 


        /**
         * Runs the DFA with a specified maximum number of steps.
         * @method
         * @param {Number} maxSteps The maximum number of steps to execute
         * @returns {Boolean} True if the machine has halted
         */
        run: function(maxSteps){ 
            for(var i=0; i < maxSteps; i++){
                var returned = this.step(); 
                if(returned == true){
                    return true;                    
                }
            }

            return false; 
        }, 


        /**
         * Creates a human readable string describing the DFA. 
         * @method 
         * @return {String} The human readable string.
         */
        characterDisplay: function() { 
            var s = Machine.StringUtils.border((this.getTape().length() * 5) + 10, Machine.ANSI.ANSI_RED); 

            s = s + Machine.ANSI.colorize(this.getTape().characterDisplay(this.getPointerPosition()), 
                Machine.ANSI.ANSI_YELLOW);

            s = s + "\n";

            s = s + Machine.ANSI.colorize(this.getStateTable().characterDisplay(this.getCurrentState().getLabel()), 
                Machine.ANSI.ANSI_BLUE);

            s = s + Machine.ANSI.colorize("#" + this.getStepCount() + " Halted: "  
                + Machine.ANSI.invert(this.getIsHalted()) + " Accepted: " 
                + Machine.ANSI.invert(this.getIsAccepted()) + "\n", Machine.ANSI.ANSI_LIGHT_GRAY);
          
            var currentState = this.getCurrentState(); 
            var character = null; 
            var condition = null; 

            if(this.getTransitionFunction().hasEpsilonTransition(currentState)){

                character = Machine.Alphabet.EPSILON_STRING;
                condition = this.getTransitionFunction().getEpsilonTransitionCondition(currentState);

            } else{

                character = this.getTape().charAt(this.getPointerPosition()); 
                condition = new Machine.Condition({state:currentState, character:character}); 
            }

            s = s + Machine.ANSI.colorize(this.getTransitionFunction().characterDisplay(condition), Machine.ANSI.ANSI_GREEN); 

            s = s +Machine.StringUtils.border((this.getTape().length() * 5)+ 10, Machine.ANSI.ANSI_RED); 




            return s; 

        }





    };

    Machine.ClassUtils.extend(Machine.DFA, Machine.BaseMachine); 



})();