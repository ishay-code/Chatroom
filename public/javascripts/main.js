
(function() {
    const MessagingModule = (() => {
        //========================================================================================
        // Private variables and DOM elements
        const elements = {
            form: {
                messageForm: document.getElementById('message_form'),
                messageInput: document.getElementById('message'),
                editMessageInput: document.getElementById('editMessageInputField')
            },
            buttons: {
                logout: document.getElementById('logOutButton'),
                save: document.getElementById('saveButton'),
                search: document.getElementById('searchButton'),
                searchMessages: document.getElementById('searchMessagesButton'),
                showAllMessages: document.getElementById('showAllMessagesButton'),
                confirmDeleteButton: document.getElementById('confirmDeleteButton')
            },
            containers: {
                messagesList: document.getElementById('messages'),
                header: document.querySelector('header .row:last-child .col')
            },
            modals: {
                edit: new bootstrap.Modal(document.getElementById('editModal')),
                deleteModal: new bootstrap.Modal(document.getElementById('deleteModal'))
            }
        };

        const POLLING_INTERVAL = 10000;
        let pollingTimer = null;
        let currentUserId = null;

        //========================================================================================

        /**
         * Displays a notification message on the screen for a specified duration.
         *
         * @param {string} message - The message to be displayed in the notification.
         * @param {string} [type='success'] - The type of notification, which determines its styling. Defaults to 'success'.
         *                                    Common values include 'success', 'error', 'warning', etc.
         */
        const showNotification = (message, type = 'success') => {
            const alertDiv = document.createElement('div');
            alertDiv.classList.add('alert', `alert-${type}`, 'mt-3');
            alertDiv.textContent = message;
            elements.form.messageForm.insertAdjacentElement('beforebegin', alertDiv);
            setTimeout(() => alertDiv.remove(), 3000);
        };

        //========================================================================================

        /**
         * Asynchronously checks the current user session to verify authentication status.
         *
         * This function sends a request to the '/api/verifyUserSession' endpoint to confirm
         * if the user's session is active. If the session is invalid or unauthenticated,
         * it redirects the user to the login page and returns `false`. Otherwise, it sets
         * the current user ID and returns `true`.
         *
         * @returns {Promise<boolean>} A promise that resolves to `true` if the session is valid
         *                             and the user is authenticated, or `false` otherwise.
         */
        const checkSession = async () => {
            try {
                const response = await fetch('/api/verifyUserSession');
                const data = await response.json();
                if (!data.authenticated) {
                    window.location.href = '/login';
                    return false;
                }
                currentUserId = data.userId;
                return true;
            } catch (err) {
                console.error('Session check failed:', err);
                return false;
            }
        };

        //========================================================================================

        /**
         * Asynchronously sends a message to the server via a POST request and handles the response.
         *
         * This function sends the provided text as a JSON object to the `/api/message` endpoint.
         * Upon a successful response, it refreshes the message list and displays a success notification.
         * If the request fails, it shows an error notification and logs the error to the console.
         *
         * @function
         * @async
         * @param {string} messageText - The text of the message to be sent to the server.
         * @throws {Error} Throws an error if the POST request fails or if the server returns an error response.
         */
        const sendMessage = async (messageText) => {
            try {
                const response = await fetch('/api/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: messageText })
                });

                const data = await response.json();
                if (response.ok) {
                    elements.containers.messagesList.innerHTML = '';
                    await fetchMessages();
                    showNotification('Message sent successfully');
                } else {
                    throw new Error(data.error || 'Error sending message');
                }
            } catch (err) {
                showNotification(err.message, 'danger');
                console.error('Error sending message:', err);
            }
        };



        /**
         * Deletes a message from the server by its ID and updates the UI accordingly.
         *
         * This asynchronous function makes a DELETE request to the server to remove
         * a message identified by the provided message ID. Upon successful deletion,
         * it clears the messages list container, fetches updated messages, and
         * displays a success notification. If the deletion fails, it shows an
         * error notification and logs the error information.
         *
         * @param {string} messageId - The unique identifier of the message to be deleted.
         * @returns {Promise<void>} A promise that resolves when the operation is complete.
         * @throws {Error} Throws an error if the deletion fails, providing the error message.
         */
        const deleteMessage = async (messageId) => {
            try {
                const response = await fetch(`/api/message/${messageId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    elements.containers.messagesList.innerHTML = '';
                    await fetchMessages();
                    showNotification('Message deleted successfully');
                } else {
                    const data = await response.json();
                    elements.modals.deleteModal.hide();
                    throw new Error(data.error || 'Error deleting message');
                }
                elements.modals.deleteModal.hide();
            } catch (err) {
                showNotification(err.message, 'danger');
                console.error('Error deleting message:', err);
            }
        };


        /**
         * Assigns a delete operation to a confirmation button for a specific message.
         *
         * This function sets up an event listener on the delete confirmation button.
         * When the button is clicked, it triggers the deletion of the specified message
         * by its ID and subsequently removes the event listener to prevent duplicate actions.
         * The delete modal is displayed to the user after the function is invoked.
         *
         * @param {string} messageId - The ID of the message to be deleted.
         */
        const setDeleteMessage = (messageId) => {
            const button = elements.buttons.confirmDeleteButton;
            const handler = () => {
                deleteMessage(messageId);
                button.removeEventListener('click', handler);
            };

            button.addEventListener('click', handler);
            elements.modals.deleteModal.show();
        };


        /**
         * Opens the edit modal and initializes it with the provided message.
         *
         * This function displays the edit modal, updates the modal title,
         * sets the input field with the current message text, and configures
         * the save button to update the message upon user confirmation. It
         * hides the search button to focus on the editing process.
         *
         * @param {Object} message - The message object to be edited.
         * @param {string} message.text - The text content of the message to populate in the edit field.
         */
        const openEditModal = (message) => {
            elements.buttons.save.style.display = 'block';
            elements.buttons.searchMessages.style.display = 'none';
            document.querySelector('#editModal .modal-title').textContent = 'Edit Message';
            elements.form.editMessageInput.value = message.text;
            elements.form.editMessageInput.placeholder = 'Edit your message...';
            elements.buttons.save.onclick = () => saveUpdatedMessage(message);
            elements.modals.edit.show();
        };

        /**
         * An asynchronous function to update an existing message.
         * Takes the updated message input from the user, validates it, and sends a PUT request to update the message on the server.
         * Upon success, reloads the updated message list and hides the edit modal.
         * Displays notifications for success or error scenarios.
         *
         * @param {Object} message - The message object containing the ID of the message to be updated.
         */
        const saveUpdatedMessage = async (message) => {
            const updatedText = elements.form.editMessageInput.value.trim();
            if (!updatedText) {
                showNotification('Message cannot be empty', 'danger');
                return;
            }

            try {
                const response = await fetch(`/api/message/${message.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: updatedText })
                });

                if (response.ok) {
                    elements.containers.messagesList.innerHTML = '';
                    await fetchMessages();
                    elements.modals.edit.hide();
                    showNotification('Message updated successfully');
                } else {
                    const data = await response.json();
                    elements.modals.edit.hide();
                    throw new Error(data.error || 'Error updating message');
                }
            } catch (err) {
                showNotification(err.message, 'danger');
                console.error('Error updating message:', err);
            }
        };

        /**
         * An asynchronous function to fetch messages from the server.
         *
         * This function performs an HTTP GET request to the '/api/message' endpoint and processes the response as JSON.
         * If the response contains a valid array of messages, it displays the messages.
         * If the data format differs, it attempts to extract messages from the `messages` property of the response.
         * The function also updates the `lastUpdate` dataset property on the messages list container with the current timestamp.
         *
         * In case of an error during the request or JSON parsing, it shows a notification to the user indicating failure
         * and logs the error to the console.
         *
         * @function
         * @async
         * @throws {Error} Logs an error to the console if the fetch operation fails.
         */
        const fetchMessages = async () => {
            try {
                const response = await fetch('/api/message');
                const data = await response.json();
                displayMessages(Array.isArray(data) ? data : (data.messages || []));

                elements.containers.messagesList.dataset.lastUpdate =  new Date().toISOString();
            } catch (err) {
                showNotification('Failed to fetch messages', 'danger');
                console.error('Error fetching messages:', err);
            }
        };

        /**
         * Asynchronously searches messages by a given text query and displays the results.
         *
         * @param {string} searchText - The text to search for within messages.
         * @returns {Promise<void>} A promise that resolves when the operation is complete.
         *
         * Handles potential errors during the fetch process by showing a notification, logging the error,
         * and attempting to re-fetch messages in case of failure.
         */
        const searchMessagesByText = async (searchText) => {
            try {
                const searchParams = new URLSearchParams({ text: searchText });
                const response = await fetch(`/api/searchMessagesByText?${searchParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                const messages = await response.json();
                if (!response.ok) {
                    elements.modals.edit.hide();
                    throw new Error(messages.error || 'Error updating message');
                }

                displayMessages(Array.isArray(messages) ? messages : []);

            } catch (err) {
                showNotification('Error searching messages: ' + err.message, 'danger');
                console.error('Error searching messages:', err);
                await fetchMessages();
            }
        };


        /**
         * Updates the messages list displayed in the UI.
         *
         * Clears the current contents of the messages list container and populates it
         * with the provided messages. If the messages array is empty, a placeholder message
         * indicating that no messages are found will be displayed.
         *
         * @param {Array} messages - An array of messages to be displayed in the messages list.
         */
        const displayMessages = (messages) => {
            elements.containers.messagesList.innerHTML = '';

            if (!messages.length) {
                const noMessagesElement = document.createElement('li');
                noMessagesElement.classList.add('list-group-item', 'text-center', 'text-muted');
                noMessagesElement.textContent = 'No messages found';
                elements.containers.messagesList.appendChild(noMessagesElement);
                return;
            }

            messages.forEach(addMessage);
        };

        //========================================================================================
        // DOM Element Creation
        /**
         * Generates a DOM element representing a message.
         *
         * This function takes a message object as input and creates a structured DOM element
         * for rendering the message. It creates a list item containing a card layout with
         * the user's full name, message text, and optional timestamp. If the message belongs
         * to the current user, additional buttons for actions are appended.
         *
         * @param {Object} message - The message object containing data to populate the element.
         * @param {string} message.fullName - The full name of the user sending the message.
         * @param {string} message.text - The text content of the message.
         * @param {string|number|Date} [message.createdAt] - The timestamp indicating when the message was created.
         * @param {string|number} message.user_id - The unique identifier of the message author.
         * @returns {HTMLElement} A DOM element representing the message.
         */
        const createMessageElement = (message) => {
            const messageElement = document.createElement('li');
            messageElement.classList.add('list-group-item');

            const card = document.createElement('div');
            card.classList.add('card', 'mb-3', 'shadow-sm', 'rounded');

            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body');

            const fullName = document.createElement('h5');
            fullName.classList.add('card-title', 'font-weight-bold', 'text-primary');
            fullName.textContent = message.fullName;
            cardBody.appendChild(fullName);

            const text = document.createElement('p');
            text.classList.add('card-text', 'text-muted');
            text.textContent = message.text;
            cardBody.appendChild(text);

            if (message.createdAt) {
                const timestamp = document.createElement('small');
                timestamp.classList.add('text-muted');
                timestamp.textContent = new Date(message.createdAt).toLocaleString();
                cardBody.appendChild(timestamp);
            }
            card.appendChild(cardBody);

            if (message.user_id === currentUserId) {
                const buttonGroup = createMessageButtons(message);
                const cardFooter = document.createElement('div');
                cardFooter.classList.add('card-footer', 'd-flex', 'justify-content-end');
                cardFooter.appendChild(buttonGroup);
                card.appendChild(cardFooter);
            }

            messageElement.appendChild(card);
            return messageElement;
        };

        /**
         * Creates a group of buttons for a given message, which includes "Edit" and "Delete" options.
         *
         * The "Edit" button triggers an edit modal for the specified message,
         * while the "Delete" button removes the message with the specified ID.
         *
         * @param {Object} message - The message object for which the buttons are created.
         *                           It should contain at least the `id` property to support deletion.
         * @returns {HTMLDivElement} A div element containing the "Edit" and "Delete" buttons styled as a button group.
         */
        const createMessageButtons = (message) => {
            const buttonGroup = document.createElement('div');
            buttonGroup.classList.add('btn-group', 'btn-group-sm');

            // Edit button
            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-warning', 'me-1');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => openEditModal(message));

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-danger', 'me-1');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => setDeleteMessage(message.id));

            buttonGroup.appendChild(editButton);
            buttonGroup.appendChild(deleteButton);

            return buttonGroup;
        };

        /**
         * Adds a new message to the messages list.
         *
         * This function creates a message element using the provided message
         * and appends it to the messages list container. It ensures the new
         * message is correctly incorporated into the existing messages list structure.
         *
         * @param {string} message - The message content to be added to the messages list.
         */
        const addMessage = (message) => {
            const messageElement = createMessageElement(message);
            elements.containers.messagesList.appendChild(messageElement);
        };

        //========================================================================================

        /**
         * Function that handles the configuration and display of the search button modal.
         * Changes the modal title to "Search Messages", adjusts button visibility,
         * clears the input field, sets a placeholder, and displays the modal.
         */
        const handleSearchButton = () => {
            const modalTitle = document.querySelector('#editModal .modal-title');
            modalTitle.textContent = 'Search Messages';

            elements.buttons.save.style.display = 'none';
            elements.buttons.searchMessages.style.display = 'block';

            elements.form.editMessageInput.value = '';
            elements.form.editMessageInput.placeholder = 'Enter search text...';

            elements.modals.edit.show();
        };

        /**
         * Handles the search functionality for messages.
         * Retrieves the search text from the input field, validates it, and initiates the search.
         * If the input field is empty, a warning notification is displayed.
         */
        const handleSearchMessagesButton = () => {
            const searchText = elements.form.editMessageInput.value.trim();
            if (searchText) {
                searchMessagesByText(searchText);
                elements.modals.edit.hide();
            } else {
                showNotification('Please enter search text', 'warning');
            }
        };

        //========================================================================================

        /**
         * Function to initiate message polling.
         *
         * Sets up a recurring interval that invokes the `checkForNewMessages` function
         * to periodically check for new messages. The interval duration is determined
         * by the constant `POLLING_INTERVAL`.
         *
         * Upon calling this function, the initial call to `checkForNewMessages` is made,
         * followed by automatic subsequent calls at the specified interval.
         */
        const startMessagePolling = () => {
            checkForNewMessages();
            pollingTimer = setInterval(checkForNewMessages, POLLING_INTERVAL);
        };

        /**
         * Stops the message polling process by clearing the interval timer.
         *
         * This function checks if the `pollingTimer` is currently set, and if so,
         * it clears the interval associated with it and sets `pollingTimer` to null.
         *
         * Useful for halting the message polling when it's no longer needed
         * or before initiating a different polling mechanism.
         */
        const stopMessagePolling = () => {
            if (pollingTimer) {
                clearInterval(pollingTimer);
                pollingTimer = null;
            }
        };

        /**
         * Asynchronously checks for new messages on the server.
         *
         * This function first verifies the current session by calling `checkSession`.
         * Then, it sends a GET request to the '/api/checkMessages' endpoint with the
         * required headers, including the last updated timestamp for messages.
         *
         * If the server responds successfully and indicates that there are updates
         * available, the `fetchMessages` function is invoked to retrieve the updated
         * message list.
         *
         * Errors encountered during the process, like network issues or failed responses,
         * are caught and logged to the console.
         *
         * @async
         * @function
         * @throws Will log an error in case of network or response handling issues.
         */
        const checkForNewMessages = async () => {
            try {
                await checkSession();
                const response = await fetch('/api/checkMessages', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Last-Update': elements.containers.messagesList.dataset.lastUpdate || '0'
                    }
                });

                const data = await response.json();
                if (!response.ok) {
                    elements.modals.edit.hide();
                    throw new Error(data.error || 'Error updating message');
                }

                if (data.hasUpdates) {
                    await fetchMessages();
                }

            } catch (err) {
                console.error('Error checking for message updates:', err);
            }
        };

        //========================================================================================
        /**
         * Initializes event listeners for various user interface elements.
         *
         * This function adds event listeners to handle user interactions such as logging out, submitting messages,
         * and executing search-related actions.
         */
        const initializeEventListeners = () => {
            elements.buttons.logout.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch('/api/logout');
                    window.location.href = '/';
                } catch (err) {
                    console.error('Logout failed:', err);
                }
            });

            elements.form.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const messageText = elements.form.messageInput.value.trim();
                if (messageText) {
                    sendMessage(messageText);
                    elements.form.messageInput.value = '';
                }
            });

            elements.buttons.search.addEventListener('click', handleSearchButton);
            elements.buttons.searchMessages.addEventListener('click', handleSearchMessagesButton);
            elements.buttons.showAllMessages.addEventListener('click', () => fetchMessages());
        };

        //========================================================================================
        const init = () => {
            document.addEventListener("DOMContentLoaded", async () => {
                await checkSession();
                initializeEventListeners();
                await fetchMessages();
                startMessagePolling();
            });

            window.addEventListener('unload', () => {
                stopMessagePolling();
            });
        };

        //========================================================================================
        return {
            init: init,
        };
    })();

    MessagingModule.init();
})();