import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const file=process.env.VERCEL==='1'
 ?path.join('/tmp','sellsense-ai','store-data.json')
 :path.resolve(here,'../../data/store-data.json');
let memory=null;
const initial={sales:[
 {id:'s1',productName:'Masala Chips',quantity:2,unitPrice:20,total:40,paymentMethod:'UPI',paymentStatus:'SUCCESS',createdAt:new Date().toISOString()},
 {id:'s2',productName:'Milk 1L',quantity:1,unitPrice:64,total:64,paymentMethod:'UPI',paymentStatus:'PENDING',createdAt:new Date(Date.now()-3600000).toISOString()},
 {id:'s3',productName:'Basmati Rice 1kg',quantity:1,unitPrice:120,total:120,paymentMethod:'Cash',paymentStatus:'SUCCESS',createdAt:new Date(Date.now()-7200000).toISOString()},
 {id:'s4',productName:'Masala Chips',quantity:3,unitPrice:20,total:60,paymentMethod:'UPI',paymentStatus:'SUCCESS',createdAt:new Date(Date.now()-86400000).toISOString()}
],products:[
 {id:'p1',name:'Masala Chips',barcode:'8901000000019',category:'Snacks',price:20,stock:8,lowStockAt:10},
 {id:'p2',name:'Milk 1L',barcode:'8901000000026',category:'Dairy',price:64,stock:3,lowStockAt:5},
 {id:'p3',name:'Basmati Rice 1kg',barcode:'8901000000033',category:'Grocery',price:120,stock:14,lowStockAt:5},
 {id:'p4',name:'Soap',barcode:'8901000000040',category:'Personal care',price:35,stock:4,lowStockAt:6},
 {id:'p5',name:'Tea 250g',barcode:'8901000000057',category:'Grocery',price:95,stock:11,lowStockAt:4},
 {id:'p6',name:'Biscuit Packet',barcode:'8901000000064',category:'Snacks',price:10,stock:30,lowStockAt:8},
 {id:'p7',name:'Tea Cup',barcode:'8901000000071',category:'Beverages',price:10,stock:40,lowStockAt:10},
 {id:'p8',name:'Bread',barcode:'8901000000088',category:'Bakery',price:35,stock:12,lowStockAt:4},
 {id:'p9',name:'Eggs (6 pack)',barcode:'8901000000095',category:'Dairy',price:48,stock:15,lowStockAt:5},
 {id:'p10',name:'Sugar 1kg',barcode:'8901000000101',category:'Grocery',price:48,stock:20,lowStockAt:5},
 {id:'p11',name:'Salt 1kg',barcode:'8901000000118',category:'Grocery',price:22,stock:20,lowStockAt:5},
 {id:'p12',name:'Biscuits Family Pack',barcode:'8901000000125',category:'Snacks',price:30,stock:14,lowStockAt:5},
 {id:'p13',name:'Water Bottle 1L',barcode:'8901000000132',category:'Beverages',price:20,stock:24,lowStockAt:6},
 {id:'p14',name:'Instant Noodles',barcode:'8901000000149',category:'Grocery',price:15,stock:25,lowStockAt:6},
 {id:'p15',name:'Shampoo Sachet',barcode:'8901000000156',category:'Personal care',price:2,stock:50,lowStockAt:10}
]};
const mongo=()=>mongoose.connection.readyState===1;
const saleOut=x=>({...x.toObject(),id:String(x._id),_id:undefined,createdAt:new Date(x.createdAt).toISOString()});
const productOut=x=>({...x.toObject(),id:String(x._id),_id:undefined});
async function load(){if(memory)return memory;try{memory=JSON.parse(await fs.readFile(file,'utf8'));}catch{memory=structuredClone(initial);await save();}return memory;}
async function save(){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(memory,null,2));}
export const store={
 async all(){if(mongo()){const [sales,products]=await Promise.all([Sale.find().sort({createdAt:-1}).lean(),Product.find().sort({createdAt:-1}).lean()]);return {sales:sales.map(x=>({...x,id:String(x._id)})),products:products.map(x=>({...x,id:String(x._id)}))};}return structuredClone(await load());},
 async sales(){if(mongo())return (await Sale.find().sort({createdAt:-1}).lean()).map(x=>({...x,id:String(x._id)}));return (await load()).sales;},
 async products(){if(mongo())return (await Product.find().sort({createdAt:-1}).lean()).map(x=>({...x,id:String(x._id)}));return (await load()).products;},
 async addSale(s){if(mongo()){const created=await Sale.create({...s,createdAt:new Date(s.createdAt)});const p=await Product.findOne({name:new RegExp('^'+s.productName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i')});if(p){p.stock=Math.max(0,p.stock-s.quantity);await p.save();}return saleOut(created);}const d=await load();d.sales.unshift(s);const p=d.products.find(x=>x.name.toLowerCase()===s.productName.toLowerCase());if(p)p.stock=Math.max(0,p.stock-s.quantity);await save();return s;},
 async checkout(items,paymentMethod='UPI',paymentStatus='SUCCESS'){
  const orderId=randomUUID();
  const createdAt=new Date().toISOString();
  if(mongo()){
   const products=await Product.find({_id:{$in:items.map(x=>x.productId)}});
   const byId=new Map(products.map(p=>[String(p._id),p]));
   for(const item of items){const p=byId.get(String(item.productId));if(!p)return {error:'A selected product could not be found.'};if(p.stock<item.quantity)return {error:`Not enough stock for ${p.name}. Available: ${p.stock}.`};}
   const stockUse=new Map();for(const item of items)stockUse.set(String(item.productId),(stockUse.get(String(item.productId))||0)+item.quantity);
   for(const [id,qty] of stockUse){const p=byId.get(id);if(p.stock<qty)return {error:`Not enough stock for ${p.name}. Available: ${p.stock}.`};}
   const docs=items.map(item=>{const p=byId.get(String(item.productId));return {productName:p.name,orderId,quantity:item.quantity,unitPrice:p.price,total:p.price*item.quantity,paymentMethod,paymentStatus,createdAt:new Date(createdAt)};});
   const created=await Sale.insertMany(docs);
   for(const [id,qty] of stockUse)await Product.updateOne({_id:id},{$inc:{stock:-qty}});
   return {orderId,items:created.map(saleOut),total:created.reduce((sum,s)=>sum+s.total,0),paymentMethod,paymentStatus};
  }
  const d=await load();
  const byId=new Map(d.products.map(p=>[String(p.id),p]));
  const stockUse=new Map();for(const item of items)stockUse.set(String(item.productId),(stockUse.get(String(item.productId))||0)+item.quantity);
  for(const [id,qty] of stockUse){const p=byId.get(id);if(!p)return {error:'A selected product could not be found.'};if(p.stock<qty)return {error:`Not enough stock for ${p.name}. Available: ${p.stock}.`};}
  const sales=items.map(item=>{const p=byId.get(String(item.productId));return {id:randomUUID(),productName:p.name,orderId,quantity:item.quantity,unitPrice:p.price,total:p.price*item.quantity,paymentMethod,paymentStatus,createdAt};});
  for(const [id,qty] of stockUse)byId.get(id).stock-=qty;
  d.sales.unshift(...sales);await save();
  return {orderId,items:sales,total:sales.reduce((sum,s)=>sum+s.total,0),paymentMethod,paymentStatus};
 },
 async updateSale(id,status){if(mongo()){if(!mongoose.isValidObjectId(id))return null;const s=await Sale.findById(id);if(!s)return null;if(s.orderId)await Sale.updateMany({orderId:s.orderId},{paymentStatus:status});else s.paymentStatus=status;if(!s.orderId)await s.save();const updated=await Sale.findById(id);return updated?saleOut(updated):null;}const d=await load();const s=d.sales.find(x=>x.id===id);if(!s)return null;if(s.orderId)d.sales.filter(x=>x.orderId===s.orderId).forEach(x=>{x.paymentStatus=status;});else s.paymentStatus=status;await save();return s;},
 async addProduct(p){if(mongo()){const created=await Product.create(p);return productOut(created);}const d=await load();d.products.unshift(p);await save();return p;},
 async updateProduct(id,patch){if(mongo()){if(!mongoose.isValidObjectId(id))return null;const p=await Product.findByIdAndUpdate(id,patch,{new:true,runValidators:true});return p?productOut(p):null;}const p=(await load()).products.find(x=>x.id===id);if(!p)return null;Object.assign(p,patch);await save();return p;},
 async deleteProduct(id){if(mongo()){if(!mongoose.isValidObjectId(id))return false;return (await Product.findByIdAndDelete(id))!==null;}const d=await load();const n=d.products.length;d.products=d.products.filter(p=>p.id!==id);await save();return d.products.length<n;},
 async reset(){if(mongo()){await Promise.all([Sale.deleteMany({}),Product.deleteMany({})]);await Sale.insertMany(initial.sales.map(({id,...x})=>({...x,createdAt:new Date(x.createdAt)})));await Product.insertMany(initial.products.map(({id,...x})=>x));return this.all();}memory=structuredClone(initial);await save();return memory;}
};
