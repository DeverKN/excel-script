import * as acorn from 'acorn'
import { readFile, writeFile } from 'fs/promises'
const fileLocation = "./test.js"
const file = await readFile(fileLocation, "utf-8")

const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})

const Identifier = (node) => {
    return node.name
}

const BlockStatement = (node) => {
    const {body} = node
    const variables = body.filter(({type}) => type === "VariableDeclaration").map(variable => visitNode(variable)).flat()
    const identifiers = body.filter(({type}) => type === "Identifier").map(identifier => visitNode(identifier))
    const returnVal = visitNode(body.find(({type}) => type === "ReturnStatement"))
    if (variables.length > 0) {
        return `LET(${variables.map(({name, init}) => `${name}, ${init}`).join(", ")}, ${returnVal})`
    } else {
        return returnVal
    }
}

const BinaryExpression = (node) => {
    const {left, operator, right} = node
    return `${visitNode(left)} ${operator} ${visitNode(right)}`
}

const ArrowFunctionExpression = (node) => {
    const {params, body} = node
    return `LAMBDA(${params.map(param => visitNode(param)).join(", ")}, ${visitNode(body)})`
}

const ExpressionStatement = (node) => {
    return visitNode(node.expression)
}

const CallExpression = (node) => {
    const {callee, arguments: args} = node
    return `${visitNode(callee)}(${args.map(arg => visitNode(arg)).join(", ")})`
}

const functionWithVariables = (variables, functionString) => {
    if (variables.length > 0) {
        return `LET(${variables.map(({name, init}) => `${name}, ${init}`).join(", ")}, ${functionString})`
    } else {
        return `${functionString}`
    }
}

const Program = (node) => {
    const {body} = node
    const variables = body.filter(({type}) => type === "VariableDeclaration").map(variable => visitNode(variable)).flat()
    const returnVal = visitNode(body.find(({type}) => type === "ExportDefaultDeclaration"))
    const exportsArr = body.filter(({type}) => type === "ExportNamedDeclaration")
                           .map(exportDec => visitNode(exportDec))
                           .map(([exportedName, exportedFunc]) => [exportedName, functionWithVariables(variables, exportedFunc)])
    const exports = Object.fromEntries(exportsArr)
    return {exports, main: `=${functionWithVariables(variables, returnVal)}`}
}

const VariableDeclaration = (node) => {
    return node.declarations.map(declaration => visitNode(declaration))
}

const VariableDeclarator = (node) => {
    const {id, init} = node
    return {
        name: id.name,
        init: visitNode(init)
    }
}

const ReturnStatement = (node) => {
    return visitNode(node.argument)
}

const ConditionalExpression = (node) => {
    const {test, consequent, alternate} = node
    return `IF(${visitNode(test)}, ${visitNode(consequent)}, ${visitNode(alternate)})`
}

const Literal = (node) => {
    return node.raw
}

const AssignmentExpression = (node) => {
    throw Error("Variable re-assignment is node allowed!")
}


const ExportDefaultDeclaration = (node) => {
    return visitNode(node.declaration)
}

const ExportNamedDeclaration = (node) => {
    const declaration = node.declaration.declarations[0]
    const {id, init} = declaration
    return [visitNode(id), visitNode(init)]
}

const MemberExpression = (node) => {
    const {object, property} = node
    if (object.type === "MemberExpression") {
        return `INDEX(${visitNode(object.object)}, ${visitNode(object.property)}, ${visitNode(property)})`
    } else {
        return `INDEX(${visitNode(object)}, ${visitNode(property)})`
    }
}

const SequenceExpression = (node) => {
    const {expressions} = node
    return expressions.map(visitNode).join(":")
}

const visitor = {
    ExpressionStatement,
    Program,
    CallExpression,
    BlockStatement,
    BinaryExpression,
    BinaryExpression,
    ArrowFunctionExpression,
    Identifier,
    VariableDeclaration,
    VariableDeclarator,
    ReturnStatement,
    ConditionalExpression,
    Literal,
    AssignmentExpression,
    MemberExpression,
    SequenceExpression,
    ExportDefaultDeclaration,
    ExportNamedDeclaration
}

const visitNode = (node) => {
    return visitor[node.type](node)
    switch (node.type) {
        case "ExpressionStatement":
            return visitExpressionStatement(node)
        case "Program":
            return visitProgram(node)
        case "CallExpression":
            return visitCallExpression(node)
        case "BlockStatement":
            return visitBlockStatement(node)
        case "BinaryExpression":
            return visitBinaryExpression(node)
        case "ArrowFunctionExpression":
            return visitArrowFunctionExpression(node)
        case "Identifier":
            return visitIdentifier(node)
        case "VariableDeclaration":
            return visitVariableDeclaration(node)
        case "VariableDeclarator":
            return visitVariableDeclarator(node)
        case "ReturnStatement":
            return visitReturnStatement(node)
    }
}

const compile = async (programLocation) => {
    const file = await readFile(programLocation, "utf-8")
    const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})
    return visitNode(program).main
}

const compileExports = async (programLocation) => {
    const file = await readFile(programLocation, "utf-8")
    const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})
    const { exports } =  visitNode(program)
    await writeFile(`${programLocation.slice(0, -3)}.exports.json`, JSON.stringify(exports), 'utf-8')
}

const output = await compile(fileLocation)
compileExports(fileLocation)
// console.log(program)
console.log(output)