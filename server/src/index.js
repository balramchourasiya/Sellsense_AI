import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import api from './routes/api.js';
import sarvam from './routes/sarvam.js';
const app=express();const port=process.env.PORT||5000;
const allowedOrigins=(process.env.CLIENT_ORIGIN||'').split(',').map(value=>value.trim()).filter(Boolean);
app.use(cors({origin:(origin,callback)=>{if(!origin||allowedOrigins.length===0||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('Origin is not allowed by the server.'));}}));app.use(express.json({limit:'1mb'}));app.use(morgan('dev'));
app.get('/',(_,res)=>res.json({name:'SellSense AI API',status:'running',docs:'See README.md',mode:'local'}));app.use('/api',api);app.use('/api/sarvam',sarvam);
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Internal server error'});});
if(process.env.MONGODB_URI){mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('MongoDB connected; using MongoDB persistence.')).catch(e=>console.error('MongoDB connection failed; JSON fallback is still available:',e.message));}
app.listen(port,()=>console.log(`SellSense API listening on http://localhost:${port}`));
