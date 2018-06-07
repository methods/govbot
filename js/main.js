
function handleChat(event) {

  event.preventDefault();

  let message =  document.getElementById("message");
  let messageBoard = document.getElementById("messageBoard");
  let messagePara = document.createElement("p");
  let botPara = document.createElement("p");
  let userDisplay = document.createElement("p");
  userDisplay.className = "user"
  messagePara.className = "user-message";
  botPara.className = "bot-message";
  if (message && message.value && message.value.trim().length > 0) {
    pushChat(message.value);
    messagePara.appendChild(document.createTextNode(message.value));
    userDisplay.appendChild(document.createTextNode("You"));
    messageBoard.appendChild(userDisplay);
    messageBoard.appendChild(messagePara);
    message.value = '';
  };

  messagePara.scrollIntoView();
  botPara.scrollIntoView();
};

function worm() {
  let messageBoard = document.getElementById('messageBoard');
  messageBoard.insertAdjacentHTML('beforeend', '<p id="worm" class="bot-typing"><span class="dot"></span><span class="dot dot-two"></span><span class="dot dot-three"></span></p>');
}

function botWelcome(message) {
  let worm = document.getElementById('worm');
  worm.remove();
  let messageBoard = document.getElementById('messageBoard');
	let botPara = document.createElement("P");
  let bot = document.createElement("p");
	botPara.className = 'bot-message';
  bot.className = "bot";
  bot.appendChild(document.createTextNode("GovBot"));
  botPara.appendChild(document.createTextNode(message));
  messageBoard.appendChild(bot);
  messageBoard.appendChild(botPara);
}

function openChat() {
  let message =  document.getElementById("message");
  message.disabled = true;
  let messageBoard = document.getElementById('messageBoard');
  messageBoard.innerHTML = '';
  let chatWrapper = document.getElementById("chatWrapper");
  chatWrapper.style.display = "block";
  worm();
  botWelcome("Hi, I'm GovBot!");
  setTimeout(function() {worm()}, 100);
  setTimeout(function(){botWelcome("I might not be human, but I can do some pretty helpful stuff.")}, 1000);
  setTimeout(function() {worm()}, 1100);
  setTimeout(function(){botWelcome("What are you looking for?")}, 2000);
  setTimeout(function(){ message.disabled = false}, 2000);
};

function toggleChat() {
  let chatWrapper = document.getElementById("chatWrapper");
  let show = document.getElementsByClassName("show")[0];
  let hide = document.getElementsByClassName("hide")[0];
  if (hide.style.display === "inline-block") {
    chatWrapper.classList.add("hide-chat");
    hide.style.display = "none";
    show.style.display = "inline-block";
  } else {
    chatWrapper.classList.remove("hide-chat");
    hide.style.display = "inline-block";
    show.style.display = "none";
  }
};

function closeChat() {
  let chatWrapper = document.getElementById("chatWrapper")
  chatWrapper.style.display = "none";
  chatWrapper.style.bottom = "0";
};


// Initialize the Amazon Cognito credentials provider

AWS.config.region = 'eu-west-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-1:5845afc5-208c-482d-b6c4-475f3751dd4a',
});

var lexruntime = new AWS.LexRuntime();
var lexUserId = 'chatbot-demo' + Date.now();
var sessionAttributes = {};

function pushChat(message) {
		// send it to the Lex runtime
		var params = {
			botAlias: '$LATEST',
			botName: 'ApprenticeshipsBot',
			inputText: message,
			userId: lexUserId,
			sessionAttributes: sessionAttributes
		};
		lexruntime.postText(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				showError('Error:  ' + err.message + ' (see console for details)')
			}
			if (data) {
				// capture the sessionAttributes for the next cycle
				sessionAttributes = data.sessionAttributes;
				// show response and/or error/dialog status
				showResponse(data);
			}
		});
	// we always cancel form submission
	return false;
}

function showResponse(lexResponse) {
  worm();
  setTimeout(function(){
    handleResponse(lexResponse)
  }, 3000);
	messageBoard.scrollTop = messageBoard.scrollHeight;
}

function handleResponse(lexResponse) {
  let worm = document.getElementById('worm');
  worm.remove();
  console.log(lexResponse);

  let messageBoard = document.getElementById('messageBoard');
  let bot = document.createElement("p");
  bot.className = "bot";
  messageBoard.appendChild(bot);
  bot.appendChild(document.createTextNode("GovBot"));
  if (lexResponse.message[0] === "{") {
    var json = JSON.parse(lexResponse.message);
    if (json.messages != null) {
      if (Array.isArray(json.messages)) {
        json.messages.forEach(function(message) {
          let botPara = document.createElement("p");
          botPara.className = 'bot-message';
          botPara.appendChild(document.createTextNode(message));
          messageBoard.appendChild(botPara);
          botPara.scrollIntoView();
        })
      } else {
        let botPara = document.createElement("p");
        botPara.className = 'bot-message';
        botPara.appendChild(document.createTextNode(json.messages));
        messageBoard.appendChild(botPara);
        botPara.scrollIntoView();
      };
    }
    if (json.response.type === "intent_button_list") {
      json.response.response.forEach(function(response) {
        let botPara = document.createElement("p");
        let bot = document.createElement("p");
        botPara.className = 'bot-message button-list';
        botPara.addEventListener('click', function(){pushChat(response)});
        botPara.appendChild(document.createTextNode(response));
      	messageBoard.appendChild(botPara);
        botPara.scrollIntoView();
      });
    } else if (json.response.type === "button") {
      let botPara = document.createElement("a");
      let bot = document.createElement("p");
      botPara.className = 'bot-message btn';
      botPara.addEventListener('click', function(){pushChat(json.response.response.text)});
      botPara.setAttribute('href', json.response.response.link);
      botPara.appendChild(document.createTextNode(json.response.response.text));
      messageBoard.appendChild(botPara);
      botPara.scrollIntoView();
    } else if (json.response.type === "redirect") {
      console.log(lexResponse);
    } else if (json.response.type === "button_list") {
      json.response.response.forEach(function(response) {
        let botPara = document.createElement("a");
        let bot = document.createElement("p");
        botPara.className = 'bot-message btn';
        botPara.addEventListener('click', function(){pushChat(response.text)});
        botPara.setAttribute('href', response.link);
        botPara.appendChild(document.createTextNode(response.text));
        messageBoard.appendChild(botPara);
        botPara.scrollIntoView();
      });
    }
  } else {
    let botPara = document.createElement("p");
    botPara.className = 'bot-message';
    botPara.appendChild(document.createTextNode(lexResponse.message));
    messageBoard.appendChild(botPara);
    botPara.scrollIntoView();
  }
};
