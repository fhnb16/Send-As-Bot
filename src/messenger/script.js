// Функция для извлечения параметра из URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Инициализация списка чатов
var botChatsList = document.getElementById('botChatsList');
var selectedChat = getUrlParameter('chat');

for (var [chatName, chatId] of Object.entries(chatData)) {
    var option = document.createElement('option');
    option.value = chatId;
    option.textContent = chatName;
    botChatsList.appendChild(option);

    // Если chatId совпадает с ?chat=, устанавливаем этот чат как выбранный
    if (chatId === selectedChat) {
        botChatsList.value = chatId;
    }
}

// Если ?chat= указан и его нет в списке, добавляем его
if (selectedChat && !Object.values(chatData).includes(selectedChat)) {
    var option = document.createElement('option');
    option.value = selectedChat;
    option.textContent = 'Unknown Chat'; // Можно заменить на любое значение или попытаться получить имя чата
    botChatsList.appendChild(option);
    botChatsList.value = selectedChat;
}

// Обновляем чат и URL при смене выбора
botChatsList.addEventListener('change', (event) => {
    var chatLog = document.getElementById('chatLog');
    chatLog.parentElement.querySelector('.tg-background').style.height = 0 + "px";
    chatLog.innerHTML = ''; // Clear existing messages
    updateLog();

    // Обновление URL с выбранным chatId
    const selectedValue = botChatsList.value;
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('chat', selectedValue);
    window.history.pushState({}, '', newUrl); // Обновление URL без перезагрузки страницы
});

document.getElementById('chatLog').parentElement.querySelector('.tg-background').style.height = 0 + "px";

updateLog();

var updateIntervalTime = 30 * 1000; // Интервал обновления в миллисекундах
var remainingTime = updateIntervalTime / 1000; // Оставшееся время в секундах

var updateInterval = setInterval(updateLog, updateIntervalTime);

function updateTimerDisplay() {
    var updateTimer = document.getElementById('updateTimer');
    var updateCounter = document.getElementById('bottomNav').querySelector('.updateCounter');
    updateCounter.textContent = "[" + remainingTime + "]";
    updateTimer.innerHTML = `Refresh messages after: ${remainingTime}s. <a class="link ml-1" onclick="updateLog()">Update.</a> <a class="link ml-auto" href="?exit=true">Log Out</a>`;

    remainingTime--;

    // Если время вышло, сбросить таймер
    if (remainingTime < 1) {
        remainingTime = updateIntervalTime / 1000;
    }
}

// Запускаем таймер отсчета
var updateDisplay = setInterval(updateTimerDisplay, 1000);


const logDiv = document.querySelector('.chat-log');
const editorDiv = document.querySelector('.editor-container');

function showEditor() {
    document.querySelector('.logSelector').classList.remove('selected');
    document.querySelector('.editorSelector').classList.add('selected');
    logDiv.classList.remove('selected');
    editorDiv.classList.add('selected');
};

function showLog() {
    document.querySelector('.logSelector').classList.add('selected');
    document.querySelector('.editorSelector').classList.remove('selected');
    logDiv.classList.add('selected');
    editorDiv.classList.remove('selected');
};

var botQMList = document.getElementById('emojiMenu');
for (var item of Object.values(quickMessages)) {
    var qmItem = document.createElement('span');
    qmItem.classList.add('emoji');
    qmItem.textContent = item;
    botQMList.appendChild(qmItem);
}

// Получаем элементы модального окна и изображения
var imgModal = document.querySelector('#imageModal');
var modalImg = imgModal.querySelector('#fullImage');
var span = imgModal.querySelector('.imgClose');
var chatLog = document.querySelector('#chatLog');

// Добавление обработчика клика для всех миниатюр с классом 'chat-log__message--thumb'
// Добавим обработчик события click к родительскому элементу
chatLog.addEventListener('click', (event) => {
    // Проверяем, является ли кликнутый элемент img с нужным классом
    if (event.target.classList.contains('chat-log__message--thumb')) {
        // Здесь выполняется код, который должен выполняться при клике на картинку
        var clickedImage = event.target;
        // Отображение модального окна
        imgModal.style.display = 'flex';
        // Установка пути к изображению в полноразмерное окно
        modalImg.src = clickedImage.src;
    }
});

