const tmi = require('tmi.js');
const eventHandler = require('.\\handlers.js');
const enc = require('.\\crypt.js')
const opt = require('.\\bot_options.json')
const concomands = require('.\\concomands.js')
let readline = require('readline');


let passed_messages =0;
let current_timer = 0;
let setted_timer = false;

//bot stuff
const options_bot = {
    options: {
        debug:false,
    },
    connection: {
        reconnect: true,
    },
    identity: {
        username: 'wmuga_bot',
        password: 'oauth:' + enc.encode(opt.enc_oauth,Number(process.argv[2])),
    },
    channels: ['wmuga'],
};

console.log('Awaiting client connection');


const client = new tmi.Client(options_bot);


client.connect();
eventHandler.set_token_updater()
eventHandler.resolve_music_requests()
eventHandler.setup_db(client)

client.on('connected',(address,port) =>{
	console.log("Successfully connected client");
});

client.on('join',(channel,username)=>{
	if (username.toLowerCase()=='cain__') eventHandler.play_alarm()
})


client.on('hosted',(channel, username, viewers, autohost) => {
    console.log(username + ' hosted with ' + viewers + ' ' + autohost);
});

function messageHandler(channel, userstate, message, self){
	if (userstate.username!='wmuga_bot') {
		if (channel == '#wmuga'){
			passed_messages+=1;
			eventHandler.messageHandler(channel, userstate, message, client);
			if (!setted_timer){
				setted_timer=true;
				setTimeout(() =>{
					setted_timer=false;
					if (passed_messages>4){
						current_timer=(current_timer+1)%opt.timer_messages.length;
						if (current_timer == 2 && !eventHandler.isReq) current_timer = (current_timer+1)%opt.timer_messages.length
						passed_messages=0;
						client.say(channel,opt.timer_messages[current_timer]);
					}
				},360000)
			}
		}
	}
}


client.addListener("message",messageHandler);

//interractive console
let coninput = readline.createInterface({
	input:process.stdin,
	output:process.stdout
});

coninput.on('line', (input) =>{
	let response = concomands.handler(input);
	console.log(response);
	if (response){
		switch(response[0]){
			default:
				break;
			case 'listen':
				opt['listen'].push(response[1]);
				break;
			case 'stop_listen':
				opt['listen'] = opt['listen'].filter(elem => elem!=response[1]);
				break;	
			case 'send':{
				let sent_channel = '#'+response[1];
				if (sent_channel !='#wmuga'){
					client.join(sent_channel).then(() => {
					client.say(sent_channel,response[2]);
					client.part(sent_channel);
					});
				}
				else{
					client.say(sent_channel,response[2]);
				}
				break
			}
			case 'chat':
				eventHandler.pass_chat_data(response[1])
				break
			case 'db-update':
				eventHandler.set_points_viewer(response[1],response[2])
				break
			case 'db-get':
				eventHandler.get_points_all()
				break		
		}
	}
})