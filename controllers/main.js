(function() {
    const bcrypt = require("bcrypt");
    const {User} = require("../models/user");
    const e = require("express");
    const  Message  = require("../models/message");
    const {Op} = require("sequelize");
    const consts = require("../utility/consts");

    //==========================================================================================================
    let lastServerUpdate = new Date();

    //==========================================================================================================
    /**
     * Handles the logout functionality for a user session.
     *
     * This asynchronous function resets the session properties related to the user's
     * authentication, including userId, isLoggedIn status, and fullName. It ensures
     * the user's session is effectively invalidated by clearing authentication-related
     * data. After modifying the session, it sends a response to the client indicating
     * a successful logout.
     *
     * @param {Object} req - The HTTP request object, which contains the user's session data.
     * @param {Object} res - The HTTP response object, used to send confirmation of the logout.
     */
    const logout = async function(req, res) {
        req.session.userId = null;
        req.session.isLoggedIn = false;
        req.session.fullName = null;

        res.send({ message: "Logged out successfully" });
    };

    //==========================================================================================================
    /**
     * Handles the post request for the main page.
     *
     * This asynchronous function processes login information submitted through the request body.
     * It checks for an existing user session, validates the email and password, and interacts with
     * the user data to authenticate the user. If successful, it updates the session, sets session-related
     * properties, and renders the main page with user details.
     *
     * In case of errors during login (e.g., missing email/password or failed authentication),
     * it logs the error and re-renders the login page with an error message.
     *
     * @param {object} req - The request object containing the client request and user data.
     * @param {object} res - The response object used to send back the appropriate content.
     */
    const postMainPage = async (req, res) => {
        try {
            let email = req.body.email;
            let password = req.body.password;

            if(req.session.userId){
                return res.redirect("/main");
            }
            if (!email || !password) {
                throw new Error("");
            }

            const user = await isUserExists(email, password);

            if (!req.session.userId) {
                req.session.userId = user.id;
                req.session.isLoggedIn = true;
                req.session.fullName = user.firstName + " " + user.lastName;

                res.render('main', { tabTitle: consts.TAB_MAIN, fullName: req.session.fullName });
            }
        } catch (e) {
            res.render('login', { message: "", pageTitle: consts.PAGE_TITLE_LOGIN, error: e.message, tabTitle: consts.TAB_LOGIN });
        }
    };

    //==========================================================================================================
    /**
     * Asynchronously checks if a user exists in the database based on the provided email and password.
     * If a matching user is found and the password is valid, the user's data is returned.
     * Throws an error if no matching user is found or if the password is invalid.
     *
     * @param {string} email - The email address of the user to check.
     * @param {string} password - The password of the user to validate.
     * @returns {Promise<Object>} The user object if authentication is successful.
     * @throws {Error} Throws an error if the user does not exist or the password is invalid.
     */
    const isUserExists = async (email, password) => {
        const user = await User.findOne({ where: { email } });
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(isPasswordValid){
                return user;
            }
        }
        throw new Error(consts.ERROR_INVALID_USER);
    }

    //==========================================================================================================
    /**
     * Handles the request to serve the main page.
     *
     * This asynchronous function checks if the user is authenticated
     * by verifying the existence of `userId` in the session. If the user
     * is authenticated, it renders the main page with a specific tab title
     * and the full name of the user. If the user is not authenticated, it
     * redirects them to the login page with a 302 status.
     *
     * @param {object} req - The request object, containing session and user information.
     * @param {object} res - The response object, used to render the page or redirect.
     */
    const getMainPage =  async (req, res) => {
        if (req.session.userId) {
            res.render('main' , {tabTitle: consts.TAB_MAIN, fullName:req.session.fullName});
        } else {
            res.redirect(302, "/login");
        }
    }

    //=======================================================================================================
    /**
     * Asynchronous function to retrieve a user by their email from the database.
     *
     * This function queries the database for a user with the specified email and returns the user object as a JSON response.
     * If no user is found, it returns a `null` value with a 200 HTTP status code.
     * In case of an error during the database query, it returns a 500 HTTP status code along with an error message.
     *
     * @param {Object} req - The request object containing the parameters and data sent by the client.
     *                       The `email` parameter should be included in `req.params.email`.
     * @param {Object} res - The response object used to provide the client with the result.
     *
     * @throws {Error} If there is any error during the database query process, an internal server error response is returned.
     */
    const getUserByEmail = async (req, res) => {
        try {
            const user = await User.findOne({ where: { email: req.params.email } });
            if (!user) {
                return res.status(200).json(null);
            }
            res.status(200).json(user); // Send the user object as JSON
        } catch (err) {
            console.error('There was an error querying User:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    //=======================================================================================================
    /**
     * Handles user login by validating credentials and returning user information upon successful authentication.
     *
     * This function extracts the email and password from the request body, trims any excess whitespace,
     * and attempts to locate a user record in the database with the provided email. If a matching user is
     * found, the function verifies the password against the stored password hash. Upon successful
     * authentication, a user response object is sent containing the user's id, email, firstName,
     * and lastName. If authentication fails or the user is not found, an error message is returned.
     *
     * In case of internal server errors, an appropriate error response is sent.
     *
     * @param {Object} req - The HTTP request object containing user credentials in the body.
     * @param {Object} res - The HTTP response object used to send the response.
     */
    const loginUser = async (req, res) => {
        let { email, password } = req.body;
        email = email.trim;
        password = password.trim;
        try {
            const user = await User.findOne({ where: { email } });
            let userResponse = {};

            if (user) {
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if(isPasswordValid){
                    userResponse = {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    };
                    return res.status(200).send(userResponse);
                }
            }
            return res.status(200).send({
                ...userResponse,
                message: consts.ERROR_INVALID_USER
            });

        } catch (err) {
            console.error('Error querying User:', err);
            res.status(500).send({ error: 'An error occurred while searching for the user' });
        }
    }

    //=============================================================================

    /**
     * Asynchronously retrieves all messages along with their associated user information
     * and responds with the messages formatted to include the user's full name.
     *
     * This function fetches all messages from the database using the `Message` model
     * and includes associated user data (first name and last name) through the `User` model.
     * The messages are then transformed to include a fullName property, combining the user's
     * first and last name. It also updates the session's `lastUpdate` property with the
     * current date and responds with the processed data.
     *
     * @param {Object} req - The request object containing information about the HTTP request, including session data.
     * @param {Object} res - The response object used to send back the desired HTTP response.
     */
    const getAllMessages = async (req, res) => {
        try {
            const messages = await Message.findAll({
                include: {
                    model: User,
                    attributes: ['firstName', 'lastName'], // Fetch only the firstName and lastName of the user
                }
            });
            req.session.lastUpdate = new Date();

            const messagesWithFullNames = messages.map((message) => ({
                ...message.toJSON(),
                fullName: `${message.User.firstName} ${message.User.lastName}`,
            }));

            res.status(200).json(messagesWithFullNames);
        } catch (err) {
            console.error('Error fetching messages:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    //=============================================================================

    /**
     * Asynchronous function to handle the deletion of a message.
     *
     * This method is responsible for deleting a message record from the database based on
     * the provided message ID and ensures that the message belongs to the currently authenticated user.
     * If the message is not found, it responds with a 404 status. On successful deletion, it updates
     * the last server update timestamp and responds with a success message. In case of an error,
     * it responds with a 500 status and an error message.
     *
     * @param {Object} req - The HTTP request object containing parameters and session information.
     * @param {Object} res - The HTTP response object used to send responses back to the client.
     */
    const deleteMessage = async (req, res) => {
        try {
            const messageId = req.params.id;
            let user_id = req.session.userId;
            const deletedMessage = await Message.destroy({ where: { id: messageId ,user_id: user_id} });
            if (!deletedMessage) {
                return res.status(404).json({ error: 'Message not found' });
            }
            lastServerUpdate = new Date();
            res.status(200).json({ message: 'Message deleted successfully' });
        } catch (err) {
            console.error('Error deleting message:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    //=============================================================================
    /**
     * Updates a message in the database.
     *
     * This asynchronous function updates a message's text for a specific user in the database
     * based on the message ID and user ID retrieved from the session. It sends the updated message
     * as the response if successful, or an error message if the message is not found or if an
     * internal error occurs.
     *
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object used to send the response.
     *
     * @throws {Error} Will send a 500 status response in case of an internal server error.
     */
    const updateMessage = async (req, res) => {
        try {
            const messageId = req.params.id;
            const { text } = req.body;
            const user_id = req.session.userId;

            const [updated] = await Message.update({ text }, { where: { id: messageId ,user_id: user_id} });
            if (updated) {
                const updatedMessage = await Message.findOne({ where: { id: messageId ,user_id: user_id} });
                res.status(200).json(updatedMessage);
                lastServerUpdate = new Date();
            } else {
                res.status(404).json({ error: 'Message not found' });
            }
        } catch (err) {
            console.error('Error updating message:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    //=============================================================================
    /**
     * Asynchronous function to handle creating a new message.
     *
     * This function receives data from the incoming request, validates the presence
     * of required fields, verifies the existence of the user, and creates a new
     * message record in the database. If successful, it responds to the client
     * with the created message; otherwise, it sends an appropriate error response.
     *
     * @async
     * @function
     * @param {Object} req - The request object from the client, expected to contain:
     *   - A body property with `text` (string) as the message text.
     *   - A session object with `userId` (integer) representing the logged-in user.
     * @param {Object} res - The response object to communicate the result to the client.
     * @returns {Promise<void>} Sends an HTTP response based on the outcome:
     *   - Status 201 with the created message object upon success.
     *   - Status 400 with an error message if data is missing, user does not exist,
     *     or any error occurs during message creation.
     */
    const createMessage = async (req, res) => {
        let { text } = req.body;
        let user_id = req.session.userId;
        if (!text || !user_id) {
            return res.status(400).send({ error: 'Both text and user_id are required.' });
        }

        try {
            const user = await User.findByPk(user_id);

            if (!user) {
                return res.status(400).send({ error: 'Invalid user_id' });
            }

            const message = await Message.create({ text, user_id });
            lastServerUpdate = new Date();
            res.status(201).send(message);
        } catch (err) {
            console.error("Error creating message:", err);
            res.status(400).send({ error: err.message || 'Error creating message' });
        }
    };

    //=============================================================================
    /**
     * Verifies the existence of an active user session.
     * Checks if a session is active by inspecting the request object for a valid session and user ID.
     * If an active session exists, responds with the session details and authentication status.
     * If no active session is found, responds with a 401 status and an appropriate message.
     *
     * @param {Object} req - The request object, containing session information.
     * @param {Object} res - The response object used to send the verification result back to the client.
     */
    const verifyUserSession = (req, res) => {
        if (req.session && req.session.userId) {
            res.json({ authenticated: true ,sessionId: req.sessionID, userId: req.session.userId });
        } else {
            res.status(401).json({ message: "No active session" });
        }
    };

    //===============================================================================
    /**
     * Asynchronously retrieves messages containing a specific text from the database.
     *
     * This function fetches all messages that contain a given search text, performs
     * a case-insensitive search using a SQL LIKE query, and includes user details
     * such as first name and last name. The response includes the matched messages
     * along with a full name composed of the user's first and last names.
     *
     * @param {Object} req - The request object, containing the query parameters.
     * @param {Object} res - The response object, used to send the JSON response.
     * @throws {Error} If an error occurs during the database query or response handling.
     */
    const getMessagesByText = async (req, res) => {
        try {
            const searchText = req.query.text;

            if (!searchText) {
                return res.status(400).json({ error: 'Search text is required' });
            }

            const messages = await Message.findAll({
                where: {
                    text: {
                        [Op.like]: `%${searchText}%`
                    }
                },
                include: {
                    model: User,
                    attributes: ['firstName', 'lastName'],
                }
            });

            const messagesWithFullNames = messages.map((message) => ({
                ...message.toJSON(),
                fullName: `${message.User.firstName} ${message.User.lastName}`,
            }));

            res.status(200).json(messagesWithFullNames);
        } catch (err) {
            console.error('Error fetching messages:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };


    //===============================================================================
    /**
     * Asynchronously checks for message updates based on the client's last update time.
     *
     * This function retrieves the `last-update` timestamp from the client's request headers
     * and compares it to the server's latest message update timestamp (`lastServerUpdate`).
     * If the server has more recent updates than the client, it responds with the update status.
     *
     * @function
     * @async
     * @param {Object} req - The HTTP request object.
     * @param {string} [req.headers.last-update] - The timestamp of the client's last update.
     * @param {Object} res - The HTTP response object.
     * @returns {Promise<void>} Returns a JSON response indicating whether updates are available
     *                          and the timestamp of the check.
     *
     * @throws {Error} Throws an error if a processing issue occurs or if the response cannot be sent.
     */
    const checkMessages = async (req, res) => {
        try {
            let lastClientUpdate;
            try {
                lastClientUpdate = req.headers['last-update']
                    ? new Date(req.headers['last-update'])
                    : new Date(0);

                if (isNaN(lastClientUpdate.getTime())) {
                    lastClientUpdate = new Date(0);
                }
            } catch (error) {
                console.error('Error parsing last-update header:', error);
                lastClientUpdate = new Date(0);
            }

            const hasUpdates = lastServerUpdate > lastClientUpdate;

            res.json({
                hasUpdates,
                lastCheck: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error checking messages:', err);
            res.status(500).json({
                error: 'Error checking for message updates',
                details: err.message
            });
        }
    };
    //===============================================================================
    /**
     * Middleware function to ensure that a user is authenticated before allowing access to the next route handler.
     *
     * This function checks if there is a valid session with an associated user ID present.
     * If the session or user ID is missing, it responds with a 401 status code and an error message indicating that
     * the session has expired.
     *
     * If the session and user ID are valid, the function calls the `next` callback to proceed to the next middleware
     * or route handler in the stack.
     *
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object.
     * @param {Function} next - The callback function to pass control to the next middleware.
     */
    const requireAuth = (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({message: 'Session expired'});
        }
        next();
    };

    //===============================================================================

    module.exports = {
        postMainPage,
        getMainPage,
        getUserByEmail,
        loginUser,
        updateMessage,
        deleteMessage,
        getAllMessages,
        createMessage,
        verifyUserSession,
        logout,
        getMessagesByText,
        checkMessages,
        requireAuth
    };
})();
