import { IBot } from "./interfaces/IBot";
import { Bot } from "./classes/Bot";
import fs from 'fs'
import path from "path";
import { BotOptions } from "./Types/BotOptions";

const botOptionsFile = fs.readFileSync(path.join(process.cwd(),'bot_options.json'))
const botOptionsData = JSON.parse(botOptionsFile.toString())

let bot:IBot = new Bot(botOptionsData as BotOptions)

console.log("Bot started")