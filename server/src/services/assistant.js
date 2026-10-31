import {buildInsights} from './insights.js';
const money=value=>`₹${Math.round(Number(value)||0).toLocaleString('en-IN')}`;
const pct=value=>value===null?'not comparable':`${value>0?'+':''}${value}%`;
const dayPart=hour=>hour<12?'morning':hour<17?'afternoon':hour<21?'evening':'late evening';
const clean=text=>String(text||'').toLowerCase().replace(/[’']/g,"'").trim();

export async function answerQuestion(question,sales,products,language='en',previousQuestion='',history=[]){
 const original=String(question||'').trim();
 const q=clean(original);
 const followUp=/^(why|how so|tell me more|more details|explain|what else|and then|go on|details|elaborate)/i.test(q);
 const previous=clean(previousQuestion);
 const previousProduct=products.find(p=>previous.includes(p.name.toLowerCase()));
 const refersToPreviousProduct=/(this product|that product|same product|this item|that item|\b(?:it|its)\b|should i reorder|reorder this)/.test(q);
 const activeQuestion=followUp&&previousQuestion?previousQuestion:original;
 const query=clean(activeQuestion);
 const i=buildInsights(sales,products);
 const isHindi=language==='hi';
 const isHinglish=language==='hinglish';
 let answer='I can explain your sales, products, inventory, payment records, and daily business patterns. Ask me about today, this week, a product name, or what you should restock next.';
 let intent='help';
 const product=products.find(p=>query.includes(p.name.toLowerCase()))||(refersToPreviousProduct?previousProduct:null);
 const moneyQuestions=/(sale|sales|revenue|earning|collection|performance|bikri|kamai|turnover|kitna|how much)/.test(query);
 const wantsToday=/(today|aaj|आज|right now|so far)/.test(query);
 const wantsYesterday=/(yesterday|kal|बीते कल)/.test(query);
 const wantsWeek=/(week|7 day|last seven|this week|hafte|hafta)/.test(query);
 const wantsMonth=/(month|monthly|this month|is mahine)/.test(query);
 if(/^(hi|hello|hey|namaste|good morning|good afternoon|good evening)/.test(query)){
  intent='greeting';
  answer=`Namaste! I’m SellSense. I have ${i.totalOrders} recorded paid orders and ${money(i.totalRevenue)} in recorded revenue to analyze. I can compare your sales, explain which products are moving, estimate stock cover, and suggest what to reorder. What would you like to check first?`;
 }else if(/(what can you do|help me|help|capabilities|how to use)/.test(query)){
  intent='capabilities';
  answer='I can act like your shop’s business companion. Ask for today’s sales, compare periods, find your best product, check stock cover, identify slow-moving items, estimate reorder quantities, compare busy hours and weekdays, find products often bought together, review payment collections, or open Scan & Sell and add items to a bill by voice.';
 }else if(/(open|go to|start).*(scan|sell|checkout)/.test(query)){
  intent='navigation';answer='Opening Scan & Sell. Point the rear camera at a product barcode or enter the barcode. I will add a matched item to the current bill.';
 }else if(/(open|go to|show).*(inventory|stock)/.test(query)){
  intent='navigation';answer='Opening Inventory. You can review quantities, update stock, and add barcodes to products.';
 }else if(/(bought together|buy together|often bought|goes with|pair well|basket analysis|combo|combination)/.test(query)){
  intent='basket_analysis';
  const selected=product?i.frequentlyBoughtTogether.filter(pair=>pair.products.some(name=>name.toLowerCase()===product.name.toLowerCase())):i.frequentlyBoughtTogether;
  answer=selected.length?`Your recorded bills show these products are often bought together: ${selected.slice(0,5).map(pair=>`${pair.products.join(' with ')} in ${pair.orders} order(s)`).join('; ')}. You could test placing these items near each other or suggesting them as add-ons. This is an observed association, not proof that one product causes the other to sell.`:'There are not enough multi-product paid bills yet to identify reliable product combinations. Keep scanning every item in each bill so I can learn which products are purchased together.';
 }else if(/(which day|best day|weekday|day of the week|busiest day)/.test(query)){
  intent='weekday_analysis';
  answer=i.bestWeekday?`By recorded paid revenue, ${i.bestWeekday.day} is currently your strongest weekday with ${money(i.bestWeekday.revenue)} across ${i.bestWeekday.orders} order(s) and ${i.bestWeekday.units} unit(s). Here is the weekday view: ${i.salesByWeekday.map(day=>`${day.day}: ${money(day.revenue)}`).join('; ')}. This uses all available recorded sales, so compare several weeks before changing your shop hours.`:'There is not enough recorded paid sales data to identify a strong weekday pattern yet.';
 }else if(product&&/(stock|inventory|sell|sold|revenue|popular|performance|how is|details|units|price|reorder|restock|buy|cover|left|available|fast|slow)/.test(query)){
  intent='product_analysis';
  const p=i.inventory.find(row=>row.id===product.id)||{...product,soldLast30Days:0,averageDailyUnits:0,daysOfStockLeft:null,suggestedRestock:0};
  const perf=i.productPerformance.find(row=>row.name.toLowerCase()===product.name.toLowerCase());
  const trend=p.unitsChangePercent===null?'It sold units this month, but the previous month had no units for a percentage comparison.':p.unitsChangePercent>0?`Unit sales are up ${p.unitsChangePercent}% compared with the previous 30 days.`:p.unitsChangePercent<0?`Unit sales are down ${Math.abs(p.unitsChangePercent)}% compared with the previous 30 days.`:'Unit sales are unchanged compared with the previous 30 days.';
  answer=`${product.name}: price ${money(product.price)} per unit and current stock ${product.stock}. It sold ${p.soldLast30Days} unit(s) in the last 30 days${perf?`, generating ${money(perf.revenue)} from ${perf.orders} order(s) in all recorded paid sales`:''}. ${p.averageDailyUnits>0?`Its recent average is ${p.averageDailyUnits} unit(s) per day, giving about ${p.daysOfStockLeft} day(s) of stock cover.`:'There is not enough recent sales history to estimate stock cover.'} ${trend} ${p.suggestedRestock>0?`The current stock rule suggests reordering about ${p.suggestedRestock} unit(s) to reach ${p.targetStockUnits} units.`:p.stock<=p.lowStockAt?'It is at or below its stock alert level.':'It is currently above its stock alert level.'}`;
 }else if(/(restock|reorder|order stock|what should i buy|what to buy|supplier|mangwa|mangwana)/.test(query)){
  intent='restock_advice';
  answer=i.restockRecommendations.length?`Based on stock alerts and the last 30 days, these products need attention: ${i.restockRecommendations.slice(0,5).map(p=>`${p.name}: ${p.stock} left, ${p.soldLast30Days} sold in 30 days, about ${p.daysOfStockLeft??'unknown'} day(s) of cover; suggested order ${p.suggestedRestock} unit(s) to reach about ${p.targetStockUnits} units`).join('; ')}. Where sales history exists, the suggested order aims for roughly seven days of cover. Where there is no recent movement, it uses twice the configured low-stock alert as a review target. Please check supplier lead time and shelf life before ordering.`:`No product currently meets the restock rule based on recorded movement and stock alerts. Keep scanning sales so the estimates improve.`;
 }else if(/(low stock|stock.*low|running out|almost finish|khatam|kam stock)/.test(query)){
  intent='stock_risk';
  answer=i.lowStock.length?`There are ${i.lowStock.length} products at or below their alert level: ${i.lowStock.map(p=>`${p.name} has ${p.stock} left; alert level ${p.lowStockAt}`).join('; ')}. ${i.restockRecommendations.length?`The strongest reorder priorities are ${i.restockRecommendations.slice(0,3).map(p=>p.name).join(', ')}.`:''}`:'No product is currently below its configured stock alert. I would still review products with fewer than seven days of cover.';
 }else if(/(slow|not selling|no sale|dead stock|stuck stock|slow moving)/.test(query)){
  intent='slow_movers';
  answer=i.slowMoving.length?`These products had stock available but no recorded paid sale in the last 30 days: ${i.slowMoving.slice(0,6).map(p=>`${p.name} (${p.stock} units)`).join(', ')}. Consider checking visibility, price, shelf placement, and expiry before buying more.`:'Every product currently in inventory has at least one recorded paid sale in the last 30 days. That is a positive sign, though it does not guarantee future demand.';
 }else if(/(top|best.?sell|best product|popular|fast.?moving|most sold|highest revenue|number one|which product (?:sells|sold|earned|made|generated)|product.*earned|earned the most|most revenue|highest sales)/.test(query)){
  intent='top_products';
  answer=i.productPerformance.length?`By units, ${i.topProduct?.name||i.productPerformance[0].name} leads with ${i.topProduct?.units||i.productPerformance[0].units} units. By revenue, the leading products are ${i.productPerformance.slice(0,3).map((p,index)=>`${index+1}. ${p.name}: ${money(p.revenue)} from ${p.units} units`).join('; ')}. This uses recorded paid sales across the available history.`:'There are no paid sales yet, so I cannot rank products. Scan a few bills and I can identify your best sellers.';
 }else if(/(inventory value|stock value|worth of stock|inventory worth|stock worth)/.test(query)){
  intent='inventory_value';answer=`Your current inventory has an estimated retail value of ${money(i.totalStockRetailValue)} using selling price multiplied by units in stock. This is not the purchase cost or profit value.`;
 }else if(/(average bill|average order|average basket|aov|bill value)/.test(query)){
  intent='average_order_value';answer=`Your average order value is ${money(i.avgOrderValue)} across ${i.totalOrders} recorded paid orders and ${money(i.totalRevenue)} in paid revenue. Each paid order contains an average of ${i.averageUnitsPerOrder} units. ${i.frequentlyBoughtTogether.length?`The most common product pairing is ${i.frequentlyBoughtTogether[0].products.join(' with ')}, seen in ${i.frequentlyBoughtTogether[0].orders} order(s).`:'There are not enough multi-product bills yet to suggest a product pairing.'} To raise basket value, test relevant add-on items near checkout and compare the average bill over the next seven days.`;
 }else if(/(category|which type|which section)/.test(query)){
  intent='category_analysis';answer=i.categoryPerformance.length?`Your category revenue ranking is ${i.categoryPerformance.slice(0,5).map((row,index)=>`${index+1}. ${row.name}: ${money(row.revenue)}`).join('; ')}. These totals come from product categories in inventory. Products without a matching category are grouped as Uncategorized.`:'There is not enough paid sales data to compare categories yet.';
 }else if(/(payment method|upi|cash|card|paytm|how.*paid|payment mix|collection method)/.test(query)){
  intent='payment_mix';
  answer=`Recorded paid collections by method are: UPI ${money(i.paymentMix.UPI||0)}, cash ${money(i.paymentMix.Cash||0)}, and card ${money(i.paymentMix.Card||0)}. These figures reflect the payment method recorded at checkout; they are not an independent bank confirmation.`;
 }else if(/(pending|unpaid|payment.*review|payment.*due)/.test(query)){
  intent='pending_payments';answer=`There are ${i.pendingCount} order(s) marked pending, totaling ${money(i.pendingAmount)}. Review the customer's payment in your payment app or bank statement before changing a pending record to paid.`;
 }else if(/(peak|busy time|rush|best time|when.*sell|hour)/.test(query)){
  intent='peak_hour';answer=i.peakHour?`Your strongest recorded sales hour is around ${String(i.peakHour.hour).padStart(2,'0')}:00 to ${String((i.peakHour.hour+1)%24).padStart(2,'0')}:00, with ${money(i.peakHour.revenue)} in paid sales. This is based on recorded checkout timestamps; more days of data will make the pattern more useful.`:'There is not enough recorded sales activity to find a reliable busy hour yet.';
 }else if(/(sales down|sales are down|revenue down|sales dropped|sales falling|declining sales|why.*down|why.*drop|bikri.*kam)/.test(query)){
  intent='sales_diagnosis';
  const causes=[];if(i.restockRecommendations.length)causes.push(`stock risk: ${i.restockRecommendations.slice(0,3).map(p=>p.name).join(', ')}`);if(i.slowMoving.length)causes.push(`slow-moving stock: ${i.slowMoving.slice(0,3).map(p=>p.name).join(', ')}`);
  answer=`Today’s recorded paid revenue is ${money(i.todayRevenue)} compared with ${money(i.yesterdayRevenue)} yesterday (${pct(i.changePercent)}). ${causes.length?`Store records show possible areas to investigate: ${causes.join('; ')}.`:'I do not see a clear stock warning in the current records.'} These records cannot prove why sales changed because customer footfall, competitor prices, promotions, and opening hours are not tracked. Check those factors before deciding on an action.`;
 }else if(/(forecast|expected sales|predict|projection|tomorrow)/.test(query)){
  intent='sales_forecast';
  const average=Math.round(i.weekRevenue/7);
  answer=`Your recorded sales average about ${money(average)} per day across the last seven calendar days. A simple baseline for tomorrow is around ${money(average)}, not a guaranteed prediction. It uses only recorded sales and does not account for holidays, footfall, promotions, weather, or stock-outs.`;
 }else if(/(compare|difference|up or down|increase|decrease|growth|versus|vs)/.test(query)&&/(today|aaj|yesterday|kal|week|month|last 30|previous 30)/.test(query)){
  intent='period_comparison';
  if(/(week|7 day)/.test(query))answer=`Last 7 days: ${money(i.weekRevenue)} from ${i.weekOrders} paid orders and ${i.last7Units} units. Previous 7 days: ${money(i.previousWeekRevenue)} from ${i.previousWeekOrders} orders and ${i.previousWeekUnits} units. Revenue changed ${pct(i.weekChangePercent)}. ${i.weekChangePercent===null?'There is no previous-week revenue to use as a percentage baseline.':i.weekChangePercent<0?'Review stock-outs, lower-value bills, and changes in customer traffic.':'Check which products contributed to the stronger week.'}`;
  else if(/(month|monthly|last 30|previous 30)/.test(query))answer=`This month to date: ${money(i.monthRevenue)} from ${i.monthOrders} paid orders and ${i.monthUnits} units. The same number of calendar days in the previous month: ${money(i.previousMonthRevenue)} from ${i.previousMonthOrders} orders and ${i.previousMonthUnits} units. Revenue changed ${pct(i.monthChangePercent)}. This is a month-to-date comparison, not a full-month forecast.`;
  else answer=`Today’s paid revenue is ${money(i.todayRevenue)} across ${i.todayOrders} order(s). Yesterday it was ${money(i.yesterdayRevenue)} across ${i.yesterdayOrders} order(s). The day-on-day revenue change is ${pct(i.changePercent)}. ${i.changePercent===null?'Yesterday had no recorded paid revenue, so a percentage comparison is not meaningful.':i.changePercent<0?'Check whether the decline is linked to stock-outs, footfall, or fewer high-value bills.':i.changePercent>0?'Check which products and time periods contributed most to the increase.':'Revenue is unchanged from yesterday.'}`;
 }else if(/(summary|business health|how.*business|what next|recommend|suggest|advice|improve|action plan)/.test(query)){
  intent='business_review';
  const trend=i.changePercent===null?'There is not enough yesterday data for a comparison.':`Today’s revenue is ${pct(i.changePercent)} versus yesterday.`;
  const actions=[];if(i.restockRecommendations[0])actions.push(`prioritize ${i.restockRecommendations[0].name} because it has ${i.restockRecommendations[0].stock} left`);if(i.slowMoving[0])actions.push(`review ${i.slowMoving[0].name}, which had no paid sales in 30 days`);if(i.avgOrderValue>0)actions.push(`use ₹${Math.round(i.avgOrderValue).toLocaleString('en-IN')} as your current average order value baseline`);if(!actions.length)actions.push('continue scanning each sale so product and time-based patterns become more reliable');
  answer=`Here is your store review. Total recorded paid revenue is ${money(i.totalRevenue)} across ${i.totalOrders} orders. Today: ${money(i.todayRevenue)} from ${i.todayOrders} orders. ${trend} Your average order value is ${money(i.avgOrderValue)}. ${i.pendingCount} order(s) are pending, worth ${money(i.pendingAmount)}. My next actions are to ${actions.join('; then ')}. Would you like me to explain sales, inventory, or reorder priorities in more detail?`;
 }else if(wantsToday||moneyQuestions||wantsYesterday||wantsWeek||wantsMonth){
  intent='sales_summary';
  const rows=wantsYesterday?{label:'Yesterday',revenue:i.yesterdayRevenue,orders:i.yesterdayOrders,units:i.yesterdayUnits}:wantsWeek?{label:'Last 7 days',revenue:i.weekRevenue,orders:i.weekOrders,units:i.last7Units}:wantsMonth?{label:'This month',revenue:i.monthRevenue,orders:i.monthOrders,units:i.monthUnits}:{label:'Today',revenue:i.todayRevenue,orders:i.todayOrders,units:i.todayUnits};
  answer=`${rows.label}: ${money(rows.revenue)} in recorded paid revenue, ${rows.orders} order(s), and ${rows.units} unit(s) sold. Your average order value across all recorded paid orders is ${money(i.avgOrderValue)}. ${i.topProduct?`${i.topProduct.name} is currently your strongest product by units, with ${i.topProduct.units} units sold.`:''} Revenue is not the same as profit; purchase cost and expenses are not included.`;
 }else if(/(profit|margin|munafa|मुनाफा)/.test(query)){
  intent='profit_explanation';answer='I can calculate sales revenue, but I cannot calculate profit accurately yet. Please record each product’s purchase cost and operating expenses. Profit is sales revenue minus product costs and expenses.';
 }else if(/(bill|cart|scan)/.test(query)){
  intent='selling_help';answer='To create a bill, open Scan & Sell, tap Start camera scanner, and allow camera access. Scan each item; matched products appear in the bill automatically. You can also use a handheld USB scanner or enter a barcode. Confirm the total and record the payment status after checkout.';
 }
 if(followUp&&previousQuestion){
  const previous=clean(previousQuestion);
  if(/(restock|reorder|what should i buy)/.test(previous)){
   answer=i.restockRecommendations.length?`More detail on your reorder priorities: ${i.restockRecommendations.slice(0,5).map(p=>`${p.name} has ${p.stock} unit(s), sold ${p.soldLast30Days} in 30 days, averages ${p.averageDailyUnits} per day, and has about ${p.daysOfStockLeft??'unknown'} day(s) of stock cover. The suggested order is ${p.suggestedRestock} unit(s).`).join(' ')} The quantity targets the higher of seven days of recent demand or twice the configured low-stock alert. Check expiry and supplier lead time before placing the order.`:'I do not have a product that currently meets the reorder rules. The estimate improves as more scanned sales are recorded.';
  }else if(/(sale|sales|revenue|today|week|month|yesterday)/.test(previous)){
   answer=`More detail: your average order value is ${money(i.avgOrderValue)}, and ${i.totalUnits} unit(s) have been sold across ${i.totalOrders} paid order(s) in the available records. ${i.productPerformance.slice(0,3).map(p=>`${p.name} contributed ${money(p.revenue)} from ${p.units} unit(s)`).join('; ')}. Pending payments of ${money(i.pendingAmount)} are excluded from paid revenue.`;
  }else if(products.some(p=>previous.includes(p.name.toLowerCase()))){
   const p=products.find(item=>previous.includes(item.name.toLowerCase()));
   const detail=i.inventory.find(item=>item.id===p.id);
   const perf=i.productPerformance.find(item=>item.name.toLowerCase()===p.name.toLowerCase());
   answer=`More detail for ${p.name}: ${perf?.orders||0} paid order(s), ${perf?.units||0} unit(s) sold, and ${money(perf?.revenue||0)} revenue across all recorded history. Current stock is ${p.stock}; the low-stock alert is ${p.lowStockAt}. In the last 30 days it sold ${detail?.soldLast30Days||0} unit(s).`;
  }else{
   answer=`A little more context: recorded paid revenue is ${money(i.totalRevenue)}, average order value is ${money(i.avgOrderValue)}, there are ${i.pendingCount} pending order(s), and ${i.restockRecommendations.length} product(s) need a stock review. You can ask me to explain any product by name.`;
  }
 }
 if(isHindi){answer=toHindi(answer,intent,i);}
 if(isHinglish){answer=`${answer}\n\nMain simple Hindi-English mein bhi samjha sakta hoon. Aap product ka naam lekar uski sales, stock, ya reorder quantity pooch sakte hain.`;}
 const geminiAnswer=await generateGeminiAnswer({question:original,sales,products,language,history,insights:i});
 if(geminiAnswer)answer=geminiAnswer;
 return {answer,intent,source:geminiAnswer?'gemini_interactions_api':'recorded_store_data',generatedAt:new Date().toISOString(),suggestions:suggestionsFor(intent),localFallbackAvailable:true};
}

async function generateGeminiAnswer({question,sales,products,language,history,insights}){
 const apiKey=process.env.GEMINI_API_KEY;
 if(!apiKey)return '';
 const data={
  timezone:'Asia/Kolkata',
  paidSales:{todayRevenue:insights.todayRevenue,todayOrders:insights.todayOrders,todayUnits:insights.todayUnits,yesterdayRevenue:insights.yesterdayRevenue,yesterdayOrders:insights.yesterdayOrders,dayChangePercent:insights.changePercent,last7Revenue:insights.weekRevenue,last7Orders:insights.weekOrders,last7Units:insights.last7Units,previous7Revenue:insights.previousWeekRevenue,previous7Orders:insights.previousWeekOrders,previous7Units:insights.previousWeekUnits,weekChangePercent:insights.weekChangePercent,thisMonthToDateRevenue:insights.monthRevenue,previousMonthSameDaysRevenue:insights.previousMonthRevenue,monthChangePercent:insights.monthChangePercent,totalRevenue:insights.totalRevenue,totalOrders:insights.totalOrders,totalUnits:insights.totalUnits,averageOrderValue:insights.avgOrderValue},
  payments:{paidByMethod:insights.paymentMix,pendingOrders:insights.pendingCount,pendingAmount:insights.pendingAmount},
  productLeaders:insights.productPerformance,
  frequentlyBoughtTogether:insights.frequentlyBoughtTogether,
  averageUnitsPerOrder:insights.averageUnitsPerOrder,
  salesByWeekday:insights.salesByWeekday,
  bestWeekday:insights.bestWeekday,
  categoryRevenue:insights.categoryPerformance,
  inventory:insights.inventory.map(p=>({name:p.name,category:p.category,price:p.price,stock:p.stock,lowStockAt:p.lowStockAt,soldLast30Days:p.soldLast30Days,soldPrevious30Days:p.soldPrevious30Days,unitsChangePercent:p.unitsChangePercent,daysOfStockLeft:p.daysOfStockLeft,suggestedRestock:p.suggestedRestock,targetStockUnits:p.targetStockUnits})),
  lowStock:insights.lowStock.map(p=>({name:p.name,stock:p.stock,alertAt:p.lowStockAt})),
  slowMoving:insights.slowMoving.map(p=>({name:p.name,stock:p.stock})),
  peakSalesHour:insights.peakHour,estimatedInventoryRetailValue:insights.totalStockRetailValue,
  recentSales:sales.slice(0,40).map(s=>({product:s.productName,quantity:s.quantity,total:s.total,paymentMethod:s.paymentMethod,paymentStatus:s.paymentStatus,createdAt:s.createdAt,orderId:s.orderId||s.id})),
  dataLimits:['Revenue includes records marked SUCCESS only.','Pending and failed transactions are not paid revenue.','Profit cannot be calculated because purchase costs and operating expenses are not recorded.','No customer identity is recorded, so repeat-customer behavior cannot be measured.','Sales changes cannot be causally attributed to footfall, promotions, competitors, or weather because those signals are not captured.']
 };
 const conversation=(Array.isArray(history)?history:[]).slice(-8).map(turn=>`${turn.role==='assistant'?'SellSense':'Shopkeeper'}: ${String(turn.text||'').slice(0,1200)}`).join('\n');
 const systemInstruction=`You are SellSense, a voice-first business growth assistant for an Indian small shopkeeper. Speak in clear, simple ${language==='hi'?'Hindi':language==='hinglish'?'natural Hinglish':'English'}. Be warm, confident, practical, and conversational. You receive a JSON store snapshot calculated by the application. Treat it as the only source of business facts. Never invent revenue, order counts, product movement, customer behavior, profit, payment verification, or dates. Use rupees (₹). Clearly separate paid revenue from pending payments. Explain whether a figure is actual recorded data, a simple estimate, or a recommendation. When useful, compare periods, explain product movement, stock cover, reorder quantities, payment mix, categories, and peak hours. Give one or two concrete next actions tied to the supplied data. Mention data limits when a question asks for a reason the records cannot prove. If customer behavior is asked about, explain that no customer identity is currently recorded. Do not claim Paytm or bank verification. Never reveal hidden reasoning; provide concise conclusions and useful calculations. Keep the answer suitable for speaking aloud, usually 3 to 6 short sentences. Answer the latest question using the conversation context, and finish with one relevant follow-up question only when it helps.`;
 const input=`STORE SNAPSHOT (JSON):\n${JSON.stringify(data)}\n\nRECENT CONVERSATION:\n${conversation||'No earlier conversation.'}\n\nLATEST SHOPKEEPER QUESTION:\n${question}`;
 try{
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({model:process.env.GEMINI_MODEL||'gemini-3.6-flash',input,system_instruction:systemInstruction,store:false,generation_config:{temperature:0.25}}),signal:AbortSignal.timeout(60000)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error?.message||`Gemini request failed (${response.status})`);
  const text=(payload.steps||[]).filter(step=>step.type==='model_output').flatMap(step=>step.content||[]).filter(part=>part.type==='text'&&part.text).map(part=>part.text).join('\n').trim();
  return text;
 }catch(error){console.error('Gemini assistant unavailable; using store analytics fallback:',error.message);return ''; }
}
function suggestionsFor(intent){
 const map={sales_summary:['Compare this week with last week','Which product earned the most?','What should I restock?'],product_analysis:['Should I reorder this product?','Which products are often bought together?','Compare with the previous 30 days'],restock_advice:['Show low-stock items','Which products are slow moving?','How much did I sell this week?'],business_review:['Explain my top products','Which products are often bought together?','Show my busiest weekday'],sales_diagnosis:['Show low-stock items','Which products are slow moving?','Compare today with yesterday'],sales_forecast:['Compare today with yesterday','Which products are moving fastest?','What should I restock?'],basket_analysis:['Which product pair is strongest?','How is my average bill value?','Show my top products'],weekday_analysis:['Compare this week with last week','Which hour is busiest?','What should I restock?'],help:['How much did I sell today?','Which product sells most?','What should I restock?']};
 return map[intent]||map.help;
}
function toHindi(answer,intent,i){
 if(intent==='greeting')return `नमस्ते! मैं SellSense हूँ। आपके रिकॉर्ड में ${i.totalOrders} सफल ऑर्डर और ${money(i.totalRevenue)} की बिक्री दर्ज है। मैं बिक्री, सामान की मांग, स्टॉक और दोबारा सामान मंगाने की सलाह दे सकता हूँ।`;
 if(intent==='sales_summary')return `आपकी दर्ज बिक्री ${money(i.todayRevenue)} है। आज ${i.todayOrders} ऑर्डर और ${i.todayUnits} यूनिट बिकी हैं। औसत बिल ${money(i.avgOrderValue)} है। ध्यान दें, बिक्री और मुनाफा अलग होते हैं; खरीद लागत और खर्च अभी दर्ज नहीं हैं।`;
 if(intent==='restock_advice')return i.restockRecommendations.length?`इन सामानों का स्टॉक दोबारा मंगाने पर ध्यान दें: ${i.restockRecommendations.slice(0,4).map(p=>`${p.name}, ${p.stock} बचे हैं; लगभग ${p.suggestedRestock} मंगाने का सुझाव`).join('; ')}। सप्लायर का समय और एक्सपायरी भी जाँचें।`:'अभी उपलब्ध रिकॉर्ड के अनुसार किसी सामान को तुरंत दोबारा मंगाने की जरूरत नहीं दिख रही।';
 return answer;
}
