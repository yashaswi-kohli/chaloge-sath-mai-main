import fs from "fs";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "byasura",
  api_key: process.env.CLOUDINARY_API_KEY || "824536126862173",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "lbpHe4wjflCVuDcnXNh_wbrpqPs",
  secure: true,
});

const uploadOnCloudinary = async (localFilePath: string) :Promise<UploadApiResponse | null> => {
	try {
		if (!localFilePath) return null;
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
		});

		fs.unlinkSync(localFilePath);
		return response;
	} 
	catch (error) {
		fs.unlinkSync(localFilePath);
		console.log("Cloudinary Error: " + error);
		return null;
	}
};

const extractPublicIdFromUrl = async (imageUrl: string): Promise<string> => {
  const parts = imageUrl.split("/");
  const publicIdWithFormat = parts[parts.length - 1];
  const publicId = publicIdWithFormat.split(".")[0];
  return publicId;
};

const deleteFromCloudinary = async (publicId: string): Promise<any> => {
	try {
    	if (!publicId) throw new Error("required Public Id");
	
		const response = await cloudinary.uploader.destroy(publicId, {
		resource_type: "image",
		});
    	console.log(response);
    	return response;
	} 
	catch (error) {
    	console.log("Failed to delete url from cloudinary", error);
    	return null;
  	}
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicIdFromUrl };
