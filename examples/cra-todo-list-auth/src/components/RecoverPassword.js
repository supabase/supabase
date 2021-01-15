import { supabase } from "../lib/api";
import { useRef } from "react";

const RecoverPassword = ({ token, setRecoveryToken }) => {
    const newPasswordRef = useRef();

    const handleNewPassword = async () => {
        const newPassword = newPasswordRef.current.value;
        const { error } = await supabase.auth.api.updateUser(token, {
            password: newPassword,
        });

        if (!error) {
            // To render our Todo list again
            setRecoveryToken(null);
        } else {
            console.error(error);
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
                    "font-sans text-2xl text-center pb-2 mb-1 border-b mx-4 align-center"
                }
            >
                Recover Password
            </span>
            <label className={"mt-3 mb-2 text-lg"} htmlFor={"email"}>
                <span className={"font-mono mr-1 text-red-400"}>*</span>Enter
                new password:
            </label>
            <input
                className={"bg-gray-100 border py-1 px-3"}
                type="password"
                ref={newPasswordRef}
                required
            />
            <span className="block mt-4 rounded-md shadow-sm">
                <button
                    onClick={handleNewPassword}
                    type="button"
                    className="flex mx-auto justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                >
                    Change Password
                </button>
            </span>
        </div>
    );
};

export default RecoverPassword;
