(function() {
    //==========================================================================================================
    /**
     * Middleware function to check if a user is logged in.
     *
     * Logs the incoming request method and path. If the user session contains a `userId`,
     * the user is considered logged in, and the function redirects to the `/main` route.
     * Otherwise, it allows the request to proceed to the intended path by calling the `next` function.
     *
     * @param {Object} req - The request object containing session and route information.
     * @param {Object} res - The response object used to redirect the user.
     * @param {Function} next - The next middleware function to execute.
     */
    const isUserLoggedIn = async (req, res , next) => {
        if (req.session.userId) {
            return res.redirect("/main");
        }
        next();
    }

    //==========================================================================================================
    module.exports = {
        isUserLoggedIn
    };
})();
