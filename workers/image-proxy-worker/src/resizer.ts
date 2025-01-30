export const resizeImage = async (imageData: ArrayBuffer, targetWidth: number) => {
	const { PhotonImage, resize, SamplingFilter } = await import('@cf-wasm/photon');

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

	return outputBytes;
};
