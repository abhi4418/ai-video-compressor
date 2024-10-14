import { v2 as cloudinary } from 'cloudinary';
import { NextRequest , NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() ;

cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id : string ;
    bytes : number ;
    duration? : number ;
    [key :string] : any
}

export async function POST(req : NextRequest){
    try {

        const {userId} = auth() ;

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
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;

        if(!file){
            return NextResponse.json({
                "error" : "No file found"
            } , {status : 400});
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<CloudinaryUploadResult>((resolve , reject) => {
            const uploadStream  = cloudinary.uploader.upload_stream({folder : "Cloudinary-Sass-Videos"} , (error , result) => {
                if(error){
                    reject(error);
                }
                resolve(result as CloudinaryUploadResult);
            });
            uploadStream.end(buffer) ;
        });

        const video = prisma.video.create({
            data : {
                title ,
                description ,
                originalSize ,
                compressedSize : String(result.bytes),
                publicId : result.public_id ,
                duration : result.duration || 0
            }
        });

        return NextResponse.json(video) ;

    } catch (error) {
        console.log("Upload video failed " , error) ;
        return NextResponse.json({
            "error" : "Upload video failed"
        } , {status : 500});
    }
    finally {
        prisma.$disconnect() ;
    }
}