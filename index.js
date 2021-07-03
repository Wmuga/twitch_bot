const tmi = require('tmi.js');
const eventHandler = require('.\\handlers.js');
const enc = require('.\\crypt.js')
const opt = require('.\\bot_options.json')
const concomands = require('.\\concomands.js')
const http = require('http')
const twitch_api = require('.\\twitch_requests')
let readline = require('readline');
const { set_token_updater } = require('./spotify_module.js');


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

client.on('connected',(address,port) =>{
	console.log("Successfully connected client");
});


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
	if (response[0]){
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
			}	
		}
	}
})

//HTTP server for sending config to overlay

const http_server_listener = function(req,res){
	res.setHeader('Content-Type','application/json')
	res.setHeader('Access-Control-Allow-Origin','*')
	switch (req.url){
		case '/config':
			res.writeHead(200);
			const config_file = require('.\\overlay\\config.json')
			res.end(JSON.stringify(config_file));
			break;
		case '/requests':
			res.writeHead(200);
			res.end(JSON.stringify(eventHandler.currently_playing()))
			break;
		default:
			res.writeHead(404);
            res.end(JSON.stringify({error:"Resource not found"}))
			break;
	}
	res.end();
}

const http_server = http.createServer(http_server_listener);
http_server.listen(6556,'localhost',()=>{
	console.log('HTTP server on localhost:6556 is running')
});

//setInterval(eventHandler.resolve_music_requests,1000)
eventHandler.resolve_music_requests()