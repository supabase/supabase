import { useRef, useState } from "react";
import { supabase } from "../lib/api";

const Auth = () => {
    const [helperText, setHelperText] = useState({ error: null, text: null });
    const emailRef = useRef();
    const passwordRef = useRef();

    const handleLogin = async (type) => {
        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;

        const { user, error } =
            type === "LOGIN"
                ? await supabase.auth.signIn({ email, password })
                : await supabase.auth.signUp({ email, password });

        if (error) {
            setHelperText({ error: true, text: error.message });
        } else if (!user && !error) {
            setHelperText({
                error: false,
                text: "An email has been sent to you for verification!",
            });
        }
    };

    const handleOAuthLogin = async (provider) => {
        // You need to enable the third party auth you want in Authentication > Settings
        // Read more on: https://supabase.io/docs/guides/auth#third-party-logins
        let { error } = await supabase.auth.signIn({ provider });
        if (error) console.log("Error: ", error.message);
    };

    const forgotPassword = async (e) => {
        // Read more on https://supabase.io/docs/reference/javascript/reset-password-email#notes
        e.preventDefault();
        const email = prompt("Please enter your email:");

        if (email === null || email === "") {
            setHelperText({ error: true, text: "You must enter your email." });
        } else {
            let { error } = await supabase.auth.api.resetPasswordForEmail(
                email
            );
            if (error) {
                console.error("Error: ", error.message);
            } else {
                setHelperText({
                    error: false,
                    text: "Password recovery email has been sent.",
                });
            }
        }
    };

    return (
        <div
            className={
                "w-full h-full sm:h-auto sm:w-2/5 max-w-sm p-5 bg-white shadow flex flex-col text-base"
            }
        >
            <span
                className={
                    "font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center"
                }
            >
                Login
            </span>
            <label
                className={"mt-3 mb-2 font-medium text-lg"}
                htmlFor={"email"}
            >
                <span className={"font-mono mr-1 text-red-400"}>*</span>Email:
            </label>
            <input
                className={"bg-gray-100 border py-1 px-3"}
                type={"email"}
                name={"email"}
                ref={emailRef}
                required
            />
            <label
                className={"mt-3 mb-2 font-medium text-lg"}
                htmlFor={"password"}
            >
                <span className={"font-mono mr-1 text-red-400"}>*</span>
                Password:
            </label>
            <input
                className={"bg-gray-100 border py-1 px-3"}
                type={"password"}
                name={"password"}
                ref={passwordRef}
                required
            />
            <span
                className={
                    "text-blue-600 mt-2 cursor-pointer self-end text-sm font-medium"
                }
                onClick={forgotPassword}
            >
                Forgot Password?
            </span>
            {!!helperText.text && (
                <div
                    className={`border px-1 py-2 my-2 text-center text-sm ${
                        helperText.error
                            ? "bg-red-100 border-red-300 text-red-400"
                            : "bg-green-100 border-green-300 text-green-500"
                    }`}
                >
                    {helperText.text}
                </div>
            )}
            <div className="mt-2 flex">
                <span className="block mx-1.5 w-full rounded-md shadow-sm">
                    <button
                        type="submit"
                        onClick={() =>
                            handleLogin("REGISTER").catch(console.error)
                        }
                        className={
                            "border w-full border-blue-600 text-blue-600 flex justify-center py-2 px-4 text-sm font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                        }
                    >
                        Sign Up
                    </button>
                </span>
                <span className="block w-full mx-1.5 rounded-md shadow-sm">
                    <button
                        onClick={() => handleLogin("LOGIN")}
                        type="button"
                        className="flex w-full justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                    >
                        Sign In
                    </button>
                </span>
            </div>
            <div className="mt-3">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full mx-1.5 border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm leading-5">
                        <span className="px-2 bg-white text-gray-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div>
                    <div className="mt-3">
                        <span className="block rounded-md shadow-sm">
                            <button
                                onClick={() => handleOAuthLogin("github")}
                                type="button"
                                className="w-3/4 mx-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                            >
                                GitHub
                            </button>
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="block rounded-md shadow-sm">
                            <button
                                onClick={() => handleOAuthLogin("google")}
                                type="button"
                                className="w-3/4 mx-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                            >
                                Google
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
