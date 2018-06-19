(function($) {
  const BOT_MESSAGE = 'botMessage';
  const USER_MESSAGE = 'userMessage';

  var ChatBot = function(pageHead, existingConversation) {
    this.pageHead = pageHead;
    this.existingConversation = existingConversation;
    this.setup();
  }

  ChatBot.prototype = {
    setup: function() {
      console.log('setting up the message board');
      this.initialiseLex();
      this.injectCSS();
      this.createUI();
      this.addCallToAction();
      if (this.existingConversation) {
        this.openBot();
      }
    },

    initialiseLex: function() {
      AWS.config.region = 'eu-west-1'; // Region
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: 'eu-west-1:5845afc5-208c-482d-b6c4-475f3751dd4a',
      });
      this.lexruntime = new AWS.LexRuntime();
      this.lexUserId = 'chatbot-demo' + Date.now();
      this.sessionAttributes = {};
    },

    injectCSS: function() {
      let styles = document.createElement("link");
      styles.href = "./css/main.css";
      styles.type = "text/css";
      styles.rel = "stylesheet";
      this.pageHead.appendChild(styles);
    },

    createUI: function() {
      this.createChatWrapper();
      this.createChatHead();
      this.createChatBody();
    },

    createChatWrapper: function() {
      chatWrapper = document.createElement("div");
      chatWrapper.id = "chatWrapper"
      chatWrapper.className = "chat-wrapper";
      document.body.appendChild(chatWrapper);
      this.chatWrapper = $('#chatWrapper')[0];
    },

    createChatHead: function() {
      this.chatHead = new ChatHead(this.chatWrapper, this.collapseExpand.bind(this), this.close.bind(this));
    },

    createChatBody: function() {
      this.chatBody = new ChatBody(this.chatWrapper, this.existingConversation, this.handleInput.bind(this));
    },

    addCallToAction: function() {
      this.cta = document.createElement("h2");
      this.cta.className = "govbot-text";
      this.cta.innerHTML = "Need help? Chat to GovBot";
      let currentCTA = document.getElementsByClassName("call-to-action")[0];
      let col = document.getElementsByClassName("column-two-thirds")[0];
      if (document.body.contains(currentCTA)) {
        currentCTA.appendChild(this.cta);
      } else if (document.body.contains(col)) {
        col.appendChild(this.cta);
      } else {
        document.body.appendChild(this.cta);
      }
      this.startCTAWatcher();
    },

    startCTAWatcher: function() {
      let that = this;
      $(this.cta).click(function() {
        that.openBot();
      })
    },

    openBot: function() {  
      $(this.chatWrapper).show();
      this.chatBody.initConversation();
    },

    collapseExpand: function() {
      console.log('toggling chat window display');
      this.chatBody.collapseExpand();
    },

    close: function() {
      console.log('closing the chat bot');
      $(this.chatWrapper).hide();
      this.chatBody.clearConversation();
    },

    handleInput: function(input) {
      if (input && input.trim().length > 0) {
        this.chatBody.messageBoard.addMessage(USER_MESSAGE, 'user', {name: 'You', message: input})
        this.chatBody.form.input.element.value = '';
        this.postInput(input)
      }
    },

    postInput: function(input) {
      var params = {
        botAlias: '$LATEST',
        botName: 'ApprenticeshipsBot',
        inputText: input,
        userId: this.lexUserId,
        sessionAttributes: this.sessionAttributes
      };
      let that = this;
      this.lexruntime.postText(params, function(err, data) {
        if (err) {
          console.error(err, err.stack);
          showError('Error:  ' + err.message + ' (see console for details)')
        }
        if (data) {
          // capture the sessionAttributes for the next cycle
          that.sessionAttributes = data.sessionAttributes;
          // show response and/or error/dialog status
          console.log(data)
          if (!data.intentName) {
            that.chatBody.messageBoard.addMessage(BOT_MESSAGE, 'bot', {name: 'GovBot', message: [data.message]})
          } else {
            let lambdaOutput = JSON.parse(data.message);
            that.chatBody.messageBoard.addMessage(BOT_MESSAGE, 'bot', {name: 'GovBot', message: lambdaOutput.messages});
            that.chatBody.messageBoard.addMessage(lambdaOutput.response.type, 'bot', {name: 'GovBot', message: lambdaOutput.response.response});
          }
        }
      });
    // we always cancel form submission
    return false;
    }
  }


  var ChatHead = function(wrapper, collapseExpand, close) {
    this.wrapper = wrapper;
    this.collapseExpand = collapseExpand;
    this.close = close;
    this.setup();
  }

  ChatHead.prototype = {
    setup: function() {
      console.log('setting up chat header');
      this.addElement();
      this.addChildren();
    },

    addElement: function() {
      let chatHeader = document.createElement("div");
      chatHeader.id = 'chatHeader';
      chatHeader.className = "chat-header";
      this.wrapper.appendChild(chatHeader);
      this.head = $('#chatHeader')[0];
    },

    addChildren: function() {
      this.displayToggle = new DisplayToggle(this.head, this.collapseExpand);
      this.closeButton = new CloseButton(this.head, this.close);
    }
  }


  var DisplayToggle = function(head, collapseExpand) {
    this.head = head;
    this.collapseExpand = collapseExpand;
    this.setup();
  }

  DisplayToggle.prototype = {
    setup: function() {
      console.log('setting up display toggle');
      this.addToggleButton();
      this.startWatcher();
    },

    addToggleButton: function() {
      let toggleButton = document.createElement("div");
      toggleButton.id = 'displayToggle';
      let hideText = document.createElement("h4");
      hideText.className = "hide"
      hideText.innerHTML = "v hide";
      let showText = document.createElement("h4");
      showText.className = "show";
      showText.innerHTML= "^ show";
      toggleButton.appendChild(hideText);
      toggleButton.appendChild(showText);
      this.head.appendChild(toggleButton);
      this.displayToggle = $('#displayToggle')[0];
      this.hideText = $('.hide')[0];
      this.showText = $('.show')[0];
    },

    startWatcher: function() {
      console.log('starting display toggle watchers')
      let that = this;
      $(this.displayToggle).click(function() {
        that.collapseExpand();
        $(that.hideText).toggle();
        $(that.showText).toggle();
      });
    }
  }


  var CloseButton = function(head, close) {
    this.head = head;
    this.close = close;
    this.setup();
  }

  CloseButton.prototype = {
    setup: function() {
      console.log('setting up the close button');
      this.addElement();
      this.startWatcher();
    },

    addElement: function() {
      let closeDiv = document.createElement("div");
      closeDiv.id = 'closeButton';
      closeDiv.className = "close";
      let closeText = document.createElement("h4");
      closeText.innerHTML= "close X";
      closeDiv.appendChild(closeText);
      this.head.appendChild(closeDiv);
      this.button = $('#closeButton')[0];
    },

    startWatcher: function() {
      let that = this;
      $(this.button).click(function() {
        that.close();
      })
    }
  }


  var ChatBody = function(wrapper, existingConversation, handleInput) {
    this.wrapper = wrapper;
    this.existingConversation = existingConversation;
    this.handleInput = handleInput;
    this.setup();
  }

  ChatBody.prototype = {
    setup: function() {
      console.log('setting up chat body');
      this.addElement();
      this.addChildren();
    },

    addElement: function() {
      let chatBody = document.createElement("div");
      chatBody.id = 'chatBody';
      chatBody.className = "chat-container";
      this.wrapper.appendChild(chatBody);
      this.body = $('#chatBody')[0];
    },

    addChildren: function() {
      this.messageBoard = new MessageBoard(this.body, this.existingConversation);
      this.form = new Form(this.body, this.handleInput);
    },

    collapseExpand: function() {
      $(this.body).toggle();
    },

    clearConversation: function() {
      this.messageBoard.clearConversation();
    },

    initConversation: function() {
      if (this.existingConversation) {
        this.messageBoard.reloadConversation();
      } else {
        this.messageBoard.startNewConversation();
      }
    }
  }


  var MessageBoard = function(body, existingConversation) {
    this.body = body;
    this.existingConversation = existingConversation;
    this.setup();
  }

  MessageBoard.prototype = {
    setup: function() {
      console.log('setting up the message board');
      this.addElement();
    },

    addElement: function() {
      messageBoard = document.createElement("div");
      messageBoard.id = "messageBoard";
      messageBoard.className = "conversation";
      this.body.appendChild(messageBoard);
      this.messageBoard = $('#messageBoard')[0];
    },

    clearConversation: function() {
      this.messageBoard.innerHTML = '';
    },

    reloadConversation: function() {
      this.messageBoard.innerHTML = this.existingConversation;
    },

    startNewConversation() {
      console.log('starting a conversation')
      this.addMessage(BOT_MESSAGE, 'bot', {name: 'GovBot', message: ["Hi, I'm GovBot!",
        "I might not be human, but I can do some pretty helpful stuff.",
        "What are you looking for?"]});
    },

    addMessage(type, source, content) {
      switch (type) {
        case BOT_MESSAGE:
          new BotMessage(this.messageBoard, source, content);
          break;
        case USER_MESSAGE:
          new UserMessage(this.messageBoard, source, content);
      }
    }
  }

  var BotMessage = function(board, type, content) {
    this.board = board;
    this.type = type;
    this.content = content;
    this.setup();
  }

  BotMessage.prototype = {
    setup: function() {
      this.startWorm();
      this.addElement();
    },

    startWorm: function() {
      this.worm = new Worm(this.board);
    },

    addElement: function() {
      let messageWrapper = document.createElement('p');
      messageWrapper.className = 'messageWrapper';
      this.board.appendChild(messageWrapper);
      this.messageWrapper = $('.messageWrapper')[$('.messageWrapper').length - 1];
      this.addContent();
      this.messageWrapper.scrollIntoView();
    },

    addContent: function() {
      let that = this;
      for (let i = 0; i < this.content.message.length; i++) {
        setTimeout(function() {
          that.addBubble(i) 
        }, 500 + (i * 500));
      }
    },

    addBubble: function(loop) {
      this.worm.removeElement();
      if (loop === 0) {
        this.nameBubble = new NameBubble(this.type, this.messageWrapper, this.content.name);
      }
      this.messageBubble = new MessageBubble(this.type, this.messageWrapper, this.content.message[loop]);
      if (loop !== this.content.message.length - 1) {
        this.startWorm();
      }
    }
  }

  var UserMessage = function(board, type, content) {
    this.board = board;
    this.type = type;
    this.content = content;
    this.setup();
  }

  UserMessage.prototype = {
    setup: function() {
      this.addElement();
    },

    addElement: function() {
      let messageWrapper = document.createElement('p');
      messageWrapper.className = 'messageWrapper';
      this.board.appendChild(messageWrapper);
      this.messageWrapper = $('.messageWrapper')[$('.messageWrapper').length - 1];
      this.addContent();
      this.messageWrapper.scrollIntoView();
    },

    addContent: function() {
      this.nameBubble = new NameBubble(this.type, this.messageWrapper, this.content.name);
      this.messageBubble = new MessageBubble(this.type, this.messageWrapper, this.content.message);
    }
  }

  var NameBubble = function(type, wrapper, name) {
    this.type = type;
    this.wrapper = wrapper;
    this.name = name;
    this.setup();
  }

  NameBubble.prototype = {
    setup: function() {
      this.addElement();
    },

    addElement: function() {
      let bubble = document.createElement("p");
      bubble.className = this.type;
      bubble.appendChild(document.createTextNode(this.name));
      this.wrapper.appendChild(bubble);
    }
  }

  var MessageBubble = function(type, wrapper, message) {
    this.wrapper = wrapper;
    this.type = type;
    this.message = message;
    this.setup();
  }

  MessageBubble.prototype = {
    setup: function() {
      console.log('creating message bubble')
      this.addElement();
    },

    addElement: function() {
      let bubble = document.createElement("p");
      bubble.className = this.type + '-message';
      bubble.appendChild(document.createTextNode(this.message));
      this.wrapper.appendChild(bubble);
    }
  }

  var Worm = function(board) {
    this.board = board;
    this.setup();
  }

  Worm.prototype = {
    setup: function() {
      console.log('starting a worm')
      this.addElement();
    },

    addElement: function() {
      this.board.insertAdjacentHTML('beforeend', '<p id="worm" class="bot-typing"><span class="dot"></span><span class="dot dot-two"></span><span class="dot dot-three"></span></p>');
      this.element = $('#worm')[0];
    },

    removeElement: function() {
      console.log('stopping a worm')
      this.element.remove();
    }
  }


  var Form = function(body, handleInput) {
    this.body = body;
    this.handleInput = handleInput;
    this.setup();
  }

  Form.prototype = {
    setup: function() {
      console.log('setting up the form');
      this.addElement();
      this.addChildren();
    },

    addElement: function() {
      let form = document.createElement("form");
      form.id = 'inputForm';
      form.className = "chat-form";
      this.body.appendChild(form);
      this.element = $('#inputForm')[0];
    },

    addChildren: function() {
      this.input = new InputField(this.element);
      this.button = new FormButton(this.element, this.submitInput.bind(this));
    },

    submitInput: function() {
      this.handleInput(this.input.getValue());
    }
  }

  var InputField = function(form) {
    this.form = form;
    this.setup();
  }

  InputField.prototype = {
    setup: function() {
      console.log('setting up the input field');
      this.addElement();
    },

    addElement: function() {
      let input = document.createElement("input");
      input = this.setAttributes(input, {
        "id": "inputField",
        "class": "chat-input",
        "type": "text",
        "size": "40",
        "placeholder": "Type your message here"
      });
      this.form.appendChild(input);
      this.element = $('#inputField')[0];
    },

    setAttributes: function(el, attrs) {
      for(var key in attrs) {
        el.setAttribute(key, attrs[key]);
      }
      return el;
    },

    getValue: function() {
      return this.element.value;
    }
  }

  var FormButton = function(form, submitInput) {
    this.form = form;
    this.submitInput = submitInput;
    this.setup();
  }

  FormButton.prototype = {
    setup: function() {
      console.log('setting up the form button');
      this.addElement();
      this.startWatcher();
    },

    addElement: function() {
      let button = document.createElement("button");
      button = this.setAttributes(button, {
        "id": "formButton",
        "value": "submit",
        "class": "send"
      });
      button.innerHTML = "Send";
      this.form.appendChild(button);
      this.element = $('#formButton')[0];
    },

    setAttributes: function(el, attrs) {
      for(var key in attrs) {
        el.setAttribute(key, attrs[key]);
      }
      return el;
    },

    startWatcher: function() {
      let that = this;
      $(this.element).click(function(evt) {
        evt.preventDefault();
        console.log('sending message');
        that.submitInput();
      })
    }
  }

  window.onload = function () {
    var pageHead = document.getElementsByTagName("head")[0];
    var existingConversation = sessionStorage.getItem('chat_history');
    new ChatBot(pageHead, existingConversation);
  }

}) (jQuery)
