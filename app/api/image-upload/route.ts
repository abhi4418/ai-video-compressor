import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest , NextResponse } from 'next/server';

cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id : string ;
    [key :string] : any
}

export default async function POST(req : NextRequest){
    try {

        const {userId} = await auth() ;

        if(!userId){
            return NextResponse.json({
                "error" : "Unauthorized"
            } , {status : 401});
        }

        if(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ){
            return NextResponse.json({
                "error" : "CLoudinary credentials not found"
            } , {status : 500});
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if(!file){
            return NextResponse.json({
                "error" : "No file found"
            } , {status : 400});
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<CloudinaryUploadResult>((resolve , reject) => {
            const uploadStream  = cloudinary.uploader.upload_stream({folder : "Cloudinary-Sass-Images"} , (error , result) => {
                if(error){
                    reject(error);
                }
                resolve(result as CloudinaryUploadResult);
            });
            uploadStream.end(buffer) ;
        });

        return NextResponse.json({
            publicId : result.public_id 
        } , {status : 200});

    } catch (error) {
        console.log("Upload image failed " , error) ;
        return NextResponse.json({
            "error" : "Upload image failed"
        } , {status : 500});
    }
}