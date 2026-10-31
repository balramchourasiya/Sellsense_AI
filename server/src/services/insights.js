const TZ='Asia/Kolkata';
const dateKey=value=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const moneyRound=value=>Math.round(value||0);
const uniqueOrders=rows=>new Set(rows.map(s=>s.orderId||s.id)).size;
const sum=rows=>rows.reduce((total,row)=>total+Number(row.total||0),0);
const localHour=value=>Number(new Intl.DateTimeFormat('en-IN',{timeZone:TZ,hour:'2-digit',hourCycle:'h23'}).format(new Date(value)));
const addDays=(date,amount)=>{const next=new Date(date);next.setUTCDate(next.getUTCDate()+amount);return next;};
const keyForOffset=offset=>dateKey(addDays(new Date(`${dateKey(new Date())}T12:00:00Z`),offset));

export function buildInsights(sales,products){
 const successful=sales.filter(s=>s.paymentStatus==='SUCCESS');
 const pending=sales.filter(s=>s.paymentStatus==='PENDING');
 const todayKey=dateKey(new Date());
 const yesterdayKey=keyForOffset(-1);
 const todaySales=successful.filter(s=>dateKey(s.createdAt)===todayKey);
 const yesterdaySales=successful.filter(s=>dateKey(s.createdAt)===yesterdayKey);
 const last7Keys=Array.from({length:7},(_,index)=>keyForOffset(index-6));
 const previous7Keys=Array.from({length:7},(_,index)=>keyForOffset(index-13));
 const last30Keys=Array.from({length:30},(_,index)=>keyForOffset(index-29));
 const last7=last7Keys.map(key=>{const rows=successful.filter(s=>dateKey(s.createdAt)===key);return {date:key,amount:moneyRound(sum(rows)),orders:uniqueOrders(rows)};});
 const last30Rows=successful.filter(s=>last30Keys.includes(dateKey(s.createdAt)));
 const previous7Rows=successful.filter(s=>previous7Keys.includes(dateKey(s.createdAt)));
 const prior30Keys=Array.from({length:30},(_,index)=>keyForOffset(index-59));
 const prior30Rows=successful.filter(s=>prior30Keys.includes(dateKey(s.createdAt)));
 const monthPrefix=todayKey.slice(0,7);
 const monthRows=successful.filter(s=>dateKey(s.createdAt).startsWith(monthPrefix));
 const [yearNumber,monthNumber,dayNumber]=todayKey.split('-').map(Number);
 const previousMonthDate=new Date(Date.UTC(yearNumber,monthNumber-2,1,12));
 const previousMonthPrefix=dateKey(previousMonthDate).slice(0,7);
 const previousMonthDay=Math.min(dayNumber,new Date(Date.UTC(yearNumber,monthNumber-1,0)).getUTCDate());
 const previousMonthRows=successful.filter(s=>{const key=dateKey(s.createdAt);return key.startsWith(previousMonthPrefix)&&Number(key.slice(-2))<=previousMonthDay;});
 const totalToday=sum(todaySales);
 const yesterdayRevenue=sum(yesterdaySales);
 const previous7Revenue=sum(previous7Rows);
 const previous7Orders=uniqueOrders(previous7Rows);
 const weekChangePercent=previous7Revenue===0?(sum(last7Rows(last7Keys,successful))>0?100:null):Math.round(((sum(last7Rows(last7Keys,successful))-previous7Revenue)/previous7Revenue)*100);
 const previousMonthRevenue=sum(previousMonthRows);
 const monthChangePercent=previousMonthRevenue===0?(sum(monthRows)>0?100:null):Math.round(((sum(monthRows)-previousMonthRevenue)/previousMonthRevenue)*100);
 const changePercent=yesterdayRevenue===0?(totalToday>0?100:null):Math.round(((totalToday-yesterdayRevenue)/yesterdayRevenue)*100);
 const unitsToday=todaySales.reduce((n,s)=>n+Number(s.quantity||0),0);
 const byProduct={};
 const byCategory={};
 const paymentMix={UPI:0,Cash:0,Card:0};
 const hourCounts=Array(24).fill(0);
 for(const sale of successful){
  const name=sale.productName||'Unknown item';
  const row=byProduct[name]||{name,units:0,revenue:0,orders:new Set(),lastSoldAt:null};
  row.units+=Number(sale.quantity||0);row.revenue+=Number(sale.total||0);row.orders.add(sale.orderId||sale.id);
  if(!row.lastSoldAt||new Date(sale.createdAt)>new Date(row.lastSoldAt))row.lastSoldAt=sale.createdAt;
  byProduct[name]=row;
  const product=products.find(p=>p.name.toLowerCase()===name.toLowerCase());
  const category=product?.category||'Uncategorized';
  byCategory[category]=(byCategory[category]||0)+Number(sale.total||0);
  paymentMix[sale.paymentMethod]=(paymentMix[sale.paymentMethod]||0)+Number(sale.total||0);
  hourCounts[localHour(sale.createdAt)]+=Number(sale.total||0);
 }
 const productPerformance=Object.values(byProduct).map(row=>({...row,orders:row.orders.size,revenue:moneyRound(row.revenue)})).sort((a,b)=>b.revenue-a.revenue);
 const topProduct=[...productPerformance].sort((a,b)=>b.units-a.units)[0]||null;
 const lowStock=products.filter(p=>Number(p.stock)<=Number(p.lowStockAt));
 const inventory=products.map(product=>{
  const sold30=last30Rows.filter(s=>s.productName.toLowerCase()===product.name.toLowerCase()).reduce((n,s)=>n+Number(s.quantity||0),0);
  const soldPrevious30=prior30Rows.filter(s=>s.productName.toLowerCase()===product.name.toLowerCase()).reduce((n,s)=>n+Number(s.quantity||0),0);
  const revenue30=last30Rows.filter(s=>s.productName.toLowerCase()===product.name.toLowerCase()).reduce((n,s)=>n+Number(s.total||0),0);
  const previousRevenue30=prior30Rows.filter(s=>s.productName.toLowerCase()===product.name.toLowerCase()).reduce((n,s)=>n+Number(s.total||0),0);
  const dailyRate=sold30/30;
  const daysCover=dailyRate>0?Math.floor(Number(product.stock)/dailyRate):null;
  const targetStock=Math.max(dailyRate*7,Number(product.lowStockAt||0)*2);
  const suggestedOrder=dailyRate>0||Number(product.stock)<=Number(product.lowStockAt)?Math.max(0,Math.ceil(targetStock-Number(product.stock))):0;
  const unitsChange=soldPrevious30===0?(sold30>0?null:0):Math.round(((sold30-soldPrevious30)/soldPrevious30)*100);
  const revenueChange=previousRevenue30===0?(revenue30>0?null:0):Math.round(((revenue30-previousRevenue30)/previousRevenue30)*100);
  return {...product,soldLast30Days:sold30,soldPrevious30Days:soldPrevious30,revenueLast30Days:moneyRound(revenue30),revenuePrevious30Days:moneyRound(previousRevenue30),unitsChangePercent:unitsChange,revenueChangePercent:revenueChange,averageDailyUnits:Number(dailyRate.toFixed(2)),daysOfStockLeft:daysCover,targetStockUnits:Math.ceil(targetStock),suggestedRestock:suggestedOrder};
 });
 const restockRecommendations=inventory.filter(p=>p.stock<=p.lowStockAt||(p.averageDailyUnits>0&&p.daysOfStockLeft!==null&&p.daysOfStockLeft<=7)).sort((a,b)=>(a.daysOfStockLeft??999)-(b.daysOfStockLeft??999));
 const slowMoving=inventory.filter(p=>p.stock>0&&p.soldLast30Days===0);
 const peakHourIndex=hourCounts.indexOf(Math.max(...hourCounts));
 const peakHour=hourCounts[peakHourIndex]>0?{hour:peakHourIndex,revenue:moneyRound(hourCounts[peakHourIndex])}:null;
 const totalRevenue=sum(successful);
 const paidOrderCount=uniqueOrders(successful);
 const avgOrderValue=paidOrderCount>0?moneyRound(totalRevenue/paidOrderCount):0;
 const averageUnitsPerOrder=paidOrderCount>0?Number((successful.reduce((n,row)=>n+Number(row.quantity||0),0)/paidOrderCount).toFixed(2)):0;
 const baskets=new Map();
 for(const sale of successful){const key=sale.orderId||sale.id;if(!baskets.has(key))baskets.set(key,new Set());baskets.get(key).add(sale.productName||'Unknown item');}
 const pairCounts=new Map();
 for(const basket of baskets.values()){const names=[...basket].sort((a,b)=>a.localeCompare(b));for(let a=0;a<names.length;a++)for(let b=a+1;b<names.length;b++){const key=`${names[a]}\u0000${names[b]}`;pairCounts.set(key,(pairCounts.get(key)||0)+1);}}
 const frequentlyBoughtTogether=[...pairCounts.entries()].map(([key,orders])=>{const [first,second]=key.split('\u0000');return {products:[first,second],orders};}).sort((a,b)=>b.orders-a.orders).slice(0,8);
 const weekdayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 const weekdayMap=new Map(weekdayNames.map(name=>[name,{day:name,revenue:0,orders:new Set(),units:0}]));
 for(const sale of successful){const day=new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'long'}).format(new Date(sale.createdAt));const row=weekdayMap.get(day);row.revenue+=Number(sale.total||0);row.orders.add(sale.orderId||sale.id);row.units+=Number(sale.quantity||0);}
 const salesByWeekday=weekdayNames.map(day=>{const row=weekdayMap.get(day);return {day,revenue:moneyRound(row.revenue),orders:row.orders.size,units:row.units};});
 const bestWeekday=[...salesByWeekday].sort((a,b)=>b.revenue-a.revenue)[0]?.revenue>0?[...salesByWeekday].sort((a,b)=>b.revenue-a.revenue)[0]:null;
 const monthRevenue=sum(monthRows);
 const monthOrders=uniqueOrders(monthRows);
 const pendingOrders=uniqueOrders(pending);
 const byCategoryRows=Object.entries(byCategory).map(([name,revenue])=>({name,revenue:moneyRound(revenue)})).sort((a,b)=>b.revenue-a.revenue);
 const totalStockRetailValue=products.reduce((n,p)=>n+Number(p.price||0)*Number(p.stock||0),0);
 return {
  todayRevenue:moneyRound(totalToday),todayOrders:uniqueOrders(todaySales),todayUnits:unitsToday,yesterdayUnits:yesterdaySales.reduce((n,s)=>n+Number(s.quantity||0),0),
  last7Units:last7Rows(last7Keys,successful).reduce((n,s)=>n+Number(s.quantity||0),0),
  yesterdayRevenue:moneyRound(yesterdayRevenue),yesterdayOrders:uniqueOrders(yesterdaySales),changePercent,
  weekRevenue:moneyRound(sum(last7Rows(last7Keys,successful))),weekOrders:uniqueOrders(successful.filter(s=>last7Keys.includes(dateKey(s.createdAt)))),weekChangePercent,previousWeekRevenue:moneyRound(previous7Revenue),previousWeekOrders:previous7Orders,previousWeekUnits:previous7Rows.reduce((n,s)=>n+Number(s.quantity||0),0),
  monthRevenue:moneyRound(monthRevenue),monthOrders,monthUnits:monthRows.reduce((n,s)=>n+Number(s.quantity||0),0),monthChangePercent,previousMonthRevenue:moneyRound(previousMonthRevenue),previousMonthOrders:uniqueOrders(previousMonthRows),previousMonthUnits:previousMonthRows.reduce((n,s)=>n+Number(s.quantity||0),0),
  totalRevenue:moneyRound(totalRevenue),totalOrders:uniqueOrders(successful),totalUnits:successful.reduce((n,s)=>n+Number(s.quantity||0),0),
  avgOrderValue,averageUnitsPerOrder,topProduct,productPerformance:productPerformance.slice(0,8),lowStock,inventory,restockRecommendations,slowMoving,frequentlyBoughtTogether,salesByWeekday,bestWeekday,
  productTrends:inventory.filter(p=>p.soldLast30Days>0||p.soldPrevious30Days>0).sort((a,b)=>b.revenueLast30Days-a.revenueLast30Days).slice(0,10),
  previous30Revenue:moneyRound(sum(prior30Rows)),previous30Units:prior30Rows.reduce((n,s)=>n+Number(s.quantity||0),0),
  pendingCount:pendingOrders,pendingAmount:moneyRound(sum(pending)),paymentMix:Object.fromEntries(Object.entries(paymentMix).map(([k,v])=>[k,moneyRound(v)])),
  categoryPerformance:byCategoryRows,peakHour,last7,last30:last30Keys.map(key=>{const rows=successful.filter(s=>dateKey(s.createdAt)===key);return {date:key,amount:moneyRound(sum(rows)),orders:uniqueOrders(rows)};}),
  estimatedNextDayRevenue:moneyRound(last7.reduce((n,d)=>n+d.amount,0)/7),totalStockRetailValue:moneyRound(totalStockRetailValue),
  dataThrough:new Date().toISOString(),note:'Business insights are calculated from recorded store sales and inventory. Revenue excludes pending and failed payments; profit is not available without purchase costs and expenses.'
 };
}
function last7Rows(keys,sales){return sales.filter(s=>keys.includes(dateKey(s.createdAt)));}
