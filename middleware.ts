import { clerkMiddleware , createRouteMatcher} from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';


const isPublicRoute = createRouteMatcher([
    "/sign-in" ,
    "/sign-up" ,
    "/" ,
    "/home"
])

const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
])

export default clerkMiddleware((auth , req)=>{
    const {userId} = auth() ;
    const currentURL = new URL(req.url) ;
    const isAccessingDashboard = currentURL.pathname==="/home" ;
    const isApiRequest = currentURL.pathname.startsWith("/api") ;

    if(userId && isPublicRoute(req) && !isAccessingDashboard){
        return NextResponse.redirect(new URL("/home" , req.url)) ;
    }

    // NOT LOGGED IN
    if(!userId){
        // accessing protected routes
        if(!isPublicRoute(req) && !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/sign-in" , req.url)) ;
        }

        // is trying to access protected api route
        if(isApiRequest && !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/sign-in" , req.url)) ;
        } 
    }

    return NextResponse.next() ;
})


export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};