"use strict"; 
// nw.App.clearCache();
//localStorage.setItem('jx3file',null);
const fs = require("fs");
let Ln = global.module.exports.Ln;
let page={};
const {manifest: appManifest} = nw.App;
const {version: currentVersion} = appManifest;
currentVersion;
let AHfile;
let vm = new Vue({
	el:"#medicFood",
	data : {
		isloading:false,
		jx3pathinput:false,
		ready:'ready',
		recipes:'',
		prices:[],
		checkrecipes:[]
	},
	computed:{
		recipesSum:function(){ 
			let sum=null;
			for(let r of this.checkrecipes)
			{
				sum+=r.unit;
			}
			return sum;
		}
	},
	methods:{
		check0:function(){
			console.log('check0');
		},
		updatePrice:function(){
			this.checkrecipes = [];
			page.init();
		}
	}
});
page.init=function(){
	page.getPrice()
	.then(goods=>{page.getRecipeslist(goods)})
	.catch(()=>{
		console.log();
	});
}
page.getRecipeslist=function(goods){		
	let currentgoods = goods;
	/* 获取配方 */
	const recipes=JSON.parse(fs.readFileSync(Ln.path+"\\data\\recipes.json",'utf-8')).data;
	vm.recipes = recipes;
	for(let recipe of recipes){
		//单价计算 材料*数量
		recipe.unit = 0;
		for(let material of (recipe.materials1||[])){  //紫材料
			// currentgoods[material.name].nGold  材料名为material.name的单价 
			// material.amount 材料的数量
			if(!currentgoods[material.name]){
				recipe.materials1.annotation = recipe.materials1.annotation?(recipe.materials1.annotation+", "+"缺少"+material.name+"的价格"):"缺少"+material.name+"的价格";
				continue;
			}
			else {recipe.unit += currentgoods[material.name].nGold * material.amount;material.nGold = currentgoods[material.name].nGold;}
		}; 
		for(let material of (recipe.materials2||[])){  //蓝材料
			if(!currentgoods[material.name]){
				recipe.materials2.annotation = recipe.materials2.annotation?(recipe.materials2.annotation+", "+"缺少"+material.name+"的价格"):"缺少"+material.name+"的价格";
				continue;
			}
			else {recipe.unit += currentgoods[material.name].nGold * material.amount;material.nGold = currentgoods[material.name].nGold;}
		};
		for(let material of (recipe.materials3||[])){  //基础材料
			if(!currentgoods[material.name]){
				recipe.materials3.annotation = recipe.materials3.annotation?(recipe.materials3.annotation+", "+"缺少"+material.name+"的价格"):"缺少"+material.name+"的价格";
				continue;
			}
			else {recipe.unit += currentgoods[material.name].nGold * material.amount;material.nGold = currentgoods[material.name].nGold;}
		}; 
		for(let material of (recipe.npcmaterials||[])){  //NPC材料
			if(!currentgoods[material.name]){
				recipe.npcmaterials.annotation = recipe.npcmaterials.annotation?(recipe.npcmaterials.annotation+", "+"缺少"+material.name+"的价格"):"缺少"+material.name+"的价格";
				// recipe.npcmaterials.annotation = "缺少"+material.name+"的价格";
				continue;
			}
			else {recipe.unit += currentgoods[material.name].nGold * material.amount;material.nGold = currentgoods[material.name].nGold;}
			// recipe.unit += Math.ceil(currentgoods[material.name].nGold * npcmaterials.amount);
		}; 
		recipe.unit = recipe.unit/recipe.mfamount;
	}
}
page.countRecipes = function(recipes,currentgoods){
	
}
page.getPrice=function(){	//更新物品价格
return new Promise((resolve)=>{
	page.getAHpath()
	.then(()=>{
		let goodsrow=JSON.parse(fs.readFileSync(Ln.path+"\\data\\goods.json",'utf-8')).data; /* 从数据库中检索出需要记录的商品 id*/
		let patt1 = /\[\d{1,6}\]=\{\{nGold=\d{1,7},nSilver=\d{1,2},nCopper=\d{1,2}\},\d{10}\}/g; 
		let priceArr=AHfile.match(patt1);
		let goods,goodsforfile,goodslist;
		if(goodsrow){
			goodslist=page.pickoutgoods(goodsrow,priceArr); /* 从上传数据中更新数据 --goods*/
			goods = goodslist[0];
			goodsforfile = goodslist[1];
		}
		let tody=new Date(),
			todyyear=tody.getFullYear(),
			todymonth=tody.getMonth()+1, 
			todyday=tody.getDate(),
			timestamp = tody.getTime();
		let currentgoodsfile = {};
		currentgoodsfile.version = currentVersion;
		currentgoodsfile.date = {year:todyyear,month:todymonth,day:todyday,timestamp:timestamp};
		currentgoodsfile.data = goodsforfile;
		fs.writeFileSync(Ln.path+"\\data\\goods.json", JSON.stringify(currentgoodsfile));
		resolve(goods);
	});
});	
}
page.getAHpath = function(){
	return new Promise((resolve)=>{
		let path = localStorage.getItem('AHpath');
		if(!path){
			page.showInputpath(resolve);
		}
		else {
			try{
				AHfile=fs.readFileSync(path,'utf-8');
				resolve();
			}catch(e){
				localStorage.setItem('AHpath',null);
				page.showInputpath(resolve);
			}
		}
	});
}
page.showInputpath = function(resolve){
	vm.jx3pathinput = true;
	let ele_AHpath = document.getElementById('AHpath'); 
	ele_AHpath.addEventListener('change',function(e,a,b){
		let fulljx3path = e.srcElement.files[0].path;
		let patharr = fulljx3path.split('\\');
		let jx3path = fulljx3path.substring(0,fulljx3path.lastIndexOf('\\'));
		let AHpath = /ah.jx3dat/.test(fulljx3path)?fulljx3path : jx3path+"\\interface\\AH\\AH_Base\\data\\ah.jx3dat";	
		try{
			AHfile=fs.readFileSync(AHpath,'utf-8');
			localStorage.setItem('AHpath',AHpath);
			vm.jx3pathinput = false;
			resolve();		
		}catch(e){
			// AHfile = fs.readFileSync(jx3path,'utf-8');
			localStorage.setItem('AHpath',null);
			this.value = null;
			alert('交易行数据读取失败,请确认选择的路径是否正确');
		}
	})
	
}
page.pickoutgoods=function(row,priceArr){ 
	let goodslist={};
	for(let item of row){
		let id=item.id;
		goodslist[item.name] = item;
		for(let goods of priceArr){
			if(id){
				let re = new RegExp("\\["+id.toString()+"\\]=\{\{nGold=(\\d{1,7}),nSilver=(\\d{1,2}),nCopper=(\\d{1,2})\}"); 
				let _goods=goods.match(re); 
				if(_goods){						//匹配到物品,转换为json对象 
					item = {id:id,nGold:_goods[1],nSilver:_goods[2],nCopper:_goods[3],name:item.name};
					let goodsJson={id:id,nGold:_goods[1],nSilver:_goods[2],nCopper:_goods[3],name:item.name};
					goodslist[item.name] = goodsJson;
				}  
			}
		}
	}	
	return [goodslist,row];
}
page.init();