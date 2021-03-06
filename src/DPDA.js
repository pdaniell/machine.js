(function() {

    /**
     *
     * This class represents a Deterministic Pushdown Auitomaton (DPDA). For more information
     * consult the wikipedia article at {@link http://en.wikipedia.org/wiki/Pushdown_automaton}
     * and also suggestions for further reading.
     *
     *
     * @class DPDA
     * @constructor
     * @memberof Machine
     * @augments {Machine.BaseMachine}
     * @param {Object} attribs A configuration object
     * @param {Machine.Alphabet} [attribs.alphabet={@link Machine.Alphabet.UNRESTRICTED}] The input alphabet.
     * @param {Machine.Alphabet} [attribs.stackAlphabet={@link Machine.Alphabet.UNRESTRICTED}] The stack alphabet.
     * @param {String} [attribs.initialStackSymbol=<blank>] The initial stack symbol to push on to the stack.
     *
     **/
    Machine.DPDA = function(attribs) {
        this._init(attribs);
    };


    /**
     * Accepting mode by state.
     *
     * @constant
     * @static
     * @type {String}
     * @memberOf  Member.DPDA
     */
    Machine.DPDA.ACCEPT_BY_STATE = "0";



    /**
     * Accepting mode by stack
     *
     * @constant
     * @static
     * @type {String}
     * @memberOf  Member.DPDA
     */
    Machine.DPDA.ACCEPT_BY_STACK = "1";

    /**
     * The hashset whih contains all the official PDA acceptance modes.
     * @constant
     * @static
     * @type {Machine.HashTable}
     * @memberOf  Machine.DPDA
     */
    Machine.DPDA.ACCEPTANCE_MODES_SET = new Machine.HashTable();
    Machine.DPDA.ACCEPTANCE_MODES_SET.put(Machine.DPDA.ACCEPT_BY_STATE, "State");
    Machine.DPDA.ACCEPTANCE_MODES_SET.put(Machine.DPDA.ACCEPT_BY_STACK, "Stack");

    Machine.DPDA.prototype = {

        // Private Methods
        _init: function(attribs) {

            if (attribs) {
                Machine.BaseMachine.prototype._init.call(this, attribs);
            } else {
                Machine.BaseMachine.prototype._init.call(this);
            }

            if (attribs && attribs.hasOwnProperty("stackAlphabet")) {
                this.setStackAlphabet(attribs.stackAlphabet);
            } else {
                this.setStackAlphabet(Machine.Alphabet.UNRESTRICTED);
            }


            this.acceptanceMode = null;


            // The indicator that the DPDA has processed its last cell of 
            // input and it is in an accepting state
            this.isAccepted = false;

            this.stack = new Machine.Stack({
                alphabet: this.getStackAlphabet()
            });

            if (attribs && attribs.hasOwnProperty("initialStackSymbol")) {
                this.setInitialStackSymbol(attribs.initialStackSymbol);
            } else {
                this.setInitialStackSymbol(this.getStackAlphabet().getBlank());
            }



            // Now iniitialize the tape. 
            this.tape = new Machine.Tape({
                alphabet: this.getAlphabet(),
                chars: ""
            });

            // There is only one pointer on a DPDA tape
            // We initialize it here at posiiton 0
            this.pointerPosition = 0;

            //Some custom listener functions for DPDA class
            this.onAccept = function(state, stepCount, indexPointer) {};
            this.onReject = function(state, stepCount, indexPointer) {};
            this.onPointerChange = function(position) {};
            this.onStackPop = function(character) {};
            this.onStackPush = function(str) {};


            this.stackPush(this.getInitialStackSymbol());
        },

        //Public Methods

        /**
         * Retieves the acceptance mode of the DPDA.
         * @returns {String} The acceptance mode.
         *
         */
        getAcceptanceMode: function() {
            return this.acceptanceMode;
        },


        /**
         * Retieves the acceptance mode name of the DPDA.
         * @returns {String} The acceptance mode name
         *
         */
        getAcceptanceModeName: function() {
            return Machine.DPDA.ACCEPTANCE_MODES_SET.get(this.getAcceptanceMode());
        },

        /**
         * Sets the acceptance mode.
         * @param {String} acceptanceMode The acceptance mode.
         *
         */
        setAcceptanceMode: function(acceptanceMode) {
            this.acceptanceMode = acceptanceMode;
        },

        /**
         * Retieves the initial stack character.
         * @method
         * @returns {String} The initial stack character.
         */
        getInitialStackSymbol: function() {
            return this.initialStackSymbol;
        },

        /**
         * Sets the initial stack character.
         * @method
         * @param {String} initialStackSymbol The initial stack character
         */
        setInitialStackSymbol: function(initialStackSymbol) {
            if (this.getStackAlphabet().contains(initialStackSymbol) == false) {
                throw new Error("Invalid initial stack character");
            }

            this.initialStackSymbol = initialStackSymbol;
        },


        /**
         * Retrieves the output alphabet for this machine.
         * @method
         * @return {Machine.Alphabet} The output alphabet
         */
        getStackAlphabet: function() {
            return this.stackAlphabet;
        },

        /**
         * Sets the stack alphabet for the machine.
         *
         * @method
         * @param {Machine.Alphabet} stackAlphabet The output alphabet.
         */
        setStackAlphabet: function(stackAlphabet) {
            this.stackAlphabet = stackAlphabet;
        },

        /**
         * Retrieves the stack alphabet.
         * @method
         * @return {Machine.Stack} The DPDA's stack.
         */
        getStack: function() {
            return this.stack;
        },


        /**
         * Sets the stack.
         * @method
         * @param {MachineStack} stack The machine stack
         *
         */
        setStack: function(stack) {
            this.stack = stack;
        },


        /**
         * Pops something from the stack.
         * @method
         * @return {String} The character popped from the stack.
         */
        stackPop: function() {
            var c = this.getStack().pop();
            this.onStackPop.call(c);
            return c;
        },

        /**
         * Peeks at the stack.
         * @method
         * @return {String} The topmost character from the stack.
         */
        stackPeek: function() {
            var c = this.getStack().peek();
            return c;
        },



        /**
         * Pushes something onto the stack.
         * @method
         * @param {String} str The string to push onto the stack
         */
        stackPush: function(str) {
            if (this.getStackAlphabet().isCompatibleWith(str) == false) {
                throw new Error("Invalid stack string.");
            }
            this.getStack().push(str);
            this.onStackPush.call(str);
        },


        /**
         * Returns whether the DPDA is in an accepting state.
         * @method
         * @return {Boolean} True if in accepted state.
         */
        getIsAccepted: function() {
            return this.isAccepted;
        },


        /**
         * Sets the value of the accepted state of the DPDA.
         * @method
         * @param {Boolean} isAccepted The new accepted state.
         *
         */
        setIsAccepted: function(isAccepted) {
            this.isAccepted = isAccepted;
        },


        /**
         * Returns the tape pointer position.
         * @method
         * @return {Number} The pointer position.
         *
         */
        getPointerPosition: function() {
            return this.pointerPosition;
        },

        /**
         * Sets the pointer position.
         * @method
         * @param {Number} pointerPosition The pointer position.
         */
        setPointerPosition: function(pointerPosition) {
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
         * with other aspects of the DPDA.
         *
         * @method
         * @param {Machine.Tape} tape The tape
         */
        setTape: function(tape) {
            this.tape = tape;
        },

        /**
         * Sets the input string on the tape for the DPDA and
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
            this.getStack().clear();
            this.stackPush(this.getInitialStackSymbol());
            this.setIsAccepted(false);
        },



        /** 
         * Adds a transition.
         * @method
         * @param {Mahine.State} conditionState The condition state.
         * @param {String} conditionCharacter The condition character.
         * @param {String} conditionStackElement The condition stack element character.
         * @param {String} transitionStackString The transition stack string  to push.
         * @param {Machine.State} transitionState  The state to transition to.
         */
        addTransitionByStatesAndCharacter: function(conditionState, currentCharacter, conditionStackElement, transitionStackString, transitionState) {
            var condition = new Machine.Condition({
                state: conditionState,
                character: currentCharacter,
                stackElement: conditionStackElement
            });

            var command = new Machine.Command({
                state: transitionState,
                action: Machine.Command.STACK_CHANGE,
                argument: transitionStackString
            });
            this.addTransition(condition, command);
        },

        /** 
         * Adds a transition by state label.
         * @method
         * @param {String} conditionStateLabel The condition state label.
         * @param {String} conditionCharacter The condition character.
         * @param {String} conditionStackElement The condition stack element character.
         * @param {String} transitionStackString The transition stack string to push.
         * @param {String} transitionStateLabel  The state label to transition to.
         */
        addTransitionByStateLabelsAndCharacter: function(conditionStateLabel, currentCharacter, conditionStackElement, transitionStackString, transitionStateLabel) {
            var conditionState = this.getStateTable().getStateByLabel(conditionStateLabel);
            var transitionState = this.getStateTable().getStateByLabel(transitionStateLabel);
            this.addTransitionByStatesAndCharacter(conditionState, currentCharacter, conditionStackElement, transitionStackString, transitionState);
        },


        /**
         * Removes a transition by label and character
         * @method
         * @param {String} conditionStateLabel The condition state label
         * @param {String} conditionCharacter The condition character
         * @param {String} conditionStackElement The condition stack element character.
         */
        removeTransitionByStateLabelsAndCharacter: function(conditionStateLabel, conditionCharacter, conditionStackElement) {
            var conditionState = this.getStateTable().getStateByLabel(conditionStateLabel);
            var condition = new Machine.Condition({
                state: condiitonState,
                character: conditionCharacter,
                stackElement: stackElement
            });
            this.removeTrandition(condition);
        },

        /**
         * Checks to see if the machine should halt and configures the machine
         * accordingly.
         *
         * @method
         * @return {Boolean} True if the machine has halted
         */
        halt: function() {

            var currentState = this.getCurrentState(); 
            var topmostStackCharacter = this.stackPeek(); 


            // Acceptance in a DPDA happens when the input is expired and the machine is in an accepting state
            // or the input has been emptied, the stack has been emptied and there are no remaining epsilon transitions
            // 
            // When the DPDA has run out input it can still take epsilon transitions
            if (this.getPointerPosition() >= this.getTape().length() && (this.getTransitionFunction().hasEpsilonTransition(currentState) == false ||
                    topmostStackCharacter == Machine.Alphabet.EPSILON_STRING)) {

                this.setIsHalted(true);
                // We have run out of characters to read
                // Are we in an accepting state?
                if (currentState.getIsAccepting() == true) {
                    this.setIsAccepted(true);
                    this.onAccept.call(currentState, this.getStepCount(), this.getPointerPosition());

                    this.setAcceptanceMode(Machine.DPDA.ACCEPT_BY_STATE);
                } else if (this.getStack().isEmpty() == true) {
                    this.setIsAccepted(true);
                    this.onAccept.call(currentState, this.getStepCount(), this.getPointerPosition());

                    this.setAcceptanceMode(Machine.DPDA.ACCEPT_BY_STACK);
                } else {
                    this.setIsAccepted(false);
                    this.onReject.call(currentState, this.getStepCount(), this.getPointerPosition());

                }

                this.onHalt.call(currentState, this.getStepCount(), this.getPointerPosition());
                return true;
            }

        },



        /** 
         * Executes one step of the DPDA.
         * @method
         * @return {Boolean} True if halted
         */
        step: function() {
            if (this.getIsHalted() == true) {
                //The DPDA is halted so there is nothing do so, so return. 
                return true;

            }

            // Increment the stepCount
            this.setStepCount(this.getStepCount() + 1);
            var currentState = this.getCurrentState();
            var topmostStackCharacter = this.stackPeek();

            // Check for halting conditions
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
                condition = new Machine.Condition({
                    state: currentState,
                    character: currentCharacter,
                    stackElement: topmostStackCharacter
                });
            }



            var command = this.getTransitionFunction().getCommand(condition);

            if (command == null) {
                // There was no transition for the appropriate condition
                // so we have to halt and reject.
                this.setIsHalted(true);
                this.setIsAccepted(false);
                this.onReject.call(currentState, this.getStepCount(), this.getPointerPosition());
                this.onHalt.call(currentState, this.getStepCount(), this.getPointerPosition());
                return true;
            }


            // We always pop try to pop one character, per convention
            if (condition.getStackElement() != Machine.Alphabet.EPSILON_STRING) {
                var popCharacter = this.stackPop();
            }



            if (command.getAction() == Machine.Command.STACK_CHANGE && command.getArgument() != Machine.Alphabet.EPSILON_STRING) {
                this.stackPush(command.getArgument());
            }



            // Increment the pointer position 
            if (this.getTransitionFunction().hasEpsilonTransition(currentState) == false) {
                this.setPointerPosition(this.getPointerPosition() + 1);
            }

            // Change the state
            this.setCurrentState(command.getState());


            //Check for halting conditions again
            if(this.halt() == true){
                return true; 
            }



            // Fire the event
            this.onStep.call(condition, command, this.getStepCount(), this.getPointerPosition());

            return false;

        },



        /**
         * Runs the DPDA with a specified maximum number of steps.
         * @method
         * @param {Number} maxSteps The maximum number of steps to execute
         * @returns {Boolean} True if the machine has halted
         */
        run: function(maxSteps) {
            for (var i = 0; i < maxSteps; i++) {
                var returned = this.step();
                if (returned == true) {
                    return true;
                }
            }

            return false;
        },


        /**
         * Creates a human readable string describing the DPDA.
         * @method
         * @return {String} The human readable string.
         */
        characterDisplay: function() {
            var s = Machine.StringUtils.border((this.getTape().length() * 5) + 10, Machine.ANSI.ANSI_RED);

            s = s + Machine.ANSI.colorize(this.getTape().characterDisplay(this.getPointerPosition()),
                Machine.ANSI.ANSI_YELLOW);

            var mode = "";
            if (this.getIsAccepted()) {
                mode = "[" + this.getAcceptanceModeName() + "]";
            }

            s = s + "\n";

            s = s + Machine.ANSI.colorize(this.getStateTable().characterDisplay(this.getCurrentState().getLabel()),
                Machine.ANSI.ANSI_BLUE);

            s = s + Machine.ANSI.colorize("#" + this.getStepCount() + " Halted: " + Machine.ANSI.invert(this.getIsHalted()) + " Accepted: " + Machine.ANSI.invert(this.getIsAccepted() + mode) + "\n", Machine.ANSI.ANSI_LIGHT_GRAY);

            s = s + Machine.ANSI.colorize(this.getStack().characterDisplay() + "\n", Machine.ANSI.ANSI_BLUE);


            var currentState = this.getCurrentState();
            var topMostStackCharacter = this.stackPeek();
            var currentCharacter = null;
            var condition = null;

            if (this.getTransitionFunction().hasEpsilonTransition(currentState)) {
                //take the epsilon transition

                currentCharacter = Machine.Alphabet.EPSILON_STRING;
                condition = this.getTransitionFunction().getEpsilonTransitionCondition(currentState);


            } else {

                currentCharacter = this.getTape().charAt(this.getPointerPosition());
                condition = new Machine.Condition({
                    state: currentState,
                    character: currentCharacter,
                    stackElement: topMostStackCharacter
                });
            }



            s = s + Machine.ANSI.colorize(this.getTransitionFunction().characterDisplay(condition), Machine.ANSI.ANSI_GREEN);

            s = s + Machine.StringUtils.border((this.getTape().length() * 5) + 10, Machine.ANSI.ANSI_RED);



            return s;

        }



    };

    Machine.ClassUtils.extend(Machine.DPDA, Machine.BaseMachine);



})();