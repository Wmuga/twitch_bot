const tmi = require('tmi.js');
const eventHandler = require('.\\handlers.js');
const enc = require('.\\crypt.js')
const opt = require('.\\bot_options.json')
const concomands = require('.\\concomands.js')
const net = require('net')
const http = require('http')
const twitch_api = require('.\\twitch_requests')
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

let listening_channels = ['wmuga','iarspider','cwelth','nuriksakura','twistr_game','moar__','prayda_alpha','babytigeronthesunflower','jon_cs','rustamdobryi','womens_games','kochetov2000','mr_alfa44','owlsforever'];

const options_pinger = {
    options: {
        debug:false,
    },
    connection: {
        reconnect: true,
    },
    channels: listening_channels,
};

console.log('Awaiting client connection');

let connection = null;

const client = new tmi.Client(options_bot);
const pinger = new tmi.Client(options_pinger);

client.connect();
pinger.connect();


client.on('connected',(address,port) =>{
	console.log("Successfully connected client");
});

client.on('join',(channel,username) =>{
	if(connection) connection.write('ujc'+username+opt.tcp_message_splitter);
});
	
client.on('part',(channel,username) =>{
	if(connection) connection.write('upc'+username+opt.tcp_message_splitter);
});

pinger.on('connected',(address,port) =>{
	console.log("Successfully connected pinger");
});

client.on('raided',(channel, username, viewers) => {
    eventHandler.raidHandler(channel, username, viewers,client)
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

function pingerHandler(channel, userstate, message, self)
{
	if (opt.listen.includes(channel.slice(1))) console.log(eventHandler.getmessage(channel,userstate,message));
	eventHandler.pingerHandler(channel, userstate, message,connection);
}
client.addListener("message",messageHandler);
pinger.addListener("message",pingerHandler);

//Custom events 

async function check_follows(){
	while (true){
		await new Promise(resolve => setTimeout(resolve,1000));
		let new_follower = await twitch_api.get_new_follow(164555591);
		if (new_follower!='') client.say('#wmuga',`@${new_follower}, спасибо за фоллоу!`);
	}
}

async function check_streams(){
	while (true){
		for(let name in listening_channels){
			name = listening_channels[name].slice(1);
			if (name!='wmuga'){
				let info = await twitch_api.get_stream_info(name);
				if (info.data.length!=0) eventHandler.test_new_translation(name);
				else eventHandler.remove_translation(name);
			}
			await new Promise(resolve => setTimeout(resolve,500));
		}
		await new Promise(resolve => setTimeout(resolve,5000));
	}
}

check_follows();
check_streams();

//socket server
let server = net.createServer(function(socket){
	connection = socket;
	console.log('Connection established');
	connection.on('error',(error)=> {
		connection=null;
		console.log('Connection closed: ' + error);
});
	eventHandler.sendAllOnline(connection);
});

server.listen(6555);


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
	console.log('Request to '+ req.url)
	res.setHeader('Content-Type','application/json');
	res.setHeader('Access-Control-Allow-Origin','*')
	switch (req.url){
		case '/config':
			res.writeHead(200);
			const config_file = require('.\\overlay\\config.json');
			res.end(JSON.stringify(config_file));
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