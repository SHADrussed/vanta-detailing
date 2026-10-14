import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const baseURL=process.env.QA_URL||'http://127.0.0.1:5180';
await mkdir('portfolio/qa',{recursive:true});
const report={baseURL,date:new Date().toISOString(),checks:[],widths:[],consoleErrors:[],pageErrors:[],failedRequests:[],nonGetRequests:[],accessibility:[]};
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',e=>report.pageErrors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()}));
page.on('response',r=>{if(r.status()>=400)report.failedRequests.push({url:r.url(),status:r.status()});});
page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))report.nonGetRequests.push({url:r.url(),method:r.method()});});
const check=(name,fn)=>Promise.resolve().then(fn).then(()=>{report.checks.push({name,passed:true});console.log('PASS',name);});
const value=async()=>Number((await page.locator('output').innerText()).replace(/\D/g,''));
async function ready(){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{for(const image of document.images)image.loading='eager';});await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));}
try{
 await page.goto(baseURL);await ready();
 await check('Calculator: initial, classes, multiple services and empty state',async()=>{
  assert.equal(await value(),42000);
  await page.locator('input[value="crossover"]').check();assert.equal(await value(),52500);
  await page.locator('input[value="suv"]').check();assert.equal(await value(),63000);
  const boxes=page.locator('.check-services input');
  await boxes.nth(2).check();assert.equal(await value(),160500);
  for(let i=0;i<5;i++)await boxes.nth(i).uncheck();
  assert.equal(await value(),0);assert.equal(await page.getByRole('button',{name:'Перейти к записи'}).isDisabled(),true);
  await page.locator('input[value="crossover"]').check();await boxes.nth(0).check();await boxes.nth(1).check();
 });
 await check('Estimate transfers class, services, total and keyboard focus to form',async()=>{
  await page.getByRole('button',{name:'Перейти к записи'}).click();
  assert.equal(await page.locator('#booking-service').inputValue(),'complex');
  assert.match(await page.locator('.booking-estimate').innerText(),/Кроссовер/);
  assert.equal(Number((await page.locator('.booking-estimate strong').innerText()).replace(/\D/g,'')),52500);
  assert.equal(await page.locator('#booking-name').evaluate(el=>el===document.activeElement),true);
 });
 await check('Form: errors, invalid phone, valid demo, no real submission, reset',async()=>{
  await page.getByRole('button',{name:'Проверить демо-запись'}).click();
  assert.equal(await page.locator('.field-error').count(),2);
  assert.equal(await page.locator('#booking-name').evaluate(el=>el===document.activeElement),true);
  await page.locator('#booking-name').fill('Демо');await page.locator('#booking-phone').fill('123');
  await page.getByRole('button',{name:'Проверить демо-запись'}).click();assert.equal(await page.locator('#error-phone').count(),1);
  await page.locator('#booking-phone').fill('+7 (000) 000-00-00');
  await page.locator('#booking-service').selectOption('');await page.getByRole('button',{name:'Проверить демо-запись'}).click();
  assert.equal(await page.locator('#error-service').count(),1);
  await page.locator('#booking-service').selectOption('polish');assert.equal(await page.locator('.booking-estimate').count(),0);
  await page.getByRole('button',{name:'Проверить демо-запись'}).click();
  assert.match(await page.locator('.form-success').innerText(),/Заявка не отправлена/);
  assert.equal(await page.locator('.form-success').evaluate(el=>el===document.activeElement),true);
  assert.equal(report.nonGetRequests.length,0);
  await page.getByRole('button',{name:'Заполнить ещё раз'}).click();assert.equal(await page.locator('#booking-name').inputValue(),'');
 });
 await check('Services and FAQ expand; service action selects calculator item',async()=>{
  await page.locator('.service-row').nth(2).locator(':scope > button').click();
  await page.locator('#service-film').getByRole('button').click();
  assert.equal(await page.locator('.check-services input:checked').count(),1);
  assert.equal(await value(),81300);
  const faq=page.locator('.faq-items button').nth(4);await faq.click();assert.equal(await faq.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#faq-4').isVisible(),true);await faq.click();assert.equal(await page.locator('#faq-4').isVisible(),false);
 });
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:width===390?844:1000});await page.goto(baseURL);await ready();
  const metrics=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
  assert.ok(metrics.document<=width,`overflow ${width}`);assert.equal(metrics.brokenImages.length,0);
  report.widths.push(metrics);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  report.accessibility.push({width,violations:axe.violations});
  if(width===1440){await page.screenshot({path:'portfolio/desktop-hero.png'});await page.screenshot({path:'portfolio/desktop-full.png',fullPage:true});await page.locator('#calculator').screenshot({path:'portfolio/calculator.png'});}
  if(width===768)await page.screenshot({path:'portfolio/qa/tablet-full.png',fullPage:true});
  if(width===390){await page.screenshot({path:'portfolio/mobile-hero.png'});await page.screenshot({path:'portfolio/mobile-full.png',fullPage:true});
   await check('Mobile menu opens, Escape restores focus, navigation closes menu',async()=>{
    const toggle=page.locator('.menu-toggle');await toggle.click();assert.equal(await page.locator('#mobile-nav').isVisible(),true);
    await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
    await toggle.click();await page.locator('#mobile-nav').getByRole('link',{name:'Стоимость',exact:true}).click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(new URL(page.url()).hash,'#calculator');
   });
   await check('Mobile calculator and form work with touch-sized controls and keyboard',async()=>{
    await page.locator('input[value="suv"]').check();assert.equal(await value(),63000);
    const checkbox=page.locator('.check-services input').nth(0);await checkbox.focus();await page.keyboard.press('Space');assert.equal(await value(),36000);
    await page.getByRole('button',{name:'Перейти к записи'}).click();assert.equal(await page.locator('#booking-service').inputValue(),'ceramic');
    await page.getByRole('button',{name:'Проверить демо-запись'}).click();assert.equal(await page.locator('.field-error').count(),2);
    const errorAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.accessibility.push({width,state:'form-errors',violations:errorAxe.violations});
    for(const selector of ['.menu-toggle','.submit-button','#booking-name','#booking-phone','#booking-service','.check-services label']){
     const rect=await page.locator(selector).first().boundingBox();assert.ok(rect.height>=44,selector+' target too small');
    }
    await page.locator('#booking-name').fill('Демо');await page.locator('#booking-phone').fill('80000000000');await page.getByRole('button',{name:'Проверить демо-запись'}).click();assert.equal(await page.locator('.form-success').isVisible(),true);
   });
  }
 }
 await page.goto(baseURL+'/credits.html');assert.match(await page.title(),/Источники/);
 assert.equal(report.consoleErrors.length,0);assert.equal(report.pageErrors.length,0);assert.equal(report.failedRequests.length,0);
 assert.equal(report.accessibility.flatMap(a=>a.violations).length,0,'Accessibility violations; see report');
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;console.error(error);}
finally{await writeFile('portfolio/qa/qa-report.json',JSON.stringify(report,null,2));await browser.close();}
