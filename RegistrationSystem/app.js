import http, { request } from "node:http";
import fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import os from "node:os";
import path from "node:path";
import {URL} from "node:url";
import EventEmitter from "node:events";
const PORT=3000;
const emitter=new EventEmitter();
const dataFolder=path.join("data");
const filePath=path.join(dataFolder,"participants.txt");
await fs.mkdir(dataFolder,{recursive:true});
emitter.on("participantRegistered",(name)=>{
    console.log(`New Participant registered: ${name}`);
});
const server=http.createServer(async(request,response)=>{
    response.writeHead(200,{
        "Content-Type":"text/plain"
    });
    if(request.url==="/"){
        response.end("Welcome to Workshope Registration System");
    }
    else if(request.url.startsWith("/register")){
        const myURL=new URL(request.url,`http://${request.headers.host}`);
        const name=myURL.searchParams.get("name");
        const course=myURL.searchParams.get("course");
        if(!name||!course){
            response.statusCode=400;
            return response.end("Please provide name and course");
        }
        const participant=`Name: ${name}
        Course: ${course}\n`;
        try{
            await fs.appendFile(filePath,participant);
            emitter.emit("participantRegistered",name);
            response.end("Participant registered successfully");
        }
        catch(err){
            response.statusCode=500;
            response.end("Unable to save participants");
        }
    }
    else if(request.url==="/participants"){
        try{
            const data=await fs.readFile(filePath,"utf8");
            response.end(data);
        }
        catch{
            response.statusCode=404;
            response.end("No participants found");
        }
    }
    else if(request.url==="/system"){
        const systemInfo=`Operating System: ${os.platform()}
        Architecure: ${os.arch()}
        Hostname: ${os.hostname()}
        Home Directory: ${os.homedir()}
        `;
        response.end(systemInfo);
    }
    else if(request.url==="/download-report"){
        const readStream=createReadStream(filePath);
        readStream.on("error",(err)=>{
            console.log(err);
            response.statusCode=500;
            response.end("Error reading report file");
        });
        readStream.pipe(response);
    }
    else{
        response.statusCode=404;
        response.end("404 Page Not Found");
    }
});
server.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`);
});