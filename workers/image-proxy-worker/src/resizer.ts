export const resizeImage = async (imageData: ArrayBuffer, targetWidth: number, imageUrl: string) => {
	const { PhotonImage, resize, SamplingFilter } = await import('@cf-wasm/photon');
	try {
		const inputBytes = new Uint8Array(imageData);

		const inputImage = PhotonImage.new_from_byteslice(inputBytes);

		const imageWidth = inputImage.get_width();
		const imageHeight = inputImage.get_height();

		// imageWidth : imageHeight = targetWidth : targetHeight
		const targetHeight = (imageHeight * targetWidth) / imageWidth;

		const outputImage = resize(inputImage, targetWidth, targetHeight, SamplingFilter.Nearest);

		const outputBytes = outputImage.get_bytes_webp();

		inputImage.free();
		outputImage.free();

		console.log('success');
		console.log(imageUrl);

		return outputBytes;
	} catch (e) {
		console.log('error');
		console.log(e);
		return imageData;
	}
};

//jpeg 에서 뭔가이상하다.
