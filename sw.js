const CACHE = "content-v1" // name of the current cache
const OFFLINE = "/offline"

const AUTO_CACHE = [
    OFFLINE,
    "/",
    "/infant.webp",
    "/learn.webp",
    "/style.css",
    "Inter.woff2"
]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(AUTO_CACHE))
			.then(self.skipWaiting())
	)
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => CACHE !== cacheName)
			})
			.then((unusedCaches) => {
				console.debug("DESTROYING CACHE", unusedCaches.join(","))
				return Promise.all(
					unusedCaches.map((unusedCache) => {
						return caches.delete(unusedCache)
					})
				)
			})
			.then(() => self.clients.claim())
	)
})

self.addEventListener("fetch", (event) => {

	if (
		!event.request.url.startsWith(self.location.origin) ||
		event.request.method !== "GET"
	) {
		return void event.respondWith(fetch(event.request).catch((err) => console.log(err)))
	}

	if(!event.request.url.startsWith(self.location.origin)){
		event.respondWith(
			
			fetch(event.request)
			.then((response) => {
				caches.open(CACHE).then((cache) => {
					cache.put(event.request, response)
				})
				return response.clone()
			})
			.catch((_err) => {
				return caches.match(event.request).then((cachedResponse) => {
					if (cachedResponse) {
						return cachedResponse
					}

					return caches.open(CACHE).then((cache) => {
						const offlineRequest = new Request(OFFLINE)
						return cache.match(offlineRequest)
					})
				})
			})
			
		)
	} else {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response
				}

				return fetch(event.request).then((response) => {
					caches.open(CACHE).then((cache) => {
						cache.put(event.request, response)
					})
					return response.clone()
				})
			})
		)
	}

})