const tmi = require('tmi.js');
const eventHandler = require('.\\handlers.js');
const enc = require('.\\crypt.js')
const opt = require('.\\bot_options.json')
const concomands = require('.\\concomands.js')
const net = require('net')
const fs = require('fs')
let readline = require('readline')


let passed_messages =0;
let current_timer = 0;
let setted_timer = false;

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

const options_pinger = {
    options: {
        debug:false,
    },
    connection: {
        reconnect: true,
    },
    channels: ['wmuga','iarspider','cwelth','nuriksakura','twistr_game','moar__','prayda_alpha','babytigeronthesunflower','jon_cs','rustamdobryi','womens_games','kochetov2000','mr_alfa44','owlsforever'],
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

function pingerHandler(channel, userstate, message, self)
{
	eventHandler.pingerHandler(channel, userstate, message,connection);
}
client.addListener("message",messageHandler);
pinger.addListener("message",pingerHandler);


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

let coninput = readline.createInterface({
	input:process.stdin,
	output:process.stdout
});

coninput.on('line', (input) =>{
	concomands.handler(input);
})