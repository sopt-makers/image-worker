/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const width = url.searchParams.get('width');
		const imageUrl = url.searchParams.get('url');

		if (imageUrl == null) {
			return new Response('에러에러 url 이 널', { status: 400 });
		}

		if (width == null) {
			return new Response('에러에러 width가 널', { status: 400 });
		}

		//cache
		const cacheKey = new Request(url.toString());
		const cache = caches.default;

		let response = await cache.match(cacheKey);

		if (response == null) {
			console.log(`Response for request url: ${request.url} not present in cache. Fetching and caching request.`);
			const imageData = await fetch(imageUrl);

			response = new Response(imageData.body, {
				headers: {
					'Content-Type': 'image/png',
				},
			});

			response.headers.append('Cache-Control', 'public, s-maxage=10');

			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		} else {
			console.log(`Cache hit for: ${request.url}.`);
		}

		return response;
	},
} satisfies ExportedHandler<Env>;
