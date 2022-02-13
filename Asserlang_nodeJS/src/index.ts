import ReadLine from "readline-sync"
import { program } from "commander"
import path from "path"
import fs from "fs"

const variables: { [key: string]: any } = {}
const localVariables: { [key: string]: { [key: string]: any } } = {}
const subRoutines: { [key: string]: (args?: any[]) => void | any } = {}
const statements = ["ㅇㅉ", "ㅌㅂ", "저쩔", "어쩔", "안물", "안물", "안궁", "화났쥬?", "킹받쥬?"]

const execute = async (code: string) => {
  const lines: string[] = code.replace(/\r/gi, "").split("\n")
  if (lines.shift() !== "쿠쿠루삥뽕") throw new Error("아무것도 모르죠?")
  if (lines.pop() !== "슉슈슉슉") throw new Error("아무것도 모르죠?")
  run(lines)
}

const run = async (lines: string[]) => {
  for (const line in lines) {
    const components = getComponents(lines[line])
    if (components.doesStartWithKeyword) {
      if (components.keyword === "어쩔") {
        declareVariable(lines[line])
      } else if (components.keyword === "저쩔") {
        assignVariable(lines[line])
      } else if (components.keyword === "ㅇㅉ") {
        print(lines[line])
      } else if (components.keyword === "ㅌㅂ") {
        input(lines[line])
      } else if (components.keyword === "안물") {
        const endIndex = lines.findIndex((v: any, i: any) => i !== Number(line) && v === "안물")
        if (endIndex <= -1) throw new Error("안물")
        const functionBlock = lines.splice(Number(line), endIndex)
        declareFunction(functionBlock)
      } else if (components.keyword === "안궁") {
        callFunction(lines[line])
      } else if (components.keyword === "화났쥬?") {
        conditionOperator(lines[line])
      }
    } else {
      console.log(components.value ?? "")
    }
  }
}

const getComponents = (
  line: string
):
  | {
      doesStartWithKeyword: false
      value: any
    }
  | {
      doesStartWithKeyword: true
      keyword: string
      values: string[]
    } => {
  const [statement] = statements.filter((v) => line.startsWith(v))
  if (!statement) {
    if (isPureNumber(line)) return { doesStartWithKeyword: false, value: toNumber(line) }
    else
      return {
        doesStartWithKeyword: false,
        value: getVariable(line)
      }
  } else {
    return {
      doesStartWithKeyword: true,
      keyword: statement,
      values: line.trim().replace(statement, "").split(" ")
    }
  }
}

const isPureNumber = (value: string) => {
  const ㅋ = value.split("").filter((v) => v === "ㅋ").length
  const ㅎ = value.split("").filter((v) => v === "ㅎ").length
  if (ㅋ + ㅎ === value.length) return true
  else return false
}

const getVariable = (line: string) => {
  if (line.startsWith("ㅌㅂ")) return input(line)
  if (statements.includes(line)) return
  const value = variables[line]
  if (!value) return toNumber(line) === 0 ? null : toNumber(line)
  return value
}

const callFunction = (line: string) => {
  if (!line.startsWith("안궁")) return
  const [name, ...args] = line.replace("안궁", "").split(" ")
  subRoutines[name](args.map((v) => getVariable(v)))
}

const declareFunction = (functionLines: string[]) => {
  const [declare, ...lines] = functionLines
  const declareComponents = getComponents(declare.trim())
  if (!declareComponents.doesStartWithKeyword) return
  if (declareComponents.keyword !== "안물") return
  const [name, ...args] = declareComponents.values
  if (!name) throw new Error("안물함수이름")
  localVariables[name] = {}
  const functionComponents: string[] = [`([${args.map((arg) => `${arg},`).join(" ")}]) => {`]
  for (const line of lines) {
    const lineComponents = getComponents(line)
    if (!lineComponents.doesStartWithKeyword) return
    if (lineComponents.keyword === "어쩔" || lineComponents.keyword === "저쩔") {
      const [varName, ...varValue] = lineComponents.values
      if (varValue[0] === "ㅌㅂ") {
        functionComponents.push(
          `localVariables.${name}.${varName} = input("${varValue.join(" ").trim()}")`
        )
      } else {
        const value = varValue.join(" ").trim()
        functionComponents.push(
          `localVariables.${name}.${varName} = ${
            isPureNumber(value) // todo: number to string
              ? toNumber(value)
              : localVariables[name][value] ?? variables[value] ?? 0
          }`
        )
        localVariables[name][varName] = `${
          isPureNumber(value)
            ? toNumber(value)
            : localVariables[name][value] ?? variables[value] ?? 0
        }`
      }
    } else if (lineComponents.keyword === "ㅇㅉ") {
      functionComponents.push(
        `console.log(String(${lineComponents.values
          .map((value) =>
            args.includes(value)
              ? value
              : `"${
                  !isPureNumber(value)
                    ? localVariables[name][value] ?? getVariable(value)
                    : toNumber(value)
                }"`
          )
          .join(",")}))`
      )
    } else if (lineComponents.keyword === "ㅌㅂ") {
      functionComponents.push(`input("${lineComponents.values.join(" ")}`)
    }
  }
  functionComponents.push("}")
  localVariables[name] = {}
  subRoutines[name] = eval(functionComponents.join("\n"))
}

const conditionOperator = (line: string) => {
  const components = getComponents(line)
  if (!components.doesStartWithKeyword) return
  if (components.keyword !== "화났쥬?") return
  let [condition, isTrue, ...values]: string[] = components.values
  const conditionValue = getVariable(condition)
  if (String(conditionValue) === "0") {
    if (isTrue === "킹받쥬?") {
      run([values.join(" ")])
    } else {
      throw new Error("어쩔조건")
    }
  } else {
    return
  }
}

const declareVariable = (line: string) => {
  const components = getComponents(line)
  if (!components.doesStartWithKeyword) return
  if (components.keyword !== "어쩔") return
  const [name, first, ...values] = components.values
  if (!name || name.length <= 0 || statements.includes(name) || isPureNumber(name))
    throw new Error("어쩔변수이름")
  let allocatingValue = ""
  if (first) {
    if (first === "ㅌㅂ") {
      const inputValue = input(first + values.join(" "))
      if (inputValue) allocatingValue = inputValue
    } else if (isPureNumber(first)) {
      allocatingValue = String(toNumber(first + values.join(" ")))
    } else {
      allocatingValue = "0"
    }
  } else {
    allocatingValue = "0"
  }
  variables[name] = allocatingValue
}

const assignVariable = (line: string) => {
  const components = getComponents(line)
  if (!components.doesStartWithKeyword) return
  if (components.keyword !== "저쩔") return
  const [name, ...values] = components.values
  if (!name || name.length <= 0) throw new Error("어쩔변수")
  const doesVariableExist = getVariable(name)
  if (doesVariableExist === null) throw new Error("어쩔변수")
  let value = ""
  if (name === "ㅌㅂ") {
    const inputValue = input("ㅌㅂ" + values.join(" ").trim())
    if (inputValue) value = inputValue
  } else {
    value = String(toNumber(values.join(" ").trim()))
  }
  variables[name] = value
}

const toNumber = (line: string) => {
  const pluses = line.split("").filter((v) => v === "ㅋ").length
  const minuses = line.split("").filter((v) => v === "ㅎ").length
  return pluses - minuses
}

const print = (line: string) => {
  const components = getComponents(line)
  if (!components.doesStartWithKeyword) return
  if (components.keyword !== "ㅇㅉ") return
  console.log(components.values.map((v) => getVariable(v)).join(" "))
}

const input = (line: string) => {
  const components = getComponents(line)
  if (!components.doesStartWithKeyword) return
  if (components.keyword !== "ㅌㅂ") return
  const inputUser = ReadLine.question(components.values.join(" ") + "\n", { encoding: "utf-8" })
  return inputUser
}

program.parse()

const targetFilePath = path.join(process.cwd(), program.args.join(" "))
if (!fs.existsSync(targetFilePath)) {
  throw new Error("어쩔파일")
}
const codes = fs.readFileSync(targetFilePath)
execute(codes.toString("utf-8"))