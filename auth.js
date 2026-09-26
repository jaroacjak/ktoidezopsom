/* =========================================================
   FIREBASE AUTH
   auth.js
   ========================================================= */

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

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
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyBiXQt7bHPI15wp4krGq-WgPz7BfsSvaEE",

  authDomain:
    "ktoidezopsom.firebaseapp.com",

  databaseURL:
    "https://ktoidezopsom-default-rtdb.firebaseio.com",

  projectId:
    "ktoidezopsom",

  storageBucket:
    "ktoidezopsom.firebasestorage.app",

  messagingSenderId:
    "354613832067",

  appId:
    "1:354613832067:web:ddf12b03ed6b4a61d8aeb6",

  measurementId:
    "G-Z8YC2L3RK7"
};


const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getDatabase(app);


/* =========================================================
   POMOCNÉ FUNKCIE
   ========================================================= */

function showError(message) {

  const errorElement =
    document.getElementById("errorMessage");

  if (errorElement) {

    errorElement.textContent = message;

    errorElement.style.display = "block";

  } else {

    alert(message);

  }

}


function showSuccess(message) {

  const successElement =
    document.getElementById("successMessage");

  if (successElement) {

    successElement.textContent = message;

    successElement.style.display = "block";

  }

}


function setLoading(loading) {

  const button =
    document.querySelector(
      "button[type='submit']"
    );

  if (!button) return;

  button.disabled = loading;

  if (loading) {

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "Načítavam...";

  } else {

    button.textContent =
      button.dataset.originalText ||
      "Pokračovať";

  }

}


/* =========================================================
   FIREBASE CHYBY
   ========================================================= */

function firebaseError(error) {

  switch (error.code) {

    case "auth/email-already-in-use":
      return "Tento e-mail je už zaregistrovaný.";

    case "auth/invalid-email":
      return "E-mailová adresa nie je platná.";

    case "auth/weak-password":
      return "Heslo je príliš slabé.";

    case "auth/user-not-found":
      return "Používateľ s týmto e-mailom neexistuje.";

    case "auth/wrong-password":
      return "Nesprávne heslo.";

    case "auth/invalid-credential":
      return "Nesprávny e-mail alebo heslo.";

    case "auth/too-many-requests":
      return "Príliš veľa pokusov. Skús to neskôr.";

    case "auth/network-request-failed":
      return "Nepodarilo sa pripojiť k Firebase.";

    default:
      return "Nastala chyba. Skús to znova.";

  }

}


/* =========================================================
   REGISTRÁCIA
   ========================================================= */

const registerForm =
  document.getElementById("registerForm");


if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const name =
        document
          .getElementById("name")
          ?.value
          .trim();

      const username =
        document
          .getElementById("username")
          ?.value
          .trim();

      const email =
        document
          .getElementById("email")
          ?.value
          .trim();

      const password =
        document
          .getElementById("password")
          ?.value;

      const passwordRepeat =
        document
          .getElementById("passwordRepeat")
          ?.value;


      /* VALIDÁCIA */

      if (!name) {

        showError(
          "Zadaj svoje meno a priezvisko."
        );

        return;
      }


      if (!username) {

        showError(
          "Zadaj používateľské meno."
        );

        return;
      }


      if (!email) {

        showError(
          "Zadaj e-mail."
        );

        return;
      }


      if (!password) {

        showError(
          "Zadaj heslo."
        );

        return;
      }


      if (password.length < 6) {

        showError(
          "Heslo musí mať aspoň 6 znakov."
        );

        return;
      }


      if (password !== passwordRepeat) {

        showError(
          "Heslá sa nezhodujú."
        );

        return;
      }


      setLoading(true);


      try {

        /* Vytvorenie Firebase účtu */

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        const user =
          userCredential.user;


        /* Uloženie profilu do Realtime Database */

        await set(
          ref(
            db,
            "users/" + user.uid
          ),
          {

            uid:
              user.uid,

            name:
              name,

            username:
              username,

            email:
              email,

            role:
              "user",

            createdAt:
              new Date().toISOString()

          }
        );


        showSuccess(
          "Registrácia bola úspešná. Presmerúvam ťa..."
        );


        setTimeout(() => {

          window.location.href =
            "app.html";

        }, 800);


      } catch (error) {

        console.error(error);

        showError(
          firebaseError(error)
        );

      } finally {

        setLoading(false);

      }

    }
  );

}


/* =========================================================
   PRIHLÁSENIE
   ========================================================= */

const loginForm =
  document.getElementById("loginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const login =
        document
          .getElementById("login")
          ?.value
          .trim();

      const password =
        document
          .getElementById("password")
          ?.value;


      if (!login) {

        showError(
          "Zadaj e-mail alebo používateľské meno."
        );

        return;
      }


      if (!password) {

        showError(
          "Zadaj heslo."
        );

        return;
      }


      setLoading(true);


      try {

        let email = login;


        /*
          Ak používateľ zadal username,
          nájdeme jeho e-mail v databáze.
        */

        if (!login.includes("@")) {

          const usersSnapshot =
            await get(
              ref(db, "users")
            );


          if (!usersSnapshot.exists()) {

            showError(
              "Používateľ neexistuje."
            );

            return;
          }


          const allUsers =
            usersSnapshot.val();


          let foundUser = null;


          for (
            const [uid, user]
            of Object.entries(allUsers)
          ) {

            if (
              user.username &&
              user.username.toLowerCase() ===
              login.toLowerCase()
            ) {

              foundUser = user;

              break;

            }

          }


          if (!foundUser) {

            showError(
              "Používateľ neexistuje."
            );

            return;
          }


          email =
            foundUser.email;

        }


        /* Firebase login */

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        window.location.href =
          "app.html";


      } catch (error) {

        console.error(error);

        showError(
          firebaseError(error)
        );

      } finally {

        setLoading(false);

      }

    }
  );

}


/* =========================================================
   ZABUDNUTÉ HESLO
   ========================================================= */

const forgotPassword =
  document.getElementById(
    "forgotPassword"
  );


if (forgotPassword) {

  forgotPassword.addEventListener(
    "click",
    async event => {

      event.preventDefault();


      const email =
        document
          .getElementById("login")
          ?.value
          .trim();


      if (!email || !email.includes("@")) {

        showError(
          "Najprv zadaj svoj e-mail."
        );

        return;
      }


      try {

        await sendPasswordResetEmail(
          auth,
          email
        );


        showSuccess(
          "Na e-mail sme poslali odkaz na obnovenie hesla."
        );


      } catch (error) {

        console.error(error);

        showError(
          firebaseError(error)
        );

      }

    }
  );

}


/* =========================================================
   ODHLÁSENIE
   ========================================================= */

const logoutBtn =
  document.getElementById("logoutBtn");


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(error);

        showError(
          "Odhlásenie sa nepodarilo."
        );

      }

    }
  );

}


/* =========================================================
   OCHRANA APP.HTML
   ========================================================= */

if (
  window.location.pathname.endsWith(
    "app.html"
  )
) {

  onAuthStateChanged(
    auth,
    user => {

      if (!user) {

        window.location.href =
          "login.html";

      }

    }
  );

}


/* =========================================================
   EXPORTY
   ========================================================= */

export {
  auth,
  db,
  firebaseError
};
