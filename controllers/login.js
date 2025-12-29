(function() {
    //==========================================================================
    const registerFunction = require('../controllers/register');
    const {User} = require("../models/user");
    const Sequelize = require("sequelize");
    const consts = require("../utility/consts");

//==========================================================================
    /**
     * Renders the login page.
     *
     * This function is an Express.js route handler that renders the login
     * page when invoked. It utilizes the `res.render` method to render
     * a view template named 'login' and passes an object containing
     * properties like message, pageTitle, error, and tabTitle.
     *
     * @param {Object} req - The Express.js request object.
     * @param {Object} res - The Express.js response object used to
     *                       send the rendered login page to the client.
     */
    const getLoginPage = (req, res) => {
        res.render('login', { message:"", pageTitle:consts.PAGE_TITLE_LOGIN,error:"",tabTitle:consts.TAB_LOGIN });
    }

//==========================================================================
    /**
     * Handles the POST request for the login page after user registration.
     * Validates the passwords entered by the user and creates a new user record in the database if valid.
     * If the passwords do not match or there are validation errors, renders the appropriate registration page with an error message.
     *
     * @async
     * @function postLoginPage
     * @param {Object} req - The request object containing body data and cookies.
     * @param {Object} res - The response object used to render pages or send data back to the client.
     * @throws {Error} Throws an error if the confirmation password does not match or if database validation fails.
     */
    const postLoginPage = async (req, res) => {
        let password = req.body.password;
        let confirmPassword = req.body.confirmPassword;
        const [email, firstName, lastName] = registerFunction.extractRegisterCookies(req, res);

        try {
            if (password === confirmPassword) {
                await User.create({email, firstName, lastName, password});
                clearAllCookies(req, res);
                res.render('login', {
                    message: consts.SUCCESSFUL_REGISTER,
                    pageTitle: consts.PAGE_TITLE_LOGIN,
                    error: "",
                    tabTitle: consts.TAB_LOGIN
                });
            } else {
                throw new Error(consts.ERROR_NOT_MATCH_PASSWORD);
            }
        } catch (e) {
            if (e instanceof Sequelize.ValidationError) {
                res.render('register', {
                    message: "",
                    pageTitle: consts.PAGE_TITLE_REGISTER,
                    error: e.message,
                    tabTitle: consts.TAB_REGISTER
                });
            } else {
                res.render('register-password', {
                    message: "",
                    pageTitle: consts.PAGE_TITLE_REGISTER_PASSWORD,
                    error: e.message,
                    tabTitle: consts.TAB_REGISTER
                });
            }
        }
    }
//==========================================================================
    /**
     * Clears all specified cookies from the client's browser.
     *
     * This function iterates over a predefined list of cookie names
     * and removes them using the provided response object.
     *
     * @function
     * @param {Object} req - The HTTP request object (not used in this function, but passed for consistency).
     * @param {Object} res - The HTTP response object used to clear the cookies.
     */
    const clearAllCookies = (req,res) => {
        const cookiesToClear = ["user", "email", "lastName", "firstName"];
        cookiesToClear.forEach(cookie => res.clearCookie(cookie));
    }

//==========================================================================
    module.exports = {
        getLoginPage,
        postLoginPage
    };
})();