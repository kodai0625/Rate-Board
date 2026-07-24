/* RATE BOARD のオフライン動作用。
   海外でネットが無くても起動できるよう、アプリ本体を端末に持たせておく。

   方針はネットワーク優先。オンラインなら必ず最新版を取りに行き、
   取れなければ端末の控えを返す。更新のたびに CACHE の版を上げること。 */

var CACHE = "rate-board-v11";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);

  /* レートの取得先など外部への通信には一切手を出さない。
     ここを横取りするとオフライン判定が壊れ、内蔵値への切り替えが効かなくなる。 */
  if(url.origin !== self.location.origin) return;
  if(e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
