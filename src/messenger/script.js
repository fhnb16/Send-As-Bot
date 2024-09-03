// Populate the dropdown menu with chat IDs
var botChatsList = document.getElementById('botChatsList');
for (var [chatName, chatId] of Object.entries(chatData)) {
    var option = document.createElement('option');
    option.value = chatId;
    option.textContent = chatName;
    botChatsList.appendChild(option);
}
updateLog();
var botQMList = document.getElementById('emojiMenu');
for (var item of Object.values(quickMessages)) {
    var qmItem = document.createElement('span');
    qmItem.classList.add('emoji');
    qmItem.textContent = item;
    botQMList.appendChild(qmItem);
}

// Insert tag at cursor position or wrap selected text
function insertTag(tag, arg = "") {
    if (arg != "") {
        arg = " " + arg;
    }
    var textarea = document.getElementById('editor');
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var text = textarea.value;

    var before = text.substring(0, start);
    var selected = text.substring(start, end);
    var after = text.substring(end);

    if (selected) {
        textarea.value = before + `<${tag}${arg}>` + selected + `</${tag}>` + after;
    } else {
        textarea.value = before + `<${tag}${arg}></${tag}>` + after;
    }

    textarea.focus();
    textarea.setSelectionRange(start + tag.length + arg.length + 2, end + tag.length + arg.length + 2);
}

// Send the message to the Telegram API
function sendMessage() {
    var responseContainer = document.getElementById('responseContainer');
    var chatId = botChatsList.value;
    var text = encodeURIComponent(document.getElementById('editor').value);
    var url = `${apiEndpoint}sendMessage?chat_id=${chatId}&parse_mode=HTML&text=${text}`;
    responseContainer.classList.add('hidden');

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayResponse(data);
        })
        .catch(error => console.error('Error sending message:', error));
}

// Display the response in the response container
function displayResponse(data) {
    var textarea = document.getElementById('editor');
    var deleteBtn = document.getElementById('deleteMessageBtn');
    var responseContainer = document.getElementById('responseContainer');
    var responseField = document.getElementById('responseField');
    responseContainer.classList.remove('hidden');
    responseField.value = JSON.stringify(data, null, 4);

    if (data.ok) {
        if (data.result.chat != undefined) {
            // Save necessary data for message deletion
            deleteBtn.dataset.messageId = data.result.message_id;
            deleteBtn.dataset.chatId = data.result.chat.id;
            deleteBtn.classList.remove('hidden');
            textarea.value = "";
            updateLog();
            printLogMessage(data.result);
        } else {
            deleteBtn.classList.add('hidden');
        }
    } else {
        deleteBtn.classList.add('hidden');
    }

}

// Delete the message
function deleteMessage() {
    var deleteBtn = document.getElementById('deleteMessageBtn');
    var messageId = deleteBtn.dataset.messageId;
    var chatId = deleteBtn.dataset.chatId;
    var url = `${apiEndpoint}deleteMessage?chat_id=${chatId}&message_id=${messageId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Message deleted:', data);
            displayResponse(data);
        })
        .catch(error => console.error('Error deleting message:', error));
}

function sendImageB64() {
    document.getElementById('imageFileInput').click();
}

// Handle image upload and send as base64 via POST
function handleImageFile() {
    var fileInput = document.getElementById('imageFileInput');
    var file = fileInput.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var base64Image = event.target.result.split(',')[1];
            var chatId = botChatsList.value;
            var caption = document.getElementById('editor').value;

            // Convert base64 to a file object
            urltoFile(base64Image, 'image.jpeg')
                .then(function(file) {
                    var formData = new FormData();
                    formData.append('photo', file);
                    formData.append('caption', caption);

                    var url = `${apiEndpoint}sendPhoto?chat_id=${chatId}`;

                    // Send the POST request with the image data
                    fetch(url, {
                            method: 'POST',
                            body: formData,
                        })
                        .then(response => response.json())
                        .then(data => {
                            displayResponse(data);
                        })
                        .catch(error => console.error('Error sending image:', error));
                });
        };
        reader.readAsDataURL(file);
    }
}

// Helper function to convert a base64 string to a File object
function urltoFile(base64, filename) {
    return fetch(`data:image/jpeg;base64,${base64}`)
        .then(res => res.arrayBuffer())
        .then(buf => new File([buf], filename, {
            type: 'image/jpeg'
        }));
}

// Prompt user for URL and send as image
function sendImageURL() {
    var imageUrl = prompt("Enter the image URL:");
    if (imageUrl) {
        var caption = document.getElementById('editor').value;
        var chatId = botChatsList.value;

        var url = `${apiEndpoint}sendPhoto?chat_id=${chatId}&photo=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}`;

        fetch(url, {
                method: 'GET',
            })
            .then(response => response.json())
            .then(data => {
                displayResponse(data);
            })
            .catch(error => console.error('Error sending image:', error));
    }
}

// Показ/скрытие меню с эмодзи
var emojiToggleBtn = document.getElementById('emojiToggleBtn');
var emojiMenu = document.getElementById('emojiMenu');
var textarea = document.getElementById('editor');

emojiToggleBtn.addEventListener('mouseenter', () => {
    emojiMenu.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
    if (!emojiMenu.contains(e.target) && e.target !== emojiToggleBtn) {
        emojiMenu.classList.add('hidden');
    }
});

emojiMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji')) {
        insertAtCursor(textarea, e.target.textContent);
        emojiMenu.classList.add('hidden');
    }
});

function insertAtCursor(textarea, text) {
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var before = textarea.value.substring(0, start);
    var after = textarea.value.substring(end, textarea.value.length);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}

async function fetchLastMessages(chatId, botID) {
    var url = `https://bot.fhnb.ru/feedback/universal/log.json` + "?rand=" + Math.floor(Math.random() * Date.now());
    var chatId = botChatsList.value;
    try {
        var response = await fetch(url);
        //await console.log(response.json());
        var data = await response.json(); // '[' + response.text() + ']'

        if (data) {
            var messages = data
                .filter(update => update.message && update.message.chat.id == chatId)
                .map(update => update.message)
                .slice(-10);
            console.log(data);
            displayMessages(messages, botID);
        } else {
            console.error('Failed to fetch messages:', data);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function displayMessages(messages, botID) {
    var chatLog = document.getElementById('chatLog');
    chatLog.innerHTML = ''; // Clear existing messages

    messages.forEach(message => {
        printLogMessage(message);
    });

    chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom of the chat log
}

function printLogMessage(message) {
    var senderName = "user";
    if (message.from.first_name || message.from.last_name) {
        var senderName = message.from.first_name + " " + message.from.last_name;
    }
    if (message.from.username) {
        var senderName = message.from.username;
    }
    if (message.sender_chat && message.sender_chat.title) {
        var senderName = message.sender_chat.title;
    }
    //var senderName = message.sender_chat.title || message.from.first_name + " " + message.from.last_name || message.from.username;
    var isBotMessage = message.from.id == botID;

    var messageContainer = document.createElement('div');
    messageContainer.className = `chat-log__message ${isBotMessage ? 'chat-log__message--bot' : 'chat-log__message--user'}`;

    var senderElement = document.createElement('div');
    senderElement.className = 'chat-log__sender';
    senderElement.textContent = senderName;

    var textElement = document.createElement('div');
    textElement.textContent = message.text || '[Non-text message]';

    messageContainer.appendChild(senderElement);
    messageContainer.appendChild(textElement);

    chatLog.appendChild(messageContainer);
}

function updateLog() {
    var chatId = botChatsList.value;
    fetchLastMessages(chatId, botID);
}