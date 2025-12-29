(function() {
    const RegisterModule = (function() {
        // Private constant
        const REGISTER_SAVE_DATA_TIMER = 30;

        // Private methods
        /**
         * Sets a cookie with a specified name, value, and expiration time in seconds.
         *
         * @param {string} cname - The name of the cookie.
         * @param {string} cvalue - The value to be assigned to the cookie.
         * @param {number} seconds - The duration in seconds after which the cookie will expire.
         */
        const setCookie = (cname, cvalue, seconds) => {
            const d = new Date(Date.now() + seconds * 1000);
            document.cookie = `${cname}=${cvalue}; expires=${d.toUTCString()}; path=/`;
        };

        /**
         * Retrieves the value of a specified cookie by its name.
         *
         * Parses the document's cookies to locate a cookie with the given name
         * and returns its value. If the specified cookie is not found, an empty
         * string is returned.
         *
         * @param {string} cname - The name of the cookie to retrieve.
         * @returns {string} The value of the specified cookie or an empty string
         *                   if the cookie does not exist.
         */
        const getCookie = cname =>
            document.cookie
                .split("; ")
                .find(cookie => cookie.startsWith(cname + "="))
                ?.split("=")[1] || "";

        /**
         * Handles the submission of the registration form.
         * Prevents the default form submission behavior, retrieves user input from the form fields,
         * stores the input values in cookies, and performs form validation before submitting.
         *
         * @param {Event} event - The event object associated with the form submission.
         */
        const handleRegisterSubmit = (event) => {
            event.preventDefault();

            const email = document.querySelector('input[name="email"]').value.trim;
            const firstName = document.querySelector('input[name="firstName"]').value.trim;
            const lastName = document.querySelector('input[name="lastName"]').value.trim;

            setCookie("email", email, REGISTER_SAVE_DATA_TIMER);
            setCookie("firstName", firstName, REGISTER_SAVE_DATA_TIMER);
            setCookie("lastName", lastName, REGISTER_SAVE_DATA_TIMER);

            const form = document.querySelector('form');
            if (form.checkValidity()) {
                form.submit();
            } else {
                form.reportValidity();
            }
        };

        // Public methods
        /**
         * Initializes the application by setting up event listeners.
         * Specifically, it waits for the DOM to fully load before adding
         * a click event listener to the 'RegisterButton' element. When
         * clicked, the button triggers the `handleRegisterSubmit` function.
         */
        const init = () => {
            document.addEventListener("DOMContentLoaded", () => {
                const registerButton = document.getElementById("RegisterButton");
                registerButton.addEventListener("click", handleRegisterSubmit);
            });
        };

        return {
            init: init,
            getCookie: getCookie
        };
    })();

    RegisterModule.init();
})();
