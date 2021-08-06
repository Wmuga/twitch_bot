const fs = require('fs')
let opt = require('.\\bot_options.json');

function concomandshandler(input){
	let splitted_command = input.split(' ').filter(part => part.length>0);
	splitted_command[0] = splitted_command[0].toLowerCase()
	switch(splitted_command[0]){
		default:
			console.log('Неверная команда');
			return
		case 'greeting':
			opt.custom_greetings[splitted_command[1]] = splitted_command.splice(2).join(" ");
			fs.writeFileSync('bot_options.json',JSON.stringify(opt));
			console.log('Добавлено');
			break;
		case 'add_timer':
			opt.timer_messages.push(splitted_command.splice(1).join(" "));
			fs.writeFileSync('bot_options.json',JSON.stringify(opt));
			console.log('Добавлено');
			break;
		case 'listen':
		case 'stop_listen':
			console.log('Переключаю слушание ' + splitted_command[1]);
			return splitted_command;	
		case 'send':
			return [splitted_command[0],splitted_command[1],splitted_command.splice(2).join(" ")];	
		case 'chat':
		case 'db-update':
		case 'db-get':	
			return splitted_command
	}
}

module.exports.handler = concomandshandler;