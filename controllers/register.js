(function() {
    //==========================================================================
    const {User} = require("../models/user");
    const consts = require("../utility/consts");

    //==========================================================================
    /**
     * Handles redirection to the home page.
     *
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object.
     */
    const returnToHomePage = (req, res) => { res.redirect(302,'/login' );}

    //==========================================================================
    /**
     * Handles the rendering of the registration page.
     * Retrieves user-related data from request cookies and uses it to populate fields on the registration page.
     * It renders the registration page view with default messages, titles, and any pre-existing values from cookies.
     *
     * @function
     * @param {Object} req - The request object containing client information and cookies.
     * @param {Object} res - The response object used to render the registration page.
     */
    const getRegisterPage = (req, res) => {
        const [email,firstName,lastName] = extractRegisterCookies(req, res);

        res.render('register', { message: consts.DEFAULT_REGISTER_MESSAGE, pageTitle: consts.PAGE_TITLE_REGISTER ,
                                email:email , firstName:firstName,lastName:lastName, error:"",tabTitle:consts.TAB_REGISTER  });
    }

    //==========================================================================
    /**
     * Handles the POST request for the registration password page. This function processes
     * user registration data, validates the inputs, and manages the necessary logic to
     * render the appropriate response or error message back to the user.
     *
     * The workflow includes:
     * - Extracting the email, first name, and last name from the request body.
     * - Checking if the user already exists in the database.
     * - Validating the provided email and name data.
     * - Setting registration cookies.
     * - Rendering the 'register-password' page if validation succeeds.
     * - Rendering the 'register' page with appropriate error messages if an issue is encountered.
     *
     * @param {Object} req - The Express request object containing user registration data.
     * @param {Object} res - The Express response object used to send the rendered view or error response.
     */
    const postRegisterPasswordPage = async (req, res) => {
        const [email,firstName,lastName] = extractRegisterBody(req, res);

        try{
            const user = await User.findOne({ where: { email: email } });
            if (user) {
                throw new Error(consts.ERROR_EMAIL_EXISTS);
            }
            validRegisterEmailAndName(email, firstName, lastName);
            setRegisterCookies(req, res,email, firstName, lastName);

            res.render('register-password', { message: consts.DEFAULT_REGISTER_MESSAGE, pageTitle:consts.PAGE_TITLE_REGISTER_PASSWORD, error:"",tabTitle:consts.TAB_REGISTER});
        }catch (e) {
            res.render('register', { message: "", pageTitle:consts.PAGE_TITLE_REGISTER, email:"",firstName: "", lastName: "",error:e.message,tabTitle:consts.TAB_REGISTER });
        }
    }

    //==========================================================================
    /**
     * Extracts registration details from the request body.
     *
     * This function retrieves the `email`, `firstName`, and `lastName` properties from the body
     * of an incoming HTTP request object and returns them in an array.
     *
     * @param {Object} req - The HTTP request object containing the body with registration details.
     * @param {Object} res - The HTTP response object (unused in this function).
     * @returns {Array} An array containing the email, firstName, and lastName extracted from the request body.
     */
    const extractRegisterBody = (req, res) => {
        let email = req.body.email;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        return [email,firstName,lastName];
    }

    //==========================================================================
    /**
     * Sets a secure HTTP-only cookie for user registration details.
     * The cookie stores the user's email, first name, last name, and an error placeholder,
     * and it has a defined expiration time.
     *
     * @function
     * @param {Object} req - The request object from the HTTP client.
     * @param {Object} res - The response object used to send back the HTTP response.
     * @param {string} email - The email address of the registering user.
     * @param {string} firstName - The first name of the registering user.
     * @param {string} lastName - The last name of the registering user.
     */
    const setRegisterCookies = (req, res , email , firstName , lastName) => {
        res.cookie( 'user',
                    { email: email, firstName: firstName, lastName: lastName, error:"" },
                    { httpOnly: true, maxAge: 30 * 1000 });
    }

    //==========================================================================
    /**
     * Extracts registration-related cookie data from the request object and returns it as an array of strings.
     *
     * This function retrieves the cookies from the incoming request, specifically looking for the 'user' cookie.
     * If found, it extracts the 'email', 'firstName', and 'lastName' properties from the 'user' cookie.
     * If the 'user' cookie does not exist or its properties are missing, it returns an array with empty strings.
     *
     * @param {Object} req - The request object containing cookies.
     * @param {Object} res - The response object, currently unused in this function.
     * @returns {Array<string>} An array containing the email, firstName, and lastName from the 'user' cookie. Defaults to an array of empty strings if the 'user' cookie is not found.
     */
    const extractRegisterCookies = (req, res) => {
        const cookies = req.cookies;
        const userCookie = cookies['user'];

        if (userCookie) {
            const { email = '', firstName = '', lastName = '' } = userCookie;
            return [email, firstName, lastName];
        }

        return ['', '', ''];
    };

    //==========================================================================
    /**
     * Validates an email, first name, and last name against specific format requirements.
     *
     * The function checks the following:
     * - The email should adhere to a valid email format that allows alphanumeric characters,
     *   dots (.), underscores (_), and hyphens (-) before the "@" symbol, and alphanumeric
     *   characters and dots (.) after it.
     * - The first name should consist only of alphabetic characters and may include
     *   single spaces between words (e.g., for compound names).
     * - The last name should also follow the same format as the first name.
     *
     * If any of these conditions are not satisfied, an error is thrown with a corresponding
     * message from the constants object.
     *
     * @param {string} email - The email address to validate.
     * @param {string} firstName - The first name to validate.
     * @param {string} lastName - The last name to validate.
     * @throws {Error} If the email, first name, or last name does not meet the respective format requirements.
     */
    const validRegisterEmailAndName = (email, firstName, lastName) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!emailRegex.test(email)) {
            throw new Error(consts.INVALID_EMAIL);
        }

        const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
        if (!nameRegex.test(firstName)) {
            throw new Error(consts.INVALID_FIRST_NAME);
        }

        if (!nameRegex.test(lastName)) {
            throw new Error(consts.INVALID_LAST_NAME);
        }
    };

    //==========================================================================

    module.exports = {
        postRegisterPasswordPage,
        getRegisterPage,
        extractRegisterCookies,
        returnToHomePage
    };
})();