var net = require("net");
var parseArgs = require("minimist");
var readline = require("readline");
var vimrl = require("vimrl");

var argv = parseArgs(process.argv.slice(2));
var user = argv["u"];
var host = argv["h"];
var port = argv["p"];

if (!user)
	console.log("Erro: usuário esperado com argumento -u.");	

if (!port)
	console.log("Erro: porta não especificada com argumento -p");

if (!port || !user)
	return;

if (!host){
	console.log("Host não especificado (-h), usar localhost");
	host = "localhost";
}

var socket = net.connect(port,host,
	function() {
		socket.setKeepAlive(true);
		socket.on("error", function (err) { console.log(err) })		
		socket.on("data", handleServerResponse);
		socket.write("A:" + user, "utf8", end);					
	});


socket.on('close', function() {
	socket.end();
	console.log('Sessão encerrada');
	process.exit();	
});

function keepAliveConnection(){
	if (socket){
		socket.write("B:", "utf8", end);
	}
}

var buffer= "";
function handleServerResponse(chunk){	
	buffer += chunk.toString();
	if (buffer.indexOf("\n") < 0)
		return;

	var data = buffer.trim();
	buffer = "";

	//console.log(data);

	if (data == "okA"){
		console.log("Usuário registrado.");
		setInterval(keepAliveConnection, 10000);
		socket.write("C:", "utf8", end);
		
	}
	else if (data == "okB"){
		//console.log("keep-alive.");
	}
	else if (data == "okD"){
		console.log("mensagem enviada.");
	}
	else {		
		var indexof = data.indexOf(":FIM");
		if (indexof >= 0){
			var msg_received = data.split(":");
			var s = " %s";
			var placeholder = new Array(msg_received.length - 1).join(s);
			console.log("Usuários conectados:" + placeholder, msg_received.slice(0, msg_received.length - 1));
			startReadFromInput();
		} else {
			var msg_received = data.split("::");
			console.log("%s disse: %s", msg_received[0], msg_received[1]);
		}		
	}
}

function end(){
	socket.write("\r\n");
}

function startReadFromInput(){
	
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question("Message To? ", function(receiver){
		var user = receiver;
		console.log("\n To: %s \n", user);
		rl.question("Write message body: ", function(msg) {			
			console.log("\n Body: %s \n", msg);
			socket.write("D:" + user + ":" + msg, end);
			rl.close();
			startReadFromInput();
		});		
	})
	/*
	var normalPrompt = 'prompt > ';
	var insertPrompt = 'prompt x ';
	var readline = vimrl({
	    normalPrompt: normalPrompt,
	    insertPrompt: insertPrompt
	}, function(line) {
	    console.log('\ngot line: ' + line);
	});

	// you have to pass inputs to vimrl manually
	process.stdin.setRawMode(true);
	process.stdin.on('readable', function() {
	    var input = process.stdin.read();
	    readline.handleInput(input);
	});
*/
}
