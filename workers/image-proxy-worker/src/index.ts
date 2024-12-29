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

import { resizeImage } from './resizer';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const widthStr = url.searchParams.get('width');
		const imageUrl = url.searchParams.get('url');

		if (imageUrl == null) {
			return new Response('에러에러 url 이 널', { status: 400 });
		}

		if (widthStr == null || isNaN(Number(widthStr))) {
			return new Response('에러에러 width가 널', { status: 400 });
		}

		const width = Number(widthStr);

		// TODO: url이 메이커스 이미지 URL만 허용하도록
		// 다양한 이미지 확정자를 다 받을 수 있는지, 큰 이미지 받을 수 있는지, 못 받으면 cpu 시간 높이기, 캐시 잘 되는지 로그, 브라우저 캐시 클플 요청 자체를 브라우저 캐시가 줄일 수 있음, 도메인, 커스텀 로더, 브라우저별로도,

		//cache
		const cacheKey = new Request(url.toString());
		const cache = caches.default;

		let response = await cache.match(cacheKey);

		if (response == null) {
			console.log(`Cache Miss: width=${width}, url=${url}`);

			const imageData = await fetch(imageUrl);

			const resizedImage = await resizeImage(await imageData.arrayBuffer(), width);

			response = new Response(resizedImage, {
				headers: {
					'Content-Type': 'image/webp',
				},
			});

			response.headers.append('Cache-Control', 'public, s-maxage=10');

			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		} else {
			console.log(`Cache Hit: width=${width}, url=${url}`);
		}

		return response;
	},
} satisfies ExportedHandler<Env>;
