import mongoose from 'mongoose';
const SaleSchema = new mongoose.Schema({
  productName:{type:String,required:true,trim:true}, orderId:{type:String,default:''}, quantity:{type:Number,required:true,min:1},
  unitPrice:{type:Number,required:true,min:0}, total:{type:Number,required:true,min:0},
  paymentMethod:{type:String,enum:['UPI','Cash','Card'],default:'UPI'},
  paymentStatus:{type:String,enum:['PENDING','SUCCESS','FAILED'],default:'SUCCESS'},
  createdAt:{type:Date,default:Date.now}
},{timestamps:true});
export default mongoose.model('Sale',SaleSchema);
