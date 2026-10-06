import httpStatus from "http-status";
import AppError from "../errors/app-error";
import cloudinary from "./cloudinary";

export const uploadToCloudinary = async (
	file: Express.Multer.File,
	folder: string,
	resourceType: "image" | "raw" | "auto" = "auto",
): Promise<{ secure_url: string; public_id: string }> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: `codeshift/${folder}`,
				resource_type: resourceType,
			},
			(error, result) => {
				if (error) {
					return reject(
						new AppError(
							httpStatus.INTERNAL_SERVER_ERROR,
							"File upload failed!",
						),
					);
				}

				if (result) {
					resolve({
						secure_url: result.secure_url,
						public_id: result.public_id,
					});
				}
			},
		);

		uploadStream.end(file.buffer);
	});
};

export const deleteFromCloudinary = async (
	publicId: string,
	resourceType: "image" | "raw" = "image",
) => {
	try {
		await cloudinary.uploader.destroy(publicId, {
			resource_type: resourceType,
		});
	} catch (error) {
		console.error("Failed to delete asset from Cloudinary:", error);
	}
};
