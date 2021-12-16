let pathSw = "/20213-PWA-EF/sw.js";
let url = window.location.href;

let swReg;
if (navigator.serviceWorker) {
  if (url.includes("localhost")) {
    pathSw = "/sw.js";
  }
  navigator.serviceWorker.register(pathSw).then((registrationSW) => {
    swReg = registrationSW;
  });
}

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgzlkevRCu2QsmtpeRsielTNNlrq_7gjI",
  authDomain: "authfirebase-1f20b.firebaseapp.com",
  projectId: "authfirebase-1f20b",
  storageBucket: "authfirebase-1f20b.appspot.com",
  messagingSenderId: "373769965574",
  appId: "1:373769965574:web:6c65fe7e70cd9862bff387",
  measurementId: "G-3HLMVMNNP3",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

let idNoticeInput = $("#idNotice");
let titleNotice = $("#titleNotice");
let initialNotice = $("#initialNotice");
let bannerNotice = $("#bannerNotice");
let hashTagNotice = $("#hashTagNotice");
let dateNotice = $("#dateNotice");
let descriptionNotice = $("#descriptionNotice");
let commentsNotice = $("#comentarios");
let commentTxt = $("#comment");

let principal = $("#principal");
let notice = $("#notice");

let btnVerMas = $("#btnVerMas");
let btnSaveName = $("#btnSaveName");
let btnComentar = $("#btnComentar");
let btnSuscribe = $("#btnSuscribe");
let personNameTxt = $("#personName");

let page = 0;
let totalPages = 0;
let personName = "pwa-2021";

btnSuscribe.on("click", function () {
  console.log("Suscripcion");
  //checkNotification();
  messaging
    .requestPermission()
    .then(() => {
      return messaging.getToken({
        vapidKey:
          "BLGNupKFtSJCDbAXAAcQLPpDPUnjKFXHtPB5zWx4BNqJlhNkop9H13LnutMKentPxY0vI80Vwuf9wXnrYMWF638",
      });
    })
    .then((token) => {
      $("#token").text(token);
    })
    .catch((error) => {
      console.log(error);
    });

  messaging.onMessage((payload) => {
    console.log(payload);
    const options = {
      body: payload.notification.body,
      icon: "images/icons/android-launchericon-48-48.png",
    };
    //new Notification(payload.notification.title, options);
    return swReg.showNotification(payload.notification.title, options);
  });
});

function checkNotification() {
  if (!window.Notification) {
    console.log("No soporta notificaciones");
    return;
  }

  if (Notification.permission === "granted") {
    console.log("Ya permitido");
    showNotification();
  } else if (
    Notification.permission !== "denied" ||
    Notification.permission === "default"
  ) {
    Notification.requestPermission(function (permission) {
      console.log("El permiso:>" + permission);
      if (permission === "granted") {
        showNotification();
      }
    });
  }
}

function showNotification() {
  new Notification(title, options);
}

btnVerMas.on("click", function () {
  if (page < totalPages - 1) {
    page++;
    loadNotices(page);
  } else {
    alert("Ya no hay más noticias");
  }
});
$("#notices").on("click", ".btn-seguir", function (e) {
  e.preventDefault();

  let idNotice = $(this).data("id-notice");

  fetch(`http://187.188.90.171:8084/api/notice/${idNotice}`)
    .then((res) => res.json())
    .then((resJSON) => {
      assignNotice(resJSON.result);
      principal.fadeOut(function () {
        notice.fadeIn(1000);
      });
    })
    .catch((err) => {
      alert("Ups ocurrio algo");
    });
});

btnSaveName.on("click", function () {
  if (personNameTxt.val().length > 0) {
    personName = personNameTxt.val();
    $(".modal-name").modal("toggle");
    btnComentar.click();
  } else {
    alert("Ingresa un nombre");
  }
});

btnComentar.on("click", function () {
  if (commentTxt.val().length > 0) {
    if (personName !== "pwa-2021") {
      //console.log(personName, commentTxt.val(), idNoticeInput.val());
      postComment(personName, commentTxt.val(), idNoticeInput.val());
    } else {
      $(".modal-name").modal("toggle");
      btnComentar.click();
    }
  } else {
    alert("Comenta algo :D");
  }
});

$(".btn-regresar").on("click", function () {
  console.log("Regresar");
  notice.fadeOut(function () {
    principal.fadeIn(1000);
  });
});

function assignNotice(notice) {
  idNoticeInput.val(notice.id);
  titleNotice.html(notice.title);
  initialNotice.html(notice.initialDescription);
  bannerNotice.attr(
    "src",
    "data:image/png;base64," + notice.attachedNotice.file
  );
  let date = new Date(notice.datePublic);
  dateNotice.html(date.toLocaleDateString("en-US"));
  hashTagNotice.html(notice.hashTag);
  descriptionNotice.html(notice.description);
  commentsNotice.html("");
  notice.comments.forEach((comment) => {
    commentsNotice.append(createComment(comment));
  });
}

function createComment(comment) {
  return $(`
  <div class="card">
        <div class="card-body">
            <h5 class="card-title">${comment.postPerson}</h5>
            <p class="card-text">${comment.content}</p>
        </div>
    </div>
`);
}

function loadNotices(page) {
  fetch("http://187.188.90.171:8084/api/notice/page/" + page)
    .then((res) => res.json())
    .then((resp) => {
      totalPages = resp.totalPages;
      resp.content.forEach((notice) => {
        let noticeHtml = createNotice(notice);

        $("#notices").append(noticeHtml);
      });
    })
    .catch((err) => {
      alert("Se presento un error cargar las noticias");
    });
}

function createNotice(notice) {
  return $(`
    <div class="col-12 pt-2 pb-2 border-bottom border-success">
    <img src="data:image/jpeg;base64,${notice.attachedNotice.file}" class="img-fluid" alt="">
    <h4>${notice.title}</h4>
    <div class="row">
        <div class="col-6 text-muted text-center">
            ${notice.datePublic}
        </div>
        <div class="col-6 text-info text-center font-italic ">
            ${notice.hashTag}
        </div>
    </div>
    <div class="font-italic text-justify">
        ${notice.initialDescription}
    </div>
    <a href="" class="float-right btn btn-sm btn-info btn-seguir" data-id-notice="${notice.id}"  >Seguir leyendo...</a>
</div>
`);
}

function postComment(namePerson, comment, idNotice) {
  const form = new FormData();

  form.append("postPerson", namePerson);
  form.append("content", comment);
  form.append("notice", idNotice);
  form.append("datePublic", new Date().toLocaleDateString("en-CA"));

  console.log(form);
  fetch("http://187.188.90.171:8084/api/comment", {
    method: "POST",
    body: form,
  }).then((res) => {
    res.json().then((data) => {
      console.log(data);
      commentsNotice.append(createComment(data.result));
      resetComment();
    });
  });
}

function resetComment() {
  commentTxt.val(" ");
}

loadNotices(0);
