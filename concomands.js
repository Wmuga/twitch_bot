function concomandshandler(input){
	let splitted_command = input.split(' ').filter(part => part.length>0);
	splitted_command[0] = splitted_command[0].toLowerCase()
	switch(splitted_command[0]){
		default:
			console.log('Неверная команда');
			return	
		case 'send':
			return [splitted_command[0],splitted_command[1],splitted_command.splice(2).join(" ")];	
		case 'chat':
		case 'db-update':
		case 'db-get':	
			return splitted_command
	}
}

module.exports.handler = concomandshandler;