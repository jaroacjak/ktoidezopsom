import { initializeApp }
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBiXQt7bHPI15wp4krGq-GwPz7BfsSvaEE",
  authDomain: "ktoidezopsom.firebaseapp.com",
  databaseURL: "https://ktoidezopsom-default-rtdb.firebaseio.com",
  projectId: "ktoidezopsom",
  storageBucket: "ktoidezopsom.firebasestorage.app",
  messagingSenderId: "354613832067",
  appId: "1:354613832067:web:ddf12b03ed6b4a61d8aeb6",
  measurementId: "G-Z8YC2L3RK7"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================================
   GLOBÁLNE PREMENNÉ
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let dogs = {};
let users = {};
let walks = {};
let substitutions = {};
let notifications = {};


/* =========================================================
   POMOCNÉ FUNKCIE
   ========================================================= */

function escapeHTML(value) {

  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(elementId, text, type = "success") {

  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = text;

  element.className = "message " + type;

  setTimeout(() => {
    element.className = "message";
  }, 4000);
}


function getUserName(uid) {

  if (users[uid]) {

    return (
      users[uid].name ||
      users[uid].username ||
      users[uid].email ||
      "Používateľ"
    );

  }

  if (uid === currentUser?.uid) {

    return (
      currentProfile?.name ||
      currentProfile?.username ||
      currentUser?.email ||
      "Používateľ"
    );

  }

  return "Neznámy používateľ";
}


function getDogName(id) {

  return dogs[id]?.name || "Neznámy pes";
}


/* =========================================================
   NAVIGÁCIA
   ========================================================= */

const titles = {

  home: "Domov",

  calendar: "Kalendár",

  dogs: "Psy",

  notifications: "Oznámenia",

  profile: "Môj profil",

  substitution: "Suplovanie",

  users: "Používatelia",

  admin: "Administrácia"

};


document.querySelectorAll(".nav-btn").forEach(button => {

  button.addEventListener("click", () => {

    const sectionName = button.dataset.section;

    document
      .querySelectorAll(".nav-btn")
      .forEach(btn => btn.classList.remove("active"));

    document
      .querySelectorAll(".section")
      .forEach(section => section.classList.remove("active"));

    button.classList.add("active");

    const section =
      document.getElementById("section-" + sectionName);

    if (section) {
      section.classList.add("active");
    }

    const pageTitle =
      document.getElementById("pageTitle");

    if (pageTitle) {
      pageTitle.textContent =
        titles[sectionName] || "Aplikácia";
    }

    const sidebar =
      document.getElementById("sidebar");

    if (sidebar) {
      sidebar.classList.remove("open");
    }

  });

});


/* =========================================================
   MOBILE MENU
   ========================================================= */

const mobileMenu =
  document.getElementById("mobileMenu");

if (mobileMenu) {

  mobileMenu.addEventListener("click", () => {

    document
      .getElementById("sidebar")
      ?.classList.toggle("open");

  });

}


/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */

onAuthStateChanged(auth, async user => {

  if (!user) {

    window.location.href = "login.html";

    return;
  }

  currentUser = user;

  const profileEmail =
    document.getElementById("profileEmail");

  if (profileEmail) {
    profileEmail.value = user.email || "";
  }

  await loadProfile(user.uid);

  setupRealtimeListeners();

  const loading =
    document.getElementById("loading");

  if (loading) {
    loading.style.display = "none";
  }

});


/* =========================================================
   PROFIL
   ========================================================= */

async function loadProfile(uid) {

  const userRef =
    ref(db, "users/" + uid);

  onValue(userRef, snapshot => {

    currentProfile =
      snapshot.val() || {};

    const name =
      currentProfile.name ||
      currentProfile.username ||
      currentUser?.email ||
      "Používateľ";

    const role =
      currentProfile.role ||
      "user";


    const sidebarUser =
      document.getElementById("sidebarUser");

    if (sidebarUser) {
      sidebarUser.textContent = name;
    }


    const topUser =
      document.getElementById("topUser");

    if (topUser) {
      topUser.textContent = name;
    }


    const welcomeText =
      document.getElementById("welcomeText");

    if (welcomeText) {

      welcomeText.textContent =
        "Vitaj, " +
        name +
        "! Tu nájdeš všetko potrebné na organizovanie venčenia.";

    }


    const profileName =
      document.getElementById("profileName");

    if (profileName) {
      profileName.value =
        currentProfile.name || "";
    }


    const profileUsername =
      document.getElementById("profileUsername");

    if (profileUsername) {
      profileUsername.value =
        currentProfile.username || "";
    }


    const profileRole =
      document.getElementById("profileRole");

    if (profileRole) {
      profileRole.value = role;
    }


    const adminNav =
      document.getElementById("adminNav");

    const usersNav =
      document.getElementById("usersNav");


    if (role === "admin") {

      if (adminNav) {
        adminNav.style.display = "block";
      }

      if (usersNav) {
        usersNav.style.display = "block";
      }

    } else {

      if (adminNav) {
        adminNav.style.display = "none";
      }

      if (usersNav) {
        usersNav.style.display = "none";
      }

    }

  });

}


/* =========================================================
   REALTIME DATABASE
   ========================================================= */

function setupRealtimeListeners() {


  /* USERS */

  onValue(ref(db, "users"), snapshot => {

    users =
      snapshot.val() || {};

    renderUsers();

    fillUserSelects();

  });


  /* DOGS */

  onValue(ref(db, "dogs"), snapshot => {

    dogs =
      snapshot.val() || {};

    const count =
      document.getElementById("dogCount");

    if (count) {
      count.textContent =
        Object.keys(dogs).length;
    }

    renderDogs();

    renderWalks();

    fillDogSelects();

  });


  /* WALKS */

  onValue(ref(db, "walks"), snapshot => {

    walks =
      snapshot.val() || {};

    const count =
      document.getElementById("walkCount");

    if (count) {
      count.textContent =
        Object.keys(walks).length;
    }

    renderWalks();

    renderHomeWalks();

  });


  /* SUBSTITUTIONS */

  onValue(ref(db, "substitutions"), snapshot => {

    substitutions =
      snapshot.val() || {};

    const count =
      document.getElementById("substitutionCount");

    if (count) {
      count.textContent =
        Object.keys(substitutions).length;
    }

    renderSubstitutions();

  });


  /* NOTIFICATIONS */

  onValue(ref(db, "notifications"), snapshot => {

    notifications =
      snapshot.val() || {};

    const count =
      document.getElementById("notificationCount");

    if (count) {
      count.textContent =
        Object.keys(notifications).length;
    }

    renderNotifications();

    renderHomeNotifications();

  });

}


/* =========================================================
   PSY
   ========================================================= */

function renderDogs() {

  const container =
    document.getElementById("dogsContainer");

  if (!container) return;

  const entries =
    Object.entries(dogs);


  if (!entries.length) {

    container.innerHTML =
      "<p>Zatiaľ nie sú pridané žiadne psy.</p>";

    return;
  }


  container.innerHTML =
    entries.map(([id, dog]) => {

      return `
        <div class="dog-card">

          <div class="dog-icon">🐕</div>

          <h3>
            ${escapeHTML(dog.name)}
          </h3>

          <p>
            <strong>Plemeno:</strong>
            ${escapeHTML(dog.breed || "Neuvedené")}
          </p>

          ${
            dog.note
              ? `<p>${escapeHTML(dog.note)}</p>`
              : ""
          }

        </div>
      `;

    }).join("");

}


/* =========================================================
   VENČENIA
   ========================================================= */

function sortWalks() {

  return Object.entries(walks)
    .sort((a, b) => {

      const first =
        `${a[1].date || ""} ${a[1].time || ""}`;

      const second =
        `${b[1].date || ""} ${b[1].time || ""}`;

      return first.localeCompare(second);

    });

}


function renderWalks() {

  const table =
    document.getElementById("walkTable");

  if (!table) return;

  const entries =
    sortWalks();


  if (!entries.length) {

    table.innerHTML = `
      <tr>
        <td colspan="5">
          Zatiaľ nie je naplánované žiadne venčenie.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    entries.map(([id, walk]) => {

      return `
        <tr>

          <td>
            ${escapeHTML(walk.date || "")}
          </td>

          <td>
            ${escapeHTML(walk.time || "")}
          </td>

          <td>
            ${escapeHTML(getDogName(walk.dogId))}
          </td>

          <td>
            ${escapeHTML(getUserName(walk.userId))}
          </td>

          <td>
            ${escapeHTML(walk.status || "Naplánované")}
          </td>

        </tr>
      `;

    }).join("");

}


function renderHomeWalks() {

  const container =
    document.getElementById("homeWalks");

  if (!container) return;

  const entries =
    sortWalks().slice(0, 5);


  if (!entries.length) {

    container.innerHTML =
      "<p>Zatiaľ nie sú naplánované žiadne venčenia.</p>";

    return;
  }


  container.innerHTML =
    entries.map(([id, walk]) => {

      return `
        <div style="
          padding:12px 0;
          border-bottom:1px solid #eee;
        ">

          <strong>
            ${escapeHTML(walk.date || "")}
            ${escapeHTML(walk.time || "")}
          </strong>

          <div style="
            color:#6b7280;
            margin-top:4px;
          ">

            🐕
            ${escapeHTML(getDogName(walk.dogId))}

            ·

            👤
            ${escapeHTML(getUserName(walk.userId))}

          </div>

        </div>
      `;

    }).join("");

}


/* =========================================================
   OZNÁMENIA
   ========================================================= */

function renderNotifications() {

  const container =
    document.getElementById("notificationsContainer");

  if (!container) return;

  const entries =
    Object.entries(notifications)
      .reverse();


  if (!entries.length) {

    container.innerHTML =
      "<p>Zatiaľ nie sú žiadne oznámenia.</p>";

    return;
  }


  container.innerHTML =
    entries.map(([id, notification]) => {

      return `
        <div class="notification">

          <strong>
            ${escapeHTML(
              notification.title ||
              "Oznámenie"
            )}
          </strong>

          <div>
            ${escapeHTML(
              notification.text || ""
            )}
          </div>

          ${
            notification.date
              ? `
                <small>
                  ${escapeHTML(notification.date)}
                </small>
              `
              : ""
          }

        </div>
      `;

    }).join("");

}


function renderHomeNotifications() {

  const container =
    document.getElementById("homeNotifications");

  if (!container) return;

  const entries =
    Object.entries(notifications)
      .reverse()
      .slice(0, 4);


  if (!entries.length) {

    container.innerHTML =
      "<p>Zatiaľ nie sú žiadne oznámenia.</p>";

    return;
  }


  container.innerHTML =
    entries.map(([id, notification]) => {

      return `
        <div style="
          padding:12px 0;
          border-bottom:1px solid #eee;
        ">

          <strong>
            ${escapeHTML(
              notification.title ||
              "Oznámenie"
            )}
          </strong>

          <div style="
            color:#6b7280;
            margin-top:4px;
          ">
            ${escapeHTML(
              notification.text || ""
            )}
          </div>

        </div>
      `;

    }).join("");

}


/* =========================================================
   SUPLOVANIE
   ========================================================= */

function renderSubstitutions() {

  const table =
    document.getElementById("substitutionTable");

  if (!table) return;

  const entries =
    Object.entries(substitutions);


  if (!entries.length) {

    table.innerHTML = `
      <tr>
        <td colspan="5">
          Zatiaľ nie je evidované žiadne suplovanie.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    entries.map(([id, item]) => {

      return `
        <tr>

          <td>
            ${escapeHTML(item.date || "")}
          </td>

          <td>
            ${escapeHTML(
              getUserName(item.originalUserId)
            )}
          </td>

          <td>
            ${escapeHTML(
              getUserName(item.replacementUserId)
            )}
          </td>

          <td>
            ${escapeHTML(
              getDogName(item.dogId)
            )}
          </td>

          <td>
            ${escapeHTML(item.reason || "")}
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   POUŽÍVATELIA
   ========================================================= */

function renderUsers() {

  const table =
    document.getElementById("usersTable");

  if (!table) return;

  const entries =
    Object.entries(users);


  if (!entries.length) {

    table.innerHTML = `
      <tr>
        <td colspan="4">
          Zatiaľ nie sú registrovaní používatelia.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    entries.map(([uid, user]) => {

      return `
        <tr>

          <td>
            ${escapeHTML(user.name || "")}
          </td>

          <td>
            ${escapeHTML(user.username || "")}
          </td>

          <td>
            ${escapeHTML(user.email || "")}
          </td>

          <td>
            ${escapeHTML(user.role || "user")}
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   SELECT - PSY
   ========================================================= */

function fillDogSelects() {

  const selects = [

    document.getElementById("walkDog"),

    document.getElementById("subDog")

  ];


  selects.forEach(select => {

    if (!select) return;

    const currentValue =
      select.value;


    select.innerHTML =
      `<option value="">Vyber psa</option>`;


    Object.entries(dogs)
      .forEach(([id, dog]) => {

        const option =
          document.createElement("option");

        option.value = id;

        option.textContent =
          dog.name || "Pes";

        select.appendChild(option);

      });


    select.value =
      currentValue;

  });

}


/* =========================================================
   SELECT - POUŽÍVATELIA
   ========================================================= */

function fillUserSelects() {

  const selects = [

    document.getElementById("walkUser"),

    document.getElementById("subOriginalUser"),

    document.getElementById("subReplacementUser")

  ];


  selects.forEach(select => {

    if (!select) return;

    const currentValue =
      select.value;


    select.innerHTML =
      `<option value="">Vyber používateľa</option>`;


    Object.entries(users)
      .forEach(([id, user]) => {

        const option =
          document.createElement("option");

        option.value = id;

        option.textContent =
          user.name ||
          user.username ||
          user.email ||
          "Používateľ";

        select.appendChild(option);

      });


    select.value =
      currentValue;

  });

}


/* =========================================================
   ULOŽENIE PROFILU
   ========================================================= */

const profileForm =
  document.getElementById("profileForm");

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!currentUser) return;


      try {

        await update(
          ref(
            db,
            "users/" + currentUser.uid
          ),
          {

            name:
              document
                .getElementById("profileName")
                .value
                .trim(),

            username:
              document
                .getElementById("profileUsername")
                .value
                .trim()

          }
        );


        showMessage(
          "profileMessage",
          "Profil bol úspešne uložený."
        );


      } catch (error) {

        console.error(error);

        showMessage(
          "profileMessage",
          "Profil sa nepodarilo uložiť.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   ADMIN - PRIDAŤ PSA
   ========================================================= */

const addDogForm =
  document.getElementById("addDogForm");

if (addDogForm) {

  addDogForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (currentProfile?.role !== "admin") {
        return;
      }


      try {

        const newDogRef =
          push(ref(db, "dogs"));


        await set(
          newDogRef,
          {

            name:
              document
                .getElementById("dogName")
                .value
                .trim(),

            breed:
              document
                .getElementById("dogBreed")
                .value
                .trim(),

            note:
              document
                .getElementById("dogNote")
                .value
                .trim(),

            createdAt:
              new Date().toISOString(),

            createdBy:
              currentUser.uid

          }
        );


        event.target.reset();


        showMessage(
          "adminMessage",
          "Pes bol úspešne pridaný."
        );


      } catch (error) {

        console.error(error);

        showMessage(
          "adminMessage",
          "Psa sa nepodarilo pridať.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   ADMIN - PRIDAŤ VENČENIE
   ========================================================= */

const addWalkForm =
  document.getElementById("addWalkForm");

if (addWalkForm) {

  addWalkForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (currentProfile?.role !== "admin") {
        return;
      }


      try {

        const newWalkRef =
          push(ref(db, "walks"));


        await set(
          newWalkRef,
          {

            date:
              document
                .getElementById("walkDate")
                .value,

            time:
              document
                .getElementById("walkTime")
                .value,

            dogId:
              document
                .getElementById("walkDog")
                .value,

            userId:
              document
                .getElementById("walkUser")
                .value,

            status:
              "Naplánované",

            createdAt:
              new Date().toISOString(),

            createdBy:
              currentUser.uid

          }
        );


        event.target.reset();


        showMessage(
          "adminMessage",
          "Venčenie bolo úspešne pridané."
        );


      } catch (error) {

        console.error(error);

        showMessage(
          "adminMessage",
          "Venčenie sa nepodarilo pridať.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   ADMIN - SUPLOVANIE
   ========================================================= */

const addSubstitutionForm =
  document.getElementById(
    "addSubstitutionForm"
  );

if (addSubstitutionForm) {

  addSubstitutionForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (currentProfile?.role !== "admin") {
        return;
      }


      try {

        const newSubRef =
          push(
            ref(
              db,
              "substitutions"
            )
          );


        await set(
          newSubRef,
          {

            date:
              document
                .getElementById("subDate")
                .value,

            dogId:
              document
                .getElementById("subDog")
                .value,

            originalUserId:
              document
                .getElementById("subOriginalUser")
                .value,

            replacementUserId:
              document
                .getElementById("subReplacementUser")
                .value,

            reason:
              document
                .getElementById("subReason")
                .value
                .trim(),

            createdAt:
              new Date().toISOString(),

            createdBy:
              currentUser.uid

          }
        );


        event.target.reset();


        showMessage(
          "adminMessage",
          "Suplovanie bolo úspešne pridané."
        );


      } catch (error) {

        console.error(error);

        showMessage(
          "adminMessage",
          "Suplovanie sa nepodarilo pridať.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   ADMIN - OZNÁMENIE
   ========================================================= */

const addNotificationForm =
  document.getElementById(
    "addNotificationForm"
  );

if (addNotificationForm) {

  addNotificationForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (currentProfile?.role !== "admin") {
        return;
      }


      try {

        const newNotificationRef =
          push(
            ref(
              db,
              "notifications"
            )
          );


        await set(
          newNotificationRef,
          {

            title:
              document
                .getElementById("notificationTitle")
                .value
                .trim(),

            text:
              document
                .getElementById("notificationText")
                .value
                .trim(),

            date:
              new Date()
                .toLocaleDateString("sk-SK"),

            createdAt:
              new Date().toISOString(),

            createdBy:
              currentUser.uid

          }
        );


        event.target.reset();


        showMessage(
          "adminMessage",
          "Oznámenie bolo úspešne pridané."
        );


      } catch (error) {

        console.error(error);

        showMessage(
          "adminMessage",
          "Oznámenie sa nepodarilo pridať.",
          "error"
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

        alert(
          "Odhlásenie sa nepodarilo."
        );

      }

    }
  );

}
