const tmi = require('tmi.js');
const eventHandler = require('.\\handlers.js');
const enc = require('.\\crypt.js')
const opt = require('.\\bot_options.json')
const net = require('net')

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

var connection = null;

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

	function messageHandler(channel, userstate, message, self){
		eventHandler.messageHandler(channel, userstate, message, client);
	}

	function pingerHandler(channel, userstate, message, self)
	{
		eventHandler.pingerHandler(channel, userstate, message,connection);
	}
	client.addListener("message",messageHandler);
	pinger.addListener("message",pingerHandler);

var server = net.createServer(function(socket){
	connection = socket;
	console.log('Connection established');
	connection.on('error',(error)=> {
		connection=null;
		console.log('Connection closed: ' + error);
});
	eventHandler.sendAllOnline(connection);
});

server.listen(6555);
