import { Bot } from "./classes/Bot";
import fs from 'fs'
import path from "path";
import { BotOptions } from "./Types/BotOptions";
import { Container } from "./classes/DIContainer";
import { IMusicProvider } from "./interfaces/IMusicProvider";
import { YoutubeMusic } from "./classes/YoutubeModule";
import { IUserInterface } from "./interfaces/IUserInterface";
import { ConsoleModule } from "./classes/ConsoleModule";
import { IDatabaseModule } from "./interfaces/IDatabaseModule";
import { SqliteDatabase } from "./classes/SqliteDatabase";
import { WebUIModule } from "./classes/WebUIModule";

const botOptionsFile = fs.readFileSync(path.join(process.cwd(),'bot_options.json'))
const botOptionsData = JSON.parse(botOptionsFile.toString()) as BotOptions

if (botOptionsData.youtube){
  Container.addSingleton<IMusicProvider>('yt',new YoutubeMusic(botOptionsData.youtube))
}
Container.addSingleton<Array<IUserInterface>>('uiar', [
  new ConsoleModule(),  
  new WebUIModule(botOptionsData.uiPort),
]);
Container.addSingleton<IDatabaseModule>('database', new SqliteDatabase());

let bot:Bot = new Bot(botOptionsData)

console.log("Bot started")