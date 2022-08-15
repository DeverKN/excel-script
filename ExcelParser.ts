export const parseExcelFunc = () => {

}

const tokenizer = (excelString: string) => {
    return excelString.split("")
}

const node = (nodeType: string, args: object) => {
    return {
        type: nodeType,
        ...args
    }
}

interface Node {
    type: string
}

const is = (node: Node, nodeType: String) => {
    return nodeType === node.type
}

type Identifer = {
    type: "Identifier",
    name: string
}

type StringLiteral = {
    type: "StringLiteral",
    value: string
}

type NumberLiteral = {
    type: "NumberLiteral",
    value: number
}

type ArrayLiteral = {
    type: "ArrayLiteral",
    value: Node[][]
}

type CallExpression = {
    type: "CallExpression",
    arguments: Node[]
}

type BinaryOperator = "+" | "-" | "/" | "*" | ">" | "<"
type BinaryExpression = {
    type: "BinaryExpression",
    left: Node,
    operator: BinaryOperator
    right: Node
}

const types = {
    Identifier: (name: string): Identifer => {return {type: "Identifier", name}},
    StringLiteral: (value: string): StringLiteral => {return {type: "StringLiteral", value}},
    NumberLiteral: (value: number): NumberLiteral => {return {type: "NumberLiteral", value}},
    ArrayLiteral: (value: Node[][]): ArrayLiteral => {return {type: "ArrayLiteral", value}},
    CallExpression: (callee: Identifer, args: Node[]): CallExpression => {return {type: "CallExpression", arguments: args}},
    BinaryExpression: (left: Node, operator: BinaryOperator, right: Node): BinaryExpression => {return {type: "BinaryExpression", left, operator, right}},
}
/*

Identifier = dog
{
    name: "dog"
}

StringLiteral = "dog"
{
    value: "dog"
}

NumberLiteral = 15
{
    value: 15
}

ArrayLiteral = {1;2;3}
{
    value = [
        [1],
        [2],
        [3]
    ]
}

CallExpression = func(arg1)
{
    callee: Identifier("func"),
    arguments: Identifer("arg1")
}

EvalExpression = =1 + 2 or =FUNC(6)
{
    result: Node
}

RangeLiteral = B2:C5
{

}
*/

/*const generateAST = (excelTokens, stringSoFar = "", type): Node => {
    if (excelTokens.length <= 0) return
    const [first, ...rest] = excelTokens
    return [first, generateAST(rest)]
}*/

// const parse = () => {
//     if ()
// }