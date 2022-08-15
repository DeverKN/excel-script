import * as acorn from 'acorn'
import { readFile, writeFile } from 'fs/promises'
const fileLocation = "./test.js"
const file = await readFile(fileLocation, "utf-8")

const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})

const Identifier = (node) => {
    return node.name
}

const BlockStatement = (node, scope) => {
    const {body} = node
    const variables = body.filter(({type}) => type === "VariableDeclaration").map(variable => scope.traverse(variable)).flat()
    const identifiers = body.filter(({type}) => type === "Identifier").map(identifier => scope.traverse(identifier))
    const returnVal = scope.traverse(body.find(({type}) => type === "ReturnStatement"))
    if (variables.length > 0) {
        return `LET(${variables.map(({name, init}) => `${name}, ${init}`).join(", ")}, ${returnVal})`
    } else {
        return returnVal
    }
}

const BinaryExpression = (node, scope) => {
    const {left, operator, right} = node
    return `${scope.traverse(left)} ${operator} ${scope.traverse(right)}`
}

const ArrowFunctionExpression = (node, scope) => {
    const {params, body} = node
    return `LAMBDA(${params.map(param => scope.traverse(param)).join(", ")}, ${scope.traverse(body)})`
}

const ExpressionStatement = (node, scope) => {
    return scope.traverse(node.expression)
}

const CallExpression = (node, scope) => {
    const {callee, arguments: args} = node
    return `${scope.traverse(callee)}(${args.map(arg => scope.traverse(arg)).join(", ")})`
}

const functionWithVariables = (variables, functionString) => {
    if (variables.length > 0) {
        return `LET(${variables.map(({name, init}) => `${name}, ${init}`).join(", ")}, ${functionString})`
    } else {
        return `${functionString}`
    }
}

const Program = (node, scope) => {
    const {body} = node
    const variables = body.filter(({type}) => type === "VariableDeclaration").map(variable => scope.traverse(variable)).flat()
    const returnVal = scope.traverse(body.find(({type}) => type === "ExportDefaultDeclaration"))
    const exportsArr = body.filter(({type}) => type === "ExportNamedDeclaration")
                           .map(exportDec => scope.traverse(exportDec))
                           .map(([exportedName, exportedFunc]) => [exportedName, functionWithVariables(variables, exportedFunc)])
    const exports = Object.fromEntries(exportsArr)
    return {
        exports, 
        variables,
        main: returnVal
    }
}

const VariableDeclaration = (node, scope) => {
    return node.declarations.map(declaration => scope.traverse(declaration))
}

const VariableDeclarator = (node, scope) => {
    const {id, init} = node
    return {
        name: id.name,
        init: scope.traverse(init)
    }
}

const ReturnStatement = (node, scope) => {
    return scope.traverse(node.argument)
}

const ConditionalExpression = (node, scope) => {
    const {test, consequent, alternate} = node
    return `IF(${scope.traverse(test)}, ${scope.traverse(consequent)}, ${scope.traverse(alternate)})`
}

const Literal = (node) => {
    return node.raw
}

const AssignmentExpression = (node) => {
    throw Error("Variable re-assignment is node allowed!")
}


const ExportDefaultDeclaration = (node, scope) => {
    return scope.traverse(node.declaration)
}

const ExportNamedDeclaration = (node, scope) => {
    const declaration = node.declaration.declarations[0]
    const {id, init} = declaration
    return [scope.traverse(id), scope.traverse(init)]
}

const MemberExpression = (node, scope) => {
    const {object, property} = node
    if (object.type === "MemberExpression") {
        return `INDEX(${scope.traverse(object.object)}, ${scope.traverse(object.property)}, ${scope.traverse(property)})`
    } else {
        return `INDEX(${scope.traverse(object)}, ${scope.traverse(property)})`
    }
}

const SequenceExpression = (node) => {
    const {expressions} = node
    return expressions.map(visitNode).join(":")
}

const makeVisitor = () => {
    return {
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
}

const visitNode = (node, visitor) => {
    const scope = {}
    // console.log({visitor})
    const traverse = (node) => visitor[node.type](node, scope)
    scope.traverse = traverse
    return scope.traverse(node)
    // return visitor[node.type](node)
    // switch (node.type) {
    //     case "ExpressionStatement":
    //         return visitExpressionStatement(node)
    //     case "Program":
    //         return visitProgram(node)
    //     case "CallExpression":
    //         return visitCallExpression(node)
    //     case "BlockStatement":
    //         return visitBlockStatement(node)
    //     case "BinaryExpression":
    //         return visitBinaryExpression(node)
    //     case "ArrowFunctionExpression":
    //         return visitArrowFunctionExpression(node)
    //     case "Identifier":
    //         return visitIdentifier(node)
    //     case "VariableDeclaration":
    //         return visitVariableDeclaration(node)
    //     case "VariableDeclarator":
    //         return visitVariableDeclarator(node)
    //     case "ReturnStatement":
    //         return visitReturnStatement(node)
    // }
}

const compile = async (programLocation, opts) => {
    const file = await readFile(programLocation, "utf-8")
    const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})
    const visitor = makeVisitor()
    const {main, variables} = visitNode(program, visitor)
    const pack = opts.pack ?? false
    if (pack) {
        return `=${functionWithVariables(variables, main)}`
    } else {
        const functions = Object.fromEntries(variables.map(({name, init}) => {
            return [name, `=${init}`]
        }))
        return {...functions, "_main_": `=${main}`}
    }
}

const compileExports = async (programLocation) => {
    const file = await readFile(programLocation, "utf-8")
    const program = acorn.parse(file, {ecmaVersion: "2020", sourceType: "module"})
    const visitor = makeVisitor()
    const { exports } =  visitNode(program, visitor)
    await writeFile(`${programLocation.slice(0, -3)}.exports.json`, JSON.stringify(exports), 'utf-8')
}

const output = await compile(fileLocation, {pack: false})
console.log(JSON.stringify(output))
compileExports(fileLocation)