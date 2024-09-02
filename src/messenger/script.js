// Populate the dropdown menu with chat IDs
var botChatsList = document.getElementById('botChatsList');
for (var [chatName, chatId] of Object.entries(chatData)) {
    var option = document.createElement('option');
    option.value = chatId;
    option.textContent = chatName;
    botChatsList.appendChild(option);
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
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const emojiMenu = document.getElementById('emojiMenu');
const textarea = document.getElementById('editor');

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
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end, textarea.value.length);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}