import mongoose from 'mongoose';
const showtimeSchema = new mongoose.Schema({
  time: { type: String, required: true },
  date: { type: String, required: true },
  price: { type: Number, default: 220 }
}, { _id: true });
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: String, required: true },
  duration: { type: String, required: true },
  rating: { type: String, default: 'UA 13+' },
  language: { type: String, default: 'English' },
  poster: { type: String, required: true },
  backdrop: { type: String, required: true },
  featured: { type: Boolean, default: false },
  showtimes: [showtimeSchema]
}, { timestamps: true });
export default mongoose.model('Movie', movieSchema);
