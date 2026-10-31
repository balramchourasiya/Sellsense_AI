import mongoose from 'mongoose';
const ProductSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,unique:true}, barcode:{type:String,trim:true,default:''}, category:{type:String,default:'General'},
  price:{type:Number,required:true,min:0}, stock:{type:Number,required:true,min:0},
  lowStockAt:{type:Number,default:5,min:0}, updatedAt:{type:Date,default:Date.now}
},{timestamps:true});
export default mongoose.model('Product',ProductSchema);
