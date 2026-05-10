import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { sileo } from "sileo";

const GOOGLE_CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

const lightToastOpts = {
    fill: "#ffffff",
    styles: {
        title: "text-gray-800 font-bold",
        description: "text-gray-600",
    },
};

export default function GoogleAuth() {
    const handleSuccess = async (credentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const result = await authService.googleLogin(credentialResponse.credential);

                const userName =
                    result?.user?.first_name ||
                    result?.user?.username ||
                    localStorage.getItem("user_name") ||
                    "";
                if (userName) {
                    sessionStorage.setItem("show_welcome", userName);
                }

                window.location.href = "/";
            }
        } catch (error) {
            console.error("Fallo al autenticar con Google en el backend", error);
            sileo.error({ title: "No se pudo iniciar sesión con Google.", ...lightToastOpts });
        }
    };

    const handleError = () => {
        console.error('Login Failed');
        sileo.error({ title: "El inicio de sesión con Google falló o fue cancelado.", ...lightToastOpts });
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    theme="filled_black"
                    shape="pill"
                />
            </div>
        </GoogleOAuthProvider>
    );
}