// Закрытие модального окна при клике на крестик

span.onclick = function() {
    imgModal.style.display = 'none';
};

// Закрытие модального окна при клике вне изображения
window.onclick = function(event) {
    if (event.target == imgModal) {
        imgModal.style.display = 'none';
    }
};

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
            //console.log('Message deleted:', data);
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
    document.body.classList.add('blur');
    setTimeout(() => {
        var imageUrl = prompt("Enter the image URL:");
        document.body.classList.remove('blur');
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
    }, 300);

}

// Показ/скрытие меню с эмодзи
var emojiToggleBtn = document.getElementById('emojiToggleBtn');
var emojiMenu = document.getElementById('emojiMenu');
var textarea = document.getElementById('editor');

emojiToggleBtn.addEventListener('click', () => {
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
            //console.log(data);
            var messages = data
                .filter(update => (update.result && update.result.chat && update.result.chat.id == chatId) || (update.message && update.message.chat.id == chatId))
                .map(update => update.result || update.message)
                .slice(-50);
            displayMessages(messages, botID);
        } else {
            console.error('Failed to fetch messages:', data);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function displayMessages(messages, botID) {

    messages.forEach(message => {
        // Проверяем, есть ли сообщение с таким ID уже в DOM
        if (!isMessageAlreadyInDOM(message.message_id)) {
            // Если нет, добавляем его в лог
            printLogMessage(message);

            //scrollToBottom();
        }
    });
}

function isMessageAlreadyInDOM(messageId) {
    // Проверка наличия элемента с соответствующим message_id
    return !!document.querySelector(`[data-message-id="${messageId}"]`);
}



function printLogMessage(message) {
    var senderName = "user";
    if (message.from && message.from.first_name) {
        senderName = message.from.first_name;
        if (message.from.last_name) {
            senderName += " " + message.from.last_name;
        }
    } else if (message.from.username) {
        senderName = message.from.username;
    }
    if (message.sender_chat && message.sender_chat.title) {
        senderName = message.sender_chat.title;
    }
    //var senderName = message.sender_chat.title || message.from.first_name + " " + message.from.last_name || message.from.username;
    var isBotMessage = message.from.id == botID;

    var messageContainer = document.createElement('div');
    messageContainer.className = `chat-log__message z-20 ${isBotMessage ? 'chat-log__message--bot' : 'chat-log__message--user'}`;

    var senderElement = document.createElement('div');
    senderElement.className = 'chat-log__sender mb-2';
    senderElement.textContent = senderName;

    var innerMessageContainer = document.createElement('div');

    // Проверка и отображение вложений с использованием универсальной функции
    handleAttachment('photo', message, innerMessageContainer, 'photo');
    handleAttachment('video', message, innerMessageContainer, 'video');
    handleAttachment('sticker', message, innerMessageContainer, 'sticker');
    handleAttachment('audio', message, innerMessageContainer, 'audio');
    handleAttachment('voice', message, innerMessageContainer, 'voice');
    if (message.animation) {
        handleAttachment('animation', message, innerMessageContainer, 'gif');
    } else if (message.document) {
        handleAttachment('document', message, innerMessageContainer, 'document');
    }

    // Отображение текстовых сообщений и вложений
    if (message.text) {
        const textElement = document.createElement('div');
        textElement.className = 'text-message break-all mt-2';
        textElement.textContent = message.text;
        innerMessageContainer.appendChild(textElement);
    } else if (message.caption) {
        const captionElement = document.createElement('div');
        captionElement.className = 'caption-message mt-2';
        captionElement.textContent = message.caption;
        innerMessageContainer.appendChild(captionElement);
    }

    messageContainer.appendChild(senderElement);
    messageContainer.appendChild(innerMessageContainer);


    messageContainer.dataset.messageId = message.message_id;

    chatLog.appendChild(messageContainer);

    // Найдем все изображения в новом сообщении
    const images = chatLog.querySelectorAll('img');

    if (images.length > 0) {
        let loadedImages = 0;
        images.forEach((img) => {
            img.addEventListener('load', () => {
                loadedImages++;
                // Проверяем, загрузились ли все изображения
                if (loadedImages === images.length) {
                    scrollToBottom();
                }
            });
        });
    } else {
        scrollToBottom(); // Если нет изображений, просто скроллим вниз
    }
}

function updateLog() {
    var chatLog = document.getElementById('chatLog');
    /*if (chatLog.querySelector("canvas") === null) {
        var scrollBottomContainer = document.createElement('canvas');
        scrollBottomContainer.className = 'tg-background';
        chatLog.appendChild(scrollBottomContainer);
    }*/
    var chatId = botChatsList.value;
    fetchLastMessages(chatId, botID);
    remainingTime = updateIntervalTime / 1000;
}

chatLog.addEventListener('scroll', () => {
    var chatLog = document.getElementById('chatLog');
    var scrollBottomBtn = chatLog.querySelector(".scrollBottom");
    if (scrollBottomBtn !== null) {
        var scrollTop = chatLog.scrollTop;
        var clientHeight = chatLog.clientHeight;
        var scrollHeight = chatLog.scrollHeight;

        // Рассчитываем процент прокрутки от нижней точки
        var scrollPercent = (scrollHeight - scrollTop - clientHeight) / scrollHeight;

        // Меняем прозрачность блока в зависимости от прокрутки
        scrollBottomBtn.style.opacity = scrollPercent;
    }
});

// Универсальная функция для отображения вложений
function handleAttachment(attachmentType, message, container, displayText) {
    const attachment = message[attachmentType];
    if (!attachment) return;

    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment mt-2';
    attachmentDiv.title = "Attachment type: " + attachmentType;
    attachmentDiv.innerHTML = `<i>Loading ${displayText} preview...</i>`;
    container.appendChild(attachmentDiv);

    let file_id;
    if (Array.isArray(attachment)) {
        file_id = attachment[attachment.length - 1].file_id; // Если массив (например, photo)
    } else if (attachment.thumbnail) {
        file_id = attachment.thumbnail.file_id; // Если объект с thumbnail (например, sticker)
    } else if (attachment.thumb) {
        file_id = attachment.thumb.file_id; // Если объект с thumb (например, sticker)
    } else if (attachmentType == "animation" && !attachment.thumb && !attachment.thumbnail) {
        attachmentDiv.textContent = `[${displayText}] (Doesn't have preview)`;
        return;
    } else {
        attachmentDiv.textContent = `[${displayText}]`;
        return;
    }

    // Вызов функции insertImagePreview и установка innerHTML
    insertImagePreview(file_id)
        .then(imgHtml => {
            attachmentDiv.innerHTML = imgHtml;
            if (displayText == "sticker") {
                attachmentDiv.parentElement.parentElement.classList.add('sticker');
            }
            attachmentDiv.querySelector('img').addEventListener('load', () => {
                scrollToBottom();
            });
        })
        .catch(error => {
            attachmentDiv.textContent = `[${displayText}] (Can't load)`;
            console.error(error);
        });


    scrollToBottom();
}


async function insertImagePreview(file_id) {
    try {
        // Первый запрос: получить file_path через getFile API
        const getFileResponse = await fetch(`${apiEndpoint}getFile?file_id=${file_id}`);
        const getFileData = await getFileResponse.json();

        if (!getFileData.ok) {
            throw new Error('Не удалось получить информацию о файле');
        }

        const file_path = getFileData.result.file_path;

        // Второй запрос: получить файл через прокси
        const fileResponse = await fetch(`${apiEndpoint}file/${file_path}`);
        if (!fileResponse.ok) {
            throw new Error('Не удалось загрузить файл');
        }

        const blob = await fileResponse.blob();

        // Конвертация Blob в base64
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                //console.log(dataUrl);
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Определение MIME типа
        const mimeType = blob.type;

        // Возвращаем тег img с base64 изображением
        //console.log(`data: ${mimeType}; base64, ${base64Data}`);
        return `<img src="data:${mimeType};base64,${base64Data}" alt="Photo" class="w-full rounded chat-log__message--thumb"/>`;
    } catch (error) {
        console.error('Ошибка в insertImagePreview:', error);
        return `[Photo] (Can't load)`;
    }
}

function scrollToBottom() {
    const chatLog = document.querySelector('.chat-log');
    const chatLogScrollable = document.querySelector('#chatLog');
    chatLog.querySelector('.tg-background').style.height = (chatLogScrollable.scrollHeight + 80) + "px";
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Получаем элементы
var leaveModal = document.getElementById('leaveChatModal');
var confirmButton = leaveModal.querySelector('#confirmButton');
var cancelButton = leaveModal.querySelector('#cancelButton');
var errorMessage = leaveModal.querySelector('#errorMessage');
var confirmTextInput = leaveModal.querySelector('#confirmTextInput');

// Функция открытия модального окна
function openLeaveChatModal(chatLeaveId) {
    leaveModal.classList.remove('hidden');
    leaveModal.querySelector('#confirmTextInput').classList.remove('hidden');
    leaveModal.querySelector('.modal__description').classList.remove('hidden');
    leaveModal.querySelector('.modal__leave-chat-id').textContent = "Chat id: " + chatLeaveId;
    confirmButton.onclick = function() {
        handleLeaveChat(chatLeaveId);
    };
}

// Функция закрытия модального окна
function closeLeaveChatModal() {
    leaveModal.classList.add('hidden');
    confirmTextInput.value = ''; // Очистка поля ввода
    errorMessage.classList.add('hidden'); // Скрываем сообщение об ошибке
    confirmButton.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    leaveModal.querySelector('.modal__description').classList.remove('hidden');
    leaveModal.querySelector('#confirmTextInput').classList.remove('hidden');
    errorMessage.textContent = ''; // Очистка текста ошибки
}

// Обработка нажатия кнопки Cancel
cancelButton.onclick = function() {
    closeLeaveChatModal();
};

// Функция обработки выхода из чата
function handleLeaveChat(leaveChatId) {
    var userInput = confirmTextInput.value; // .trim()

    if (userInput !== 'Leave this chat') {
        errorMessage.textContent = 'You entered the wrong phrase, try again.';
        errorMessage.classList.remove('hidden');
        return;
    }

    // Выполнение запроса на выход из чата
    fetch(`${apiEndpoint}leaveChat?chat_id=${leaveChatId}`)
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.result) {
                document.querySelector('.modal__title').textContent = 'Bot successfully left this chat.';
                confirmButton.classList.add('hidden'); // Скрываем кнопку Sure
                errorMessage.classList.add('hidden'); // ошибку
                leaveModal.querySelector('.modal__description').classList.add('hidden'); // подсказку
                leaveModal.querySelector('#confirmTextInput').classList.add('hidden'); // текстовое поле
            } else {
                console.log(data);
                errorMessage.textContent = 'Failed to leave the chat. Please try again.';
                errorMessage.title = data.description + " (" + "Error code: " + data.error_code + ")";
                errorMessage.classList.remove('hidden');
            }
        })
        .catch(error => {
            errorMessage.textContent = 'Request failed. Please check your connection.';
            errorMessage.classList.remove('hidden');
        });
}

function promptForChatIdAndLeave() {
    // Открываем alert prompt и запрашиваем у пользователя ID чата
    document.body.classList.add('blur');
    setTimeout(() => {
        var chatToLeave = prompt("Please enter the chat ID you want to leave:");
        document.body.classList.remove('blur');

        // Проверяем, что пользователь не отменил prompt и что chatId не пустой
        if (chatToLeave) {
            // Вызываем функцию открытия модального окна с введенным ID чата
            openLeaveChatModal(chatToLeave);
        } else {
            console.log("Chat ID input was canceled or empty.");
        }
    }, 300);
}

function clearCacheAndReload() {
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Перезагружаем страницу после очистки кеша
            window.location.reload(true);
        });
    } else {
        // Если Cache API не поддерживается
        window.location.reload(true);
    }
}