/////////////////////
// Generate Chat UI //
/////////////////////

// Inject css

let styles = document.createElement("link");
styles.href = "./css/main.css";
styles.type = "text/css";
styles.rel = "stylesheet";
document.getElementsByTagName("head")[0].appendChild(styles);

// chat header
let chatHeader = document.createElement("div");
chatHeader.className = "chat-header";
let hideDiv = document.createElement("div");
hideDiv.className = "hide"
let hideText = document.createElement("h4");
hideText.innerHTML = "v hide";
hideText.setAttribute("onclick", "toggleChat()");
let showDiv = document.createElement("div");
showDiv.className = "show";
let showText = document.createElement("h4");
showText.innerHTML= "^ show";
showText.setAttribute("onclick", "toggleChat()");
let closeDiv = document.createElement("div");
closeDiv.className = "close";
let closeText = document.createElement("h4");
closeText.innerHTML= "close X";
closeText.setAttribute("onclick", "closeChat()");
hideDiv.appendChild(hideText);
showDiv.appendChild(showText);
closeDiv.appendChild(closeText);
chatHeader.appendChild(hideDiv);
chatHeader.appendChild(showDiv);
chatHeader.appendChild(closeDiv);

// chat container
let chatContainer = document.createElement("div");
chatContainer.className = "chat-container";
let messageBoard = document.createElement("div");
messageBoard.id = "messageBoard";
messageBoard.className = "conversation";
let form = document.createElement("form");
form.className = "chat-form";
form.setAttribute("onsubmit", "handleChat(event)");
let input = document.createElement("input");
// Set multiple attributes
function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
};
setAttributes(input, {
  "id": "message",
  "class": "chat-input",
  "type": "text",
  "size": "40",
  "placeholder": "Type your message here"
});
let button = document.createElement("button");
setAttributes(button, {
  "value": "submit",
  "class": "send"
});
button.innerHTML = "Send";
form.appendChild(input);
form.appendChild(button);
chatContainer.appendChild(messageBoard);
chatContainer.appendChild(form);

// Chat wrapper
let chatWrapper = document.createElement("div");
chatWrapper.id = "chatWrapper"
chatWrapper.className = "chat-wrapper";
chatWrapper.appendChild(chatHeader);
chatWrapper.appendChild(chatContainer);

// Open chat
let govbotText = document.createElement("h2");
govbotText.className = "govbot-text";
govbotText.innerHTML = "Need help? Chat to GovBot";
govbotText.setAttribute("onclick", "openChat()");

// Add govbot text and chat ui to display
////////////////////////////
// JS ONLY FOR TEST DEMO //
///////////////////////////
let cta = document.getElementsByClassName("call-to-action")[0];
let col = document.getElementsByClassName("column-two-thirds")[0];
if (document.body.contains(cta)) {
  cta.appendChild(govbotText);
} else if (document.body.contains(col)) {
  col.appendChild(govbotText);
} else {
  document.body.appendChild(govbotText);
}
///////////////////////////////
// END JS ONLY FOR TEST DEMO //
//////////////////////////////
// document.body.appendChild(govbotText);
document.body.appendChild(chatWrapper);


/////////////////////
// Lex initializer //
/////////////////////

// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'eu-west-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-1:5845afc5-208c-482d-b6c4-475f3751dd4a',
});

var lexruntime = new AWS.LexRuntime();
var lexUserId = 'chatbot-demo' + Date.now();
var sessionAttributes = {};

//////////////////////////
// Chat window handlers //
//////////////////////////

function openChat() {
  let message =  document.getElementById("message");
  message.disabled = true;
  let messageBoard = document.getElementById('messageBoard');
  messageBoard.innerHTML = '';
  let chatWrapper = document.getElementById("chatWrapper");
  chatWrapper.style.display = "block";
  chatWrapper.style.bottom = "0";
  let show = document.getElementsByClassName("show")[0];
  let hide = document.getElementsByClassName("hide")[0];
  hide.style.display = "inline-block";
  show.style.display = "none";
  worm();
  botWelcome("Hi, I'm GovBot!");
  setTimeout(function() {worm()}, 100);
  setTimeout(function(){botWelcome("I might not be human, but I can do some pretty helpful stuff.")}, 1000);
  setTimeout(function() {worm()}, 1100);
  setTimeout(function(){botWelcome("What are you looking for?")}, 2000);
  setTimeout(function(){ message.disabled = false}, 2000);
  govbotText.setAttribute("onclick", "toggleChat()");

};

function toggleChat() {
  let chatWrapper = document.getElementById("chatWrapper");
  let show = document.getElementsByClassName("show")[0];
  let hide = document.getElementsByClassName("hide")[0];
  if (hide.style.display === "none") {
    chatWrapper.classList.remove("hide-chat");
    chatWrapper.style.bottom = "0"
    hide.style.display = "inline-block";
    show.style.display = "none";
  } else {
    chatWrapper.classList.add("hide-chat");
    chatWrapper.style.bottom = "-460px";
    hide.style.display = "none";
    show.style.display = "inline-block";
  }
};

function closeChat() {
  let chatWrapper = document.getElementById("chatWrapper")
  chatWrapper.style.display = "none";
  govbotText.setAttribute("onclick", "openChat()");
  sessionStorage.clear();
};

////////////////////////////
// Welcom message handler //
////////////////////////////

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

//////////////////
// Loading worm //
//////////////////

function worm() {
  let messageBoard = document.getElementById('messageBoard');
  messageBoard.insertAdjacentHTML('beforeend', '<p id="worm" class="bot-typing"><span class="dot"></span><span class="dot dot-two"></span><span class="dot dot-three"></span></p>');
}

//////////////////////
// Message handlers //
//////////////////////

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
      ////////////////////////////
      // JS ONLY FOR TEST DEMO //
      ///////////////////////////
      if (json.response.response.link === 'https://manage-apprenticeships.service.gov.uk/') {
        botPara.id = json.response.response.link_id;
        botPara.setAttribute('href', 'manage-apprenticeships.html');
        botPara.addEventListener('click', storeChat);
        botPara.addEventListener('click', function(){pushChat('next step')});
      } else if (json.response.response.link === 'https://findapprenticeshiptraining.sfa.bis.gov.uk/Apprenticeship/Search') {
        botPara.id = json.response.response.link_id;
        botPara.setAttribute('href', 'find-training.html');
        botPara.addEventListener('click', storeChat);
      } else if (json.response.response.link === 'https://www.gov.uk/take-on-an-apprentice/apprenticeship-agreement') {
        botPara.id = json.response.response.link_id;
        botPara.setAttribute('href', 'apprenticeship-agreement.html');
        botPara.addEventListener('click', storeChat);
      } else {
        botPara.id = json.response.response.link_id;
        botPara.setAttribute('target', '_blank');
        botPara.setAttribute('href', json.response.response.link);
        if (botPara.id === 'next-step-2') {
          botPara.addEventListener('click', function(){pushChat('next step two')});
        } else if (botPara.id === 'next-step-3') {
          botPara.addEventListener('click', function(){pushChat('next step three')});
        };
      }
      ///////////////////////////////
      // END JS ONLY FOR TEST DEMO //
      //////////////////////////////
      // botPara.setAttribute('href', json.response.response.link)
      botPara.appendChild(document.createTextNode(json.response.response.text));
      messageBoard.appendChild(botPara);
      botPara.scrollIntoView();
    } else if (json.response.type === "redirect") {
      window.open(json.response.response, '_blank');
    } else if (json.response.type === "button_list") {
      json.response.response.forEach(function(response) {
        let botPara = document.createElement("a");
        let bot = document.createElement("p");
        botPara.className = 'bot-message btn';
        ////////////////////////////
        // JS ONLY FOR TEST DEMO //
        ///////////////////////////
        if (response.link === 'https://manage-apprenticeships.service.gov.uk/') {
          botPara.id = response.link_id;
          botPara.setAttribute('href', 'manage-apprenticeships.html');
          botPara.addEventListener('click', storeChat);
        } else if (response.link === 'https://findapprenticeshiptraining.sfa.bis.gov.uk/Apprenticeship/Search') {
          botPara.id = response.link_id;
          botPara.setAttribute('href', 'find-training.html');
          botPara.addEventListener('click', storeChat);
        } else if (response.link === 'https://www.gov.uk/take-on-an-apprentice/apprenticeship-agreement') {
          botPara.id = response.link_id;
          botPara.setAttribute('href', 'apprenticeship-agreement.html');
          botPara.addEventListener('click', storeChat);

        } else {
          botPara.id = response.link_id;
          botPara.setAttribute('href', response.link);
          botPara.setAttribute('target', '_blank');
          if (botPara.id === 'next-step-2') {
            botPara.addEventListener('click', function(){pushChat('next step two')});
          } else if (botPara.id === 'next-step-3') {
            botPara.addEventListener('click', function(){pushChat('next step three')});
          };
        }
        ///////////////////////////////
        // END JS ONLY FOR TEST DEMO //
        //////////////////////////////
        // botPara.setAttribute('href', response.link)
        botPara.appendChild(document.createTextNode(response.text));
        messageBoard.appendChild(botPara);
        botPara.scrollIntoView();
      });
    }
  } else {
    var messages = lexResponse.message.split(" \\n ");
    messages.forEach(function(message) {
      let botPara = document.createElement("p");
      botPara.className = 'bot-message';
      botPara.appendChild(document.createTextNode(message));
      messageBoard.appendChild(botPara);
      botPara.scrollIntoView();
    });
  }
};

////////////////////////////
// WINDOW SESSION STORAGE //
///////////////////////////
function storeChat() {
  let chat = document.getElementById('messageBoard');
  sessionStorage.setItem('chat_history', chat.innerHTML);
}

window.onload = function () {
  if (sessionStorage.getItem('chat_history')) {
    let chatWrapper = document.getElementById("chatWrapper");
    chatWrapper.style.display = "block";
    chatWrapper.style.bottom = "0";
    let show = document.getElementsByClassName("show")[0];
    let hide = document.getElementsByClassName("hide")[0];
    hide.style.display = "inline-block";
    show.style.display = "none";
    let chat = sessionStorage.getItem('chat_history');
    messageBoard.innerHTML = chat;
    if (messageBoard.lastChild.id === "next-step-1") {
      pushChat('next step');
    } else if (messageBoard.lastChild.id === "next-step-2") {
      pushChat('next step two');
    } else if (messageBoard.lastChild.id === "next-step-3") {
      pushChat('next step three');
    } else if (messageBoard.lastChild.id === "next-step-4") {
      pushChat('next step four');
    }
    messageBoard.lastChild.scrollIntoView();
  }
}
