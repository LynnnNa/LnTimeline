/* **
	Copyright (C) 2018 Lynn
	All rights reserved
	http://www.lynnote.site
	
***/
var path = require("path");  
var execPath = path.dirname(process.execPath);  

var timeline = {
	path : process.cwd()+"\\timeline",
	datapath : execPath+"\\data"
}
// window.onload = function(){
	
var currentT,
	currentSkill,
	nextSkill,
	currentTimeline,
	currentP, 
	currentSkillsec, 
	_mainTimer,
	mainTimer,
	cdSeconds,
	difference,
	doing = false, //防重标识
	tuning = false,  //是否微调了时间
	ele_maintimer = document.getElementById('maintimer'),  //总时间
	ele_min = document.getElementById('time-min'),  //分钟数
	ele_sec = document.getElementById('time-sec'),  //秒数
	ele_bossname = document.getElementById('bossname'),  //当前boss名
	ele_bossList = document.getElementsByName('boss'),  //boss列表
	ele_countdowns = document.getElementById('countdown_s'),  //倒数秒数
	ele_cdskill = document.getElementById('cdskill'),		//技能名
	ele_nextskillname = document.getElementById('nextskillname'),		//技能名
	ele_timerbar = document.getElementById('timerbar'),		//倒计时条
	ele_nextskillpoint = document.getElementById('nextskillpoint'),		//下技能倒计时点
	ele_partn = document.getElementById('partn'), //part
	ele_msg = document.getElementById('msg'), //msg

	FPS = 20
	;
	var fs,sfdata, FBcontainer, jsonobj, currentFBID, currentBossname
	;
	
	/* nw */
	var win,winmin = false, gui = require('nw.gui'), menuitem_last,
	moveing,
	hotkeys,
	shortcuts,
	msgHotKeyfailed = false
	;
	var dataconversion = require('dataconversion'),
		copyObj = dataconversion.copyObj;
	timeline.initApp = function (){
		win = nw.Window.get();
		win.resizeTo(356, 57);	
		if(!win.isTransparent) document.body.style.background = "#606060";
		//win.setResizable(false);
		/* 数据读取
		*/
		try{
			fs =require("fs");
			let data = timeline.sfdata = JSON.parse(fs.readFileSync(timeline.datapath+"\\default.dat",'utf-8'));
			sfdata =  copyObj(data);
		}catch(e){
			errormsg('读取数据失败,请确保data文件夹没有丢失, 尝试以管理员身份重新开启本软件');
		}
		/* 托盘
		*/
		try{
			if(timeline.tray){
			timeline.tray.remove();
			timeline.tray = null;
			}
			let tray = timeline.tray = new nw.Tray({ title: 'Tray', icon: './timeline/asset/icon/logo-ly.png' , tooltip: '早恋君 外置时间轴\n Lynnote.site' });
			let traymenu = createMenuforFB(sfdata);
			traymenu.append(new nw.MenuItem({ label: '设置' ,click:opensetting }));
			traymenu.append(new nw.MenuItem({ label: '关闭',click:function(){gui.App.closeAllWindows();} }));
			tray.menu = traymenu;
			tray.on('click',function(e){
				// tray.menu.popup(e.x,e.y);
				if(!winmin) {win.minimize();  }
				else { win.restore(); }
			});
			win.on('minimize', function() {
			  winmin = true;
			});
			win.on('restore', function() {
			  winmin = false;
			});
			if(menuitem_last) menuitem_last.click();
		}catch(e){ 
			errormsg('托盘初始化失败');
		}
		/* 主窗口初始化 */
		try{
			document.getElementById('controlarea').addEventListener('mousedown', function (e) {
				e.preventDefault();
				if (e.button != 2){
					moveing = [e.x, e.y];
				}
			});
			document.addEventListener('mousemove', function (e) {
				e.preventDefault();
				if(moveing){
				win.moveBy(e.x - moveing[0] , e.y - moveing[1]);
				}
			});
			win.on('blur',function(){
				moveing = null;
			});
			document.addEventListener('contextmenu', function (e) {
				e.preventDefault();
			}, false); 
			document.getElementById('controlarea').addEventListener('mouseup', function (e) {
			  e.preventDefault();		
			  if (e.button != 2)
				moveing = null;
			});
			win.on('resize', function() {
			  this.resizeTo(356, 57);	
			});
		
		}catch(e){ 
			errormsg('初始化窗口失败');
		}
		registerGHotKey();
	}
	timeline.initApp();
	function errormsg(msg){
		alert(msg);
	}
	/* 选择boss */
	function checkboss(lv1_menuItem,lv2_menuItem,fbid,bossname){
		if(menuitem_last) menuitem_last.checked = false;
		lv2_menuItem.checked = true;
		timeline.menuitem_last = menuitem_last = lv2_menuItem;
		loadboss(fbid,bossname);
		try{timeline.win_setting.reload();}
		catch(e){}
	}
	/* 装载boss数据 */
	function loadboss(fbid,bossname){
		timeline.currentFBID = currentFBID = fbid;
		timeline.FBcontainer = FBcontainer = sfdata[fbid];
		currentTimeline =sfdata[fbid].data[bossname];
		ele_bossname.textContent = bossname;
		intMaintimeline();
	}	
	/* 为副本创建托盘菜单 */
	function createMenuforFB(sfdata){
		let menu = new nw.Menu();
		for(let fbid in sfdata){
				let _submenu = new nw.Menu(),
					fbdatas = sfdata[fbid].data
					;
				for(let bossname in fbdatas){
					let lv2_menuItem,
					option = {
						label:bossname,
						type: 'checkbox',
						click:function(){
							checkboss(lv1_menuItem,lv2_menuItem,fbid,bossname);
							//currentBossname = bossname;
						}
					}
					lv2_menuItem = new nw.MenuItem(option);
					_submenu.append(lv2_menuItem);	
				}
				let option = {
					label:sfdata[fbid].name,
					submenu:_submenu
				}
				let lv1_menuItem = new nw.MenuItem(option);
				menu.append(lv1_menuItem);
			}
		return menu;
	}
	/* 快捷键注册
		*/	
	function registerGHotKey(){
		let ls_hkstart,ls_hkstop,ls_hkforwd,ls_hkrevrs,ls_hknextp;
		timeline.hotkey = [];
		timeline.hotkey[0] = ls_hkstart = localStorage.getItem('hk_start')||"Numpad8"; //读取快捷键 开始
		timeline.hotkey[1] = ls_hkstop = localStorage.getItem('hk_stop')||"Numpad5"; //读取快捷键 停止
		timeline.hotkey[2] = ls_hkforwd = localStorage.getItem('hk_forwd')||"Numpad6"; //读取快捷键 微调快进一秒
		timeline.hotkey[3] = ls_hkrevrs = localStorage.getItem('hk_revrs')||"Numpad4"; //读取快捷键 微调快退一秒
		timeline.hotkey[4] = ls_hknextp = localStorage.getItem('hk_nextp')||"Numpad9"; //读取快捷键 下P
		hotkeys = [ 
			{
				key : ls_hkstart,
				active : function() {
				//console.log("全局快捷键: " + this.key + " 被激活."); 
				_mainTimer = false;
				switchApp(true);
				},
				failed : function(msg) {
					if(!msgHotKeyfailed){
					errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
					msgHotKeyfailed = true;
					}
				}
			},
			{
				key : ls_hkstop,
				active : function() {
				switchApp(false);
				},
				failed : function(msg) {
					if(!msgHotKeyfailed){
					errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
					msgHotKeyfailed = true;
					}
				}
			},
			{
				key : ls_hkrevrs,
				active : function() {
					if(menuitem_last)
					tuningmin();
				},
				failed : function(msg) {
					if(!msgHotKeyfailed){
					errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
					msgHotKeyfailed = true;
					}
				}
			},
			{
				key : ls_hkforwd,
				active : function() {
				if(menuitem_last)
				tuningplus();
				},
				failed : function(msg) {
					if(!msgHotKeyfailed){
					errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
					msgHotKeyfailed = true;
					}
				}
			},
			{
				key : ls_hknextp,
				active : function() {
				if(menuitem_last)
				nextpart();
				},
				failed : function(msg) {
				if(!msgHotKeyfailed){
					errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
					msgHotKeyfailed = true;
					}
				}
			}
		];
		shortcuts = shortcuts||[];
		//注销快捷键
		for(var i=0; i<shortcuts.length; i++){
			nw.App.unregisterGlobalHotKey(shortcuts[i]);
		}
		//注册全局快捷键
		for(var i=0; i<hotkeys.length; i++){
			shortcuts[i] = new nw.Shortcut(hotkeys[i]);
			nw.App.registerGlobalHotKey(shortcuts[i]);
		}
		//关闭窗口前注销快捷键,会自动注销可不写
		win.on('close',function(){
				for(var i=0; i<shortcuts.length; i++){
					nw.App.unregisterGlobalHotKey(shortcuts[i]);
				}
				this.close(true);
			});
		win.on('loading',function(){
				/* for(var i=0; i<shortcuts.length; i++){
					nw.App.unregisterGlobalHotKey(shortcuts[i]);
				}
				this.close(true); */
			});
			/* window.onunload = function(){
				console.log(1)
				//this.close(true);
			  //防刷新
				if(shortcuts.length>0){
				for(var i=0; i<shortcuts.length; i++){
						nw.App.unregisterGlobalHotKey(shortcuts[i]);
					}
				}
			} */
	}
	function intMaintimeline(_this){
		clearInterval(mainTimer);
		currentT = 0;
		cdSeconds = 0;
		currentP = 1;
		currentSkill = {name:'',sec:0};
		ele_cdskill.textContent = '当前技能';
		ele_countdowns.textContent = '0s';
		ele_min.textContent = '-';
		ele_sec.textContent = '-';
		ele_timerbar.style.width = '0px';
		ele_nextskillpoint.style.left = "360px";
		ele_partn.textContent = "P1";	
		ele_nextskillname.textContent='下一技能';
		countdownCore();
		if(menuitem_last) ele_msg.style.display = 'none';
	}
	/* 开始|停止 
	*/
	function switchApp(com){
		
		//开始
		if(com)
		{	if(_mainTimer) return;
			if(!menuitem_last) return;
			clearInterval(mainTimer);
			currentT = 0;
			mainTimer = setInterval(function(){
				if(currentT > 540) switchApp(false);
				mainCore(); //主时间线
			},1000/FPS);
			_mainTimer = true;
		}
		//停止
		else{
			clearInterval(mainTimer);
			_mainTimer = false;
			if(menuitem_last) menuitem_last.click();
			//ele_currentBoss.loading();
		}
	};
	/* 主时间线
	*/
	function mainCore(){
		currentT += 1/FPS;
		ele_min.innerHTML = Math.floor(currentT/60) ; 
		ele_sec.innerHTML = Math.floor(currentT%60) > 9 ? Math.floor(currentT%60) : '0' + Math.floor(currentT%60) ; 
		countdownCore(); //倒计时条
	}
	/* 倒计时条
	*/
	function countdownCore(){	
		cdSeconds -= 1/FPS;
		if(tuning||cdSeconds<=0){
			if(tuning || currentT>=currentSkill.sec){
				tuning = false;
				for(var i=0; i<currentTimeline[currentP].length;i++ ){
					var name = currentTimeline[currentP][i].name,
					sec = currentTimeline[currentP][i].sec;
					nextname = currentTimeline[currentP][i+1]?currentTimeline[currentP][i+1].name:'';
					if(sec > currentT) 
					{
						currentSkill = currentTimeline[currentP][i];
						nextSkill = currentTimeline[currentP][i+1]?currentTimeline[currentP][i+1]:null;
						cdSeconds = sec - currentT +1;
						difference = nextSkill.sec - sec;
						ele_cdskill.textContent = name;
						ele_countdowns.textContent = Math.floor(cdSeconds) + 's';
						if(cdSeconds>=35) {ele_timerbar.style.width = 35*10+'px';ele_nextskillpoint.style.left = "360px;"}
						else {ele_timerbar.style.width = cdSeconds*10+'px';ele_nextskillpoint.style.left = (cdSeconds + difference)*10+'px'}
						ele_nextskillname.textContent=nextname;
						break;
					} else ele_cdskill.textContent ='';
				}
				if(cdSeconds <= 0) ele_nextskillname.textContent = '';
			}
		}else{
			ele_countdowns.textContent = Math.floor(cdSeconds) + 's';
			if(cdSeconds>=35) {ele_timerbar.style.width = 35*10+'px';ele_nextskillpoint.style.left = "360px;"}
			else {ele_timerbar.style.width = cdSeconds*10+'px';ele_nextskillpoint.style.left = (cdSeconds + difference)*10+'px'}	
		}
	}
	/* 下P
		调整currentPart数组的值时间成为绝对值
	*/
	function nextpart(){
		if(!doing && currentTimeline.length>2 && _mainTimer&&currentP != 3&&currentTimeline[currentP+1]){
			doing = true;	
			currentP++;
			ele_partn.textContent = "P"+ currentP;	
			for(var i =0; i<currentTimeline[currentP].length;i++){
				currentTimeline[currentP][i].sec += currentT;
			}
			tuning =true;
			setTimeout(function(){doing = false},2000);
		}
	};
	/* 时间微调
	*/
	function tuningplus(){
		if(currentP== 1) {
			currentT++;
			tuning = true;
		}
		else{
			for(var i =0; i<currentTimeline[currentP].length;i++){
				currentTimeline[currentP][i].sec--;
			}
			tuning = true;
		}
		
	};
	function tuningmin(){
		if (currentT<=0) return;
		if(currentP== 1) {
			currentT--;
			tuning = true;
		}
		else{
			if(cdSeconds>=currentSkill.sec) return;
			for(var i =0; i<currentTimeline[currentP].length;i++){
				currentTimeline[currentP][i].sec++;
			}
			tuning = true;
		}
	};
	/* 打开设置 */
	function opensetting(){
		switchApp(false);
		var options = {
			"id":"setting",
			"focus":true
		};
		nw.Window.open('/timeline/pages/setting.html', options, function(new_win) {
			timeline.win_setting = new_win;
			new_win.on('closed',function(){
				localStorage.setItem('editBossindex',0);
			})
		});
	}
	
/* } */
	
global.module.exports.timeline = timeline;	