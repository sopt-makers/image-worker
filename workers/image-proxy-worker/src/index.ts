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
		const isOriginal = url.searchParams.get('isOriginal') === 'true';

		if (imageUrl == null) {
			return new Response('이미지 url 이 없습니다.', { status: 400 });
		}

		if (widthStr == null || isNaN(Number(widthStr))) {
			return new Response('이미지 width 가 없습니다.', { status: 400 });
		}

		//S3 화이트리스트
		const whiteListUrl = [
			'https://makers-web-img.s3.ap-northeast-2.amazonaws.com',
			'https://s3.ap-northeast-2.amazonaws.com/sopt-makers-internal/', // s3 bucket name 은 고유한 값
		];

		const isAllowed = whiteListUrl.some((allowedUrl) => imageUrl?.startsWith(allowedUrl));

		if (!isAllowed) {
			return new Response('허용되지 않은 이미지 url 입니다.', { status: 403 });
		}
		//원본 이미지
		const unResizedImage = await fetch(imageUrl);

		if (isOriginal) {
			return unResizedImage;
		}

		const width = Number(widthStr);

		if (width >= 1000) {
			return unResizedImage;
		}

		// 캐싱
		const cacheKey = new Request(url.toString());
		const cache = caches.default;

		let response = await cache.match(cacheKey);

		if (response == null) {
			console.log(`Cache Miss: width=${width}, url=${url}`);

			const unResizedImage = await fetch(imageUrl);

			const resizedImage = await resizeImage(await unResizedImage.arrayBuffer(), width);

			response = new Response(resizedImage, {
				headers: {
					'Content-Type': 'image/webp',
				},
			});

			response.headers.append('Cache-Control', 'public, s-maxage=900');

			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		} else {
			console.log(`Cache Hit: width=${width}, url=${url}`);
		}

		return response;
	},
} satisfies ExportedHandler<Env>;
