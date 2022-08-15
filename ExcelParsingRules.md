### HOW TO PARSE EXCEL FUNCTION

* Starts with =, it's an EvalExpression with the result as the next Node
* Starts with ", it's a StringLiteral keep going until you reach the next ", everything in between is the value
* Starts with a number, it's a NumberLiteral keep going until you reach the next non-number, everything in between is the value
* Starts with {, it's an ArrayLiteral keep going until you reach the next }, when you reach a ; start a new row
* Starts with a letter it's an Identifier, parse until you run into something that isn't a number or letter
* If there is a BinaryOperator right after an Identifier then it's a BinaryExpression
* If there is a ( right after an Identifier then it's a CallExpression
    * Everything until the next ) is the arguments
    * Split it by , and then parse each one as a Node