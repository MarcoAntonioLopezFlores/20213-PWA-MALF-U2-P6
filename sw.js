importScripts("https://cdn.jsdelivr.net/npm/pouchdb@7.2.1/dist/pouchdb.min.js");

let path = "/20213-PWA-EF/";

const CACHE_STATIC_NAME = "static-v1";
const CACHE_INMUTABLE_NAME = "inmutable-v2";
const CACHE_DYNAMIC_NAME = "dynamic-v1";
const CACHE_NOTICES_NAME = "notices-v1";

var db = new PouchDB("comments");

function cleanCache(cacheName, sizeItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > sizeItems) {
        cache.delete(keys[0]).then(() => {
          cleanCache(cacheName, sizeItems);
        });
      }
    });
  });
}

self.addEventListener("install", (event) => {
  let location = self.location.href;
  if (location.includes("localhost")) {
    path = "/";
    urlAPI = "localhost";
  }
  const promeStatic = caches.open(CACHE_STATIC_NAME).then((cache) => {
    return cache.addAll([
      path + "",
      path + "index.html",
      path + "js/app.js",
      path + "css/page.css",
      path + "images/icons/android-launchericon-72-72.png",
      path + "images/icons/android-launchericon-96-96.png",
      path + "images/icons/android-launchericon-144-144.png",
      path + "images/icons/android-launchericon-192-192.png",
      path + "images/icons/android-launchericon-512-512.png",
    ]);
  });
  const promeInmutable = caches.open(CACHE_INMUTABLE_NAME).then((cache) => {
    return cache.addAll([
      "https://code.jquery.com/jquery-3.5.1.min.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css",
      "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.0/font/bootstrap-icons.css",
      "https://cdn.jsdelivr.net/npm/pouchdb@7.2.1/dist/pouchdb.min.js",
      "https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js",
      "https://www.gstatic.com/firebasejs/7.6.1/firebase-messaging.js",
    ]);
  });

  const promeCacheNotice = caches.open(CACHE_NOTICES_NAME);

  event.waitUntil(Promise.all([promeInmutable, promeStatic, promeCacheNotice]));
});

self.addEventListener("fetch", (event) => {
  let respuestaCache;
  if (event.request.url.includes("187.188.90.171")) {
    console.log("API");
    respuestaCache = managementNotices(event.request);
  } else {
    respuestaCache = caches.match(event.request).then((resp) => {
      // Si mi request existe en cache
      if (resp) {
        // respondemos con cache
        return resp;
      }
      // voy a la red
      return fetch(event.request)
        .then((respNet) => {
          // abro mi cache
          caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
            // guardo la respuesta de la red en cache
            cache.put(event.request, respNet).then(() => {
              cleanCache(CACHE_DYNAMIC_NAME, 5);
            });
          });
          //Respondo con el response de la red
          return respNet.clone();
        })
        .catch(() => {
          console.log("Error al solicitar el recurso");
        });
    });
  }
  event.respondWith(respuestaCache);
});

self.addEventListener("sync", (event) => {
  console.log("Evento sync active");
  if (event.tag === "post-comment") {
    const respPostComments = postCommentsFromPouch();
    event.waitUntil(respPostComments);
  }
});

const managementNotices = (req) => {
  console.log("entro management notices");
  if (req.clone().method === "POST") {
    console.log("POST COMMENT");
    if (self.registration.sync) {
      let comment = {};
      return req
        .clone()
        .formData()
        .then((formData) => {
          comment.postPerson = formData.get("postPerson");
          comment.content = formData.get("content");
          comment.datePublic = formData.get("datePublic");
          comment.notice = formData.get("notice");
          return saveCommentPouch(comment);
        });
    } else {
      console.log("NO sync");
      return fetch(req);
    }
  } else {
    return fetch(req.clone()).then((res) => {
      if (res.ok) {
        return updateNoticeCache(req, res.clone());
      } else {
        return caches.match(req);
      }
    });
  }
};

const updateNoticeCache = (req, res) => {
  if (res.ok) {
    return caches.open(CACHE_NOTICES_NAME).then((cache) => {
      cache.put(req, res.clone());
      return res.clone();
    });
  } else {
    return res;
  }
};

const saveCommentPouch = (comment) => {
  const data = {};
  comment._id = new Date().toISOString();

  return db.put(comment).then((result) => {
    self.registration.sync.register("post-comment");
    data.result = comment;
    data.type = "success";
    data.text = "comentario registrado en pouch db";

    const res = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res;
  });
};

const postCommentsFromPouch = () => {
  const posts = [];
  db.allDocs({ include_docs: true }).then((docs) => {
    docs.rows.forEach((row) => {
      const doc = row.doc;

      const form = new FormData();
      form.append("postPerson", doc.namePerson);
      form.append("content", doc.comment);
      form.append("notice", doc.notice);
      form.append("datePublic", doc.datePublic);

      const promiseResponse = fetch("http://187.188.90.171:8084/api/comment", {
        method: "POST",
        body: form,
      }).then((res) => {
        return db.remove(doc);
      });
      posts.push(promiseResponse);
    });
  });

  return Promise.all(posts);
};
