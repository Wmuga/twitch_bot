import { IBot } from "./interfaces/IBot";
import { Bot } from "./classes/Bot";

let bot:IBot = new Bot({
  identity:{
    name:"wmuga_bot",
    oauth:"oauth:2mkvltkng75mazi5nftivd3vnu7kzk",
  },
  channel:"#wmuga"
})

console.log("Bot started")