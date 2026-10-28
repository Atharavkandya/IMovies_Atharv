import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Booking from './models/Booking.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const sampleMovies = [
 {title:'Dune: Part Two',description:'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',genre:'Sci-Fi',duration:'2h 46m',rating:'UA 13+',language:'English',poster:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=85',featured:true},
 {title:'The Last Voyage',description:'A crew on a deep-space expedition discovers a signal that changes everything they know about humanity.',genre:'Adventure',duration:'2h 08m',rating:'UA 13+',language:'English',poster:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85',featured:false},
 {title:'Midnight in Paris',description:'One unexpected evening turns a simple trip into a romantic journey through art, memory, and possibility.',genre:'Romance',duration:'1h 54m',rating:'U',language:'English',poster:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=85',featured:false},
 {title:'Shadow Protocol',description:'A brilliant analyst races across the city to uncover a conspiracy before the clock runs out.',genre:'Thriller',duration:'2h 12m',rating:'A',language:'Hindi',poster:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85',featured:true},
 {title:'Kingdom of Dreams',description:'A young artist discovers a hidden world where every choice has the power to rewrite destiny.',genre:'Fantasy',duration:'2h 01m',rating:'UA 7+',language:'English',poster:'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=85',featured:false},
 {title:'Laughing Matters',description:'An aspiring comic finds that the road to the biggest stage is full of hilarious detours.',genre:'Comedy',duration:'1h 48m',rating:'UA 13+',language:'Hindi',poster:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85',backdrop:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=85',featured:false}
];
async function seedMovies() {
  if (await Movie.countDocuments()) return;
  const today = new Date();
  const date = new Date(today.getTime() + 86400000).toISOString().slice(0,10);
  const date2 = new Date(today.getTime() + 2*86400000).toISOString().slice(0,10);
  await Movie.insertMany(sampleMovies.map((m,i)=>({...m,showtimes:[
    {date,time:'10:30 AM',price:180+i*10},{date,time:'02:15 PM',price:220+i*10},{date,time:'06:45 PM',price:260+i*10},{date:date2,time:'09:30 PM',price:240+i*10}
  ]})));
  console.log('Seeded sample movies');
}
app.get('/api/health', (_,res)=>res.json({status:'ok',service:'IMovies API'}));
app.get('/api/movies', async (req,res,next)=>{
  try {
    const {search,genre}=req.query; const filter={};
    if (genre && genre!=='All') filter.genre=genre;
    if (search) filter.title={$regex:search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
    res.json(await Movie.find(filter).sort({featured:-1,title:1}));
  } catch(e){next(e)}
});
app.get('/api/movies/:id', async (req,res,next)=>{
  try { const m=await Movie.findById(req.params.id); if(!m)return res.status(404).json({message:'Movie not found'}); res.json(m); } catch(e){next(e)}
});
app.post('/api/auth/register', async (req,res,next)=>{
  try {
    const {name,email,password}=req.body;
    if(!name?.trim()||!email||!password||password.length<8) return res.status(400).json({message:'Enter your name, email, and a password of at least 8 characters.'});
    if(await User.findOne({email:email.toLowerCase()})) return res.status(409).json({message:'An account with this email already exists.'});
    const user=await User.create({name:name.trim(),email,passwordHash:await bcrypt.hash(password,12)});
    const token=jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.status(201).json({token,user:{id:user._id,name:user.name,email:user.email}});
  } catch(e){next(e)}
});
app.post('/api/auth/login', async (req,res,next)=>{
  try {
    const user=await User.findOne({email:(req.body.email||'').toLowerCase()});
    if(!user||!await bcrypt.compare(req.body.password||'',user.passwordHash)) return res.status(401).json({message:'Incorrect email or password.'});
    const token=jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.json({token,user:{id:user._id,name:user.name,email:user.email}});
  } catch(e){next(e)}
});
app.get('/api/auth/me',requireAuth,async(req,res,next)=>{
  try { const user=await User.findById(req.user.id).select('name email'); if(!user)return res.status(404).json({message:'User not found'}); res.json({id:user._id,name:user.name,email:user.email}); } catch(e){next(e)}
});
app.get('/api/bookings',requireAuth,async(req,res,next)=>{
  try { res.json(await Booking.find({user:req.user.id}).populate('movie','title poster genre duration').sort({createdAt:-1})); } catch(e){next(e)}
});
app.post('/api/bookings',requireAuth,async(req,res,next)=>{
  try {
    const {movieId,showtimeId,seats}=req.body;
    if(!movieId||!showtimeId||!Array.isArray(seats)||!seats.length||seats.length>10) return res.status(400).json({message:'Choose between 1 and 10 seats.'});
    if(new Set(seats).size!==seats.length || seats.some(s=>!/^[A-J](?:[1-9]|1[0-2])$/.test(s))) return res.status(400).json({message:'Invalid seat selection.'});
    const movie=await Movie.findById(movieId); if(!movie)return res.status(404).json({message:'Movie not found'});
    const show=movie.showtimes.id(showtimeId); if(!show)return res.status(404).json({message:'Showtime not found'});
    const existing=await Booking.find({movie:movieId,showtimeId,showDate:show.date,showTime:show.time,status:'confirmed'});
    const taken=new Set(existing.flatMap(b=>b.seats));
    if(seats.some(s=>taken.has(s))) return res.status(409).json({message:'One or more selected seats were just booked. Please choose again.'});
    const booking=await Booking.create({user:req.user.id,movie:movieId,showtimeId,showDate:show.date,showTime:show.time,seats,total:show.price*seats.length});
    res.status(201).json(await booking.populate('movie','title poster genre duration'));
  } catch(e){next(e)}
});
app.get('/api/movies/:movieId/showtimes/:showtimeId/seats',async(req,res,next)=>{
  try {
    const movie=await Movie.findById(req.params.movieId); if(!movie)return res.status(404).json({message:'Movie not found'});
    const show=movie.showtimes.id(req.params.showtimeId); if(!show)return res.status(404).json({message:'Showtime not found'});
    const bookings=await Booking.find({movie:movie._id,showtimeId:show._id,showDate:show.date,showTime:show.time,status:'confirmed'}).select('seats');
    res.json({takenSeats:bookings.flatMap(b=>b.seats),price:show.price,date:show.date,time:show.time});
  } catch(e){next(e)}
});
app.patch('/api/bookings/:id/cancel',requireAuth,async(req,res,next)=>{
  try {
    const booking=await Booking.findOne({_id:req.params.id,user:req.user.id});
    if(!booking)return res.status(404).json({message:'Booking not found'});
    if(booking.status==='cancelled')return res.status(400).json({message:'Booking is already cancelled'});
    booking.status='cancelled'; await booking.save(); res.json(booking);
  } catch(e){next(e)}
});
app.use((err,req,res,next)=>{
  console.error(err);
  if(err.name==='CastError')return res.status(400).json({message:'Invalid identifier'});
  res.status(500).json({message:'Something went wrong. Please try again.'});
});
const port=process.env.PORT||5000;
if(!process.env.JWT_SECRET) console.warn('WARNING: Set JWT_SECRET in .env before use.');
mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/imovies')
  .then(async()=>{console.log('MongoDB connected');await seedMovies();app.listen(port,()=>console.log(`IMovies API running on ${port}`));})
  .catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1)});
