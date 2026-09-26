import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


// ======================================================
// FIREBASE KONFIGURÁCIA
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyBiXQt7bHPI15wp4krGq-WzP7BfsSvaEE",
    authDomain: "ktoidezopsom.firebaseapp.com",
    databaseURL: "https://ktoidezopsom-default-rtdb.firebaseio.com",
    projectId: "ktoidezopsom",
    storageBucket: "ktoidezopsom.firebasestorage.app",
    messagingSenderId: "354613832067",
    appId: "1:354613832067:web:ddf12b03ed6b4a61d8aeb6",
    measurementId: "G-Z8YC2L3RK7"
};


// ======================================================
// FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ======================================================
// SPRÁVY
// ======================================================

function showError(message) {
    const error = document.getElementById("errorMessage");
    const success = document.getElementById("successMessage");

    if (success) {
        success.style.display = "none";
    }

    if (error) {
        error.textContent = message;
        error.style.display = "block";
    } else {
        alert(message);
    }
}


function showSuccess(message) {
    const error = document.getElementById("errorMessage");
    const success = document.getElementById("successMessage");

    if (error) {
        error.style.display = "none";
    }

    if (success) {
        success.textContent = message;
        success.style.display = "block";
    }
}


function setLoading(loading) {
    const button = document.querySelector(
        "#registerForm button[type='submit'], #loginForm button[type='submit']"
    );

    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = "Načítavam...";
    } else {
        button.disabled = false;
        button.textContent =
            button.dataset.originalText || button.textContent;
    }
}


// ======================================================
// FIREBASE CHYBY
// ======================================================

function firebaseError(error) {
    console.error("Firebase chyba:", error);

    if (!error) {
        return "Nastala neznáma chyba.";
    }

    switch (error.code) {

        case "auth/email-already-in-use":
            return "Tento e-mail už má vytvorený účet.";

        case "auth/invalid-email":
            return "E-mailová adresa nie je platná.";

        case "auth/weak-password":
            return "Heslo je príliš slabé. Použite aspoň 6 znakov.";

        case "auth/user-not-found":
            return "Používateľ s týmito údajmi neexistuje.";

        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Nesprávne prihlasovacie údaje.";

        case "auth/too-many-requests":
            return "Príliš veľa pokusov. Skúste to neskôr.";

        case "auth/network-request-failed":
            return "Nepodarilo sa pripojiť k Firebase. Skontrolujte internet.";

        case "auth/operation-not-allowed":
            return "Registrácia e-mailom a heslom nie je vo Firebase povolená.";

        case "auth/missing-password":
            return "Zadajte heslo.";

        case "auth/invalid-api-key":
            return "Firebase API kľúč nie je platný.";

        case "auth/app-not-authorized":
            return "Táto webová stránka nie je autorizovaná vo Firebase.";

        case "PERMISSION_DENIED":
        case "permission-denied":
            return "Firebase nepovolil prístup do databázy. Skontrolujte pravidlá Realtime Database.";

        default:
            return error.message
                ? "Firebase chyba: " + error.message
                : "Nastala neznáma chyba.";
    }
}


// ======================================================
// REGISTRÁCIA
// ======================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("name")?.value.trim() || "";

        const username =
            document.getElementById("username")?.value.trim() || "";

        const email =
            document.getElementById("email")?.value.trim() || "";

        const password =
            document.getElementById("password")?.value || "";

        const passwordRepeat =
            document.getElementById("passwordRepeat")?.value || "";


        showSuccess("");

        const error = document.getElementById("errorMessage");

        if (error) {
            error.style.display = "none";
        }


        // Kontrola mena
        if (!name) {
            showError("Zadajte meno a priezvisko.");
            return;
        }


        // Kontrola username
        if (!username) {
            showError("Zadajte používateľské meno.");
            return;
        }

        if (username.length < 3) {
            showError(
                "Používateľské meno musí mať aspoň 3 znaky."
            );
            return;
        }


        // Kontrola e-mailu
        if (!email) {
            showError("Zadajte e-mail.");
            return;
        }


        // Kontrola hesla
        if (password.length < 6) {
            showError(
                "Heslo musí mať aspoň 6 znakov."
            );
            return;
        }


        // Kontrola hesiel
        if (password !== passwordRepeat) {
            showError("Heslá sa nezhodujú.");
            return;
        }


        setLoading(true);


        try {

            // ==================================================
            // KONTROLA POUŽÍVATEĽSKÉHO MENA
            // ==================================================

            const usersSnapshot =
                await get(ref(db, "users"));

            if (usersSnapshot.exists()) {

                const users =
                    usersSnapshot.val();

                const usernameExists =
                    Object.values(users).some(user =>
                        user &&
                        user.username &&
                        user.username.toLowerCase() ===
                        username.toLowerCase()
                    );

                if (usernameExists) {

                    showError(
                        "Toto používateľské meno už niekto používa."
                    );

                    return;
                }
            }


            // ==================================================
            // VYTVORENIE ÚČTU
            // ==================================================

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            // ==================================================
            // PROFIL POUŽÍVATEĽA
            // ==================================================

            const userData = {
                uid: user.uid,
                name: name,
                username: username,
                email: email,
                role: "user",
                createdAt: new Date().toISOString()
            };


            await set(
                ref(db, "users/" + user.uid),
                userData
            );


            // ==================================================
            // HOTOVO
            // ==================================================

            showSuccess(
                "Účet bol úspešne vytvorený."
            );


            setTimeout(() => {
                window.location.href = "app.html";
            }, 700);


        } catch (error) {

            console.error(
                "Registrácia zlyhala:",
                error
            );

            showError(
                firebaseError(error)
            );

        } finally {

            setLoading(false);

        }

    });
}


// ======================================================
// PRIHLÁSENIE
// ======================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const login =
            document.getElementById("login")?.value.trim() || "";

        const password =
            document.getElementById("password")?.value || "";


        if (!login) {
            showError(
                "Zadajte používateľské meno alebo e-mail."
            );
            return;
        }


        if (!password) {
            showError("Zadajte heslo.");
            return;
        }


        setLoading(true);


        try {

            let email = login;


            // Prihlásenie cez username
            if (!login.includes("@")) {

                const usersSnapshot =
                    await get(ref(db, "users"));

                if (!usersSnapshot.exists()) {
                    showError(
                        "Používateľ s týmto menom neexistuje."
                    );
                    return;
                }


                const users =
                    usersSnapshot.val();


                const foundUser =
                    Object.values(users).find(user =>
                        user &&
                        user.username &&
                        user.username.toLowerCase() ===
                        login.toLowerCase()
                    );


                if (!foundUser || !foundUser.email) {
                    showError(
                        "Používateľ s týmto menom neexistuje."
                    );
                    return;
                }


                email = foundUser.email;
            }


            // Firebase login
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            window.location.href = "app.html";


        } catch (error) {

            console.error(
                "Prihlásenie zlyhalo:",
                error
            );

            showError(
                firebaseError(error)
            );

        } finally {

            setLoading(false);

        }

    });
}


// ======================================================
// ZABUDNUTÉ HESLO
// ======================================================

const forgotPassword =
    document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async function() {

            const login =
                document.getElementById("login")?.value.trim() || "";


            if (!login) {
                showError(
                    "Najskôr zadajte svoj e-mail alebo používateľské meno."
                );
                return;
            }


            let email = login;


            try {

                if (!login.includes("@")) {

                    const usersSnapshot =
                        await get(ref(db, "users"));


                    if (!usersSnapshot.exists()) {
                        showError(
                            "Používateľ nebol nájdený."
                        );
                        return;
                    }


                    const users =
                        usersSnapshot.val();


                    const foundUser =
                        Object.values(users).find(user =>
                            user &&
                            user.username &&
                            user.username.toLowerCase() ===
                            login.toLowerCase()
                        );


                    if (!foundUser || !foundUser.email) {
                        showError(
                            "Používateľ nebol nájdený."
                        );
                        return;
                    }


                    email = foundUser.email;
                }


                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showSuccess(
                    "Na váš e-mail bol odoslaný odkaz na obnovenie hesla."
                );


            } catch (error) {

                console.error(
                    "Obnovenie hesla zlyhalo:",
                    error
                );

                showError(
                    firebaseError(error)
                );

            }

        }
    );
}


// ======================================================
// ODHLÁSENIE
// ======================================================

const logoutButton =
    document.getElementById("logoutBtn");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Odhlásenie zlyhalo:",
                    error
                );

                showError(
                    firebaseError(error)
                );

            }

        }
    );
}


// ======================================================
// OCHRANA APP.HTML
// ======================================================

const isAppPage =
    window.location.pathname.endsWith("app.html");

if (isAppPage) {

    onAuthStateChanged(
        auth,
        function(user) {

            if (!user) {
                window.location.href =
                    "login.html";
            }

        }
    );

}


// ======================================================
// EXPORT
// ======================================================

export {
    auth,
    db,
    firebaseError
};
