export const resizeImage = async (imageData: ArrayBuffer) => {
	const { PhotonImage, resize, SamplingFilter } = await import('@cf-wasm/photon');

	const inputBytes = new Uint8Array(imageData);
	const inputImage = PhotonImage.new_from_byteslice(inputBytes);

	const outputImage = resize(inputImage, inputImage.get_width() * 0.2, inputImage.get_height() * 0.2, SamplingFilter.Nearest);

	const outputBytes = outputImage.get_bytes_webp();

	inputImage.free();
	outputImage.free();

	return outputBytes;
};
