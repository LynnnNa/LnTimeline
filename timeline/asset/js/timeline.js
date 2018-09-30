/* **
	Copyright (C) 2018 Lynn
	All rights reserved
	http://www.lynnote.site
	
***/
var path = require("path");  
var execPath = path.dirname(process.execPath);  
var timeline = {
	path : process.cwd()+"\\timeline",
	datapath : execPath+"\\data",
	exportpath : execPath+"\\data\\export"
}
window.onload = function(){	
var currentT,
	currentS,
	preSkill,  
	cskill = {},
	currentTimeline,
	currentP, 
	cboss = {},
	_mainTimer,
	mainTimer,
	cdSeconds,
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
	try{
		chrome.tts.getVoices(
          function(voices) {
			let hasCN = false;
            for (var i = 0; i < voices.length; i++) {
				console.log(i)
			  let lang = voices[i].lang;
              if(lang == "zh-CN" || lang == "zh-HK" || lang == "zh-TW")
			  {hasCN = true; break;}
			}
			if (!hasCN) errormsg("您的系统中没有中文TTS语音包,这可能会影响软件中的语音功能");
		});	
		chrome.tts.speak("", {'lang': 'zh-CN', 'rate': 1});
	}catch(e){
		errormsg("语音功能初始化失败");
	}
	/* module */
	var dataconversion = require('dataconversion'),
		// quickSortskill = dataconversion.quickSortskill;
		sortrduplication = dataconversion.sortrduplication;
		copyObj = dataconversion.copyObj;
	function initVariate(){
		menuitem_last = null;
		currentT = null;
		cskill.spoints = [{skillname:"初始化",sec:0},{skillname:"当前技能",sec:0},{skillname:"下一技能",sec:20}];
		cskill.tpoints = [];
	}
	timeline.initApp = function (){
		win = nw.Window.get();
		win.resizeTo(356, 57);	
		if(!win.isTransparent) document.body.style.background = "#606060";
		//win.setResizable(false);
		initVariate();
		/* 数据读取
		*/
		try{
			fs =require("fs");
			let data = timeline.sfdata = JSON.parse(fs.readFileSync(timeline.datapath+"\\default.dat",'utf-8'));
			sfdata = copyObj(data).data;
		}catch(e){
			errormsg('读取数据失败,请确保data文件夹没有丢失, 尝试以管理员身份重新开启本软件');
			closeApp(win);
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
			traymenu.append(new nw.MenuItem({ label: '最小化' ,click:function(){ win = nw.Window.get();win.minimize();} }));
			traymenu.append(new nw.MenuItem({ label: '打开主界面' ,click:function(){ win = nw.Window.get();win.restore();} }));
			traymenu.append(new nw.MenuItem({ label: '关闭',click:function(){timeline.tray.remove();timeline.tray = null;gui.App.closeAllWindows();} }));
			tray.menu = traymenu;
			tray.on('click',function(e){
				win = nw.Window.get();
				if(!winmin) {  win.minimize();  }
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
			errormsg('托盘初始化失败,请确保data文件夹没有丢失或损坏');
			//closeApp(win);
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
		intMaintimeline();
	}
	timeline.initApp();
	
	function errormsg(msg){
		alert(msg);
	}
	/* 选择boss */
	function checkboss(lv1_menuItem,lv2_menuItem,fbid,bossid){
		if(menuitem_last) menuitem_last.checked = false;
		lv2_menuItem.checked = true;
		timeline.menuitem_last = menuitem_last = lv2_menuItem;
		try{
		timeline.win_setting.reload();}
		catch(e){}
	}
	/* 装载boss数据 */
	function loadboss(fbid,bossid,FBname,bossName,bossParts){
		timeline.currentFBID = currentFBID = fbid;
		//timeline.FBcontainer = FBcontainer = sfdata[fbid];
		cboss = {
			fbid:fbid,
			bossid:bossid,
			FBname:FBname,
			bossName:bossName,
			bossParts:bossParts,
			pindex:1,
			};
		timeline.settingFbid = fbid;
		cskill = loadPart(1,bossParts);
		ele_bossname.textContent = cboss.bossName;
		intMaintimeline();
	}
	function loadPart(pindex,parts,increment){
		increment = increment || 0;
		let partTL = copyObj(parts[pindex])||[],
			partTLspecial = copyObj(parts[0])||[]
			_cskill = {}
			;
		_cskill.spoints = [];
		_cskill.tpoints = [];
		partTLspecial.forEach(function(sskill,i){
			sskill.special = true;
			partTL.push(sskill);
		});
		partTL.forEach(function(skill,i){
			let point = {};
			point.sec =skill.sec+(skill.special?0:increment);
			point.skillname = skill.skillname;
			point.special = skill.special;
			if(skill.tts){
				skill.tts.forEach(function(_tts,j){
					let pointts = {},_sec = skill.sec;
					pointts.ttscd = _sec<=0?(-_tts.ttscd): _sec -_tts.ttscd + (skill.special?0:increment);
					pointts.ttsstr = _tts.ttsstr;
					_cskill.tpoints.push(pointts);	
				})
			}
			_cskill.spoints.push(point);	
			if(i == 0){
				let origin = {sec:0,skillname:skill.skillname};
				_cskill.spoints.push(origin);	
			}
		});
		_cskill.spoints = sortrduplication(_cskill.spoints);
		_cskill.tpoints = sortrduplication(_cskill.tpoints);
		return _cskill;
	}
	/* 为副本创建托盘菜单 */
	function createMenuforFB(sfdata){
		let menu = new nw.Menu();
		// sfdata.forEach(function(FB,fbid){
		for(let i=sfdata.length-1;i>=0;i--){
			let _submenu = new nw.Menu(),
				FB = sfdata[i],
				fbid = i,
				Fbbosses = FB.FBbosses
				;
				Fbbosses.forEach(function(boss,bossid){
					let lv2_menuItem,
					option = {
						label:boss.bossName,
						type: 'checkbox',
						click:function(){
							checkboss(lv1_menuItem,lv2_menuItem,fbid,bossid);
							loadboss(fbid,bossid,FB.FBname,boss.bossName,boss.bossParts);
						}
					}
					;
					lv2_menuItem = new nw.MenuItem(option);
					_submenu.append(lv2_menuItem);	
				});
				let option = {
					label:FB.FBname,
					submenu:_submenu
				}
				let lv1_menuItem = new nw.MenuItem(option);
				menu.append(lv1_menuItem);
		};
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
					// errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
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
					// errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
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
					// errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
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
					// errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
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
		try{
			for(var i=0; i<hotkeys.length; i++){
				shortcuts[i] = new nw.Shortcut(hotkeys[i]);
				nw.App.registerGlobalHotKey(shortcuts[i]);
			} 
		}catch(e){
			errormsg("快捷键注册失败,请尝试以管理员身份重新开启本软件.");
			closeApp(win);
		}
		//关闭窗口前注销快捷键,会自动注销可不写
		win.on('close',function(){
			for(var i=0; i<shortcuts.length; i++){
				nw.App.unregisterGlobalHotKey(shortcuts[i]);
			}
			closeApp(this);
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
	function closeApp(_win){
		if(timeline.tray){
			timeline.tray.remove();
			timeline.tray = null;
		}
		_win.close(true);
	}
	function intMaintimeline(){
		clearInterval(mainTimer);
		let initS = cskill.spoints[0] || {skillname:"初始化",sec:0},
			firstS = cskill.spoints[1] || {skillname:"无",sec:0},
			secondS = cskill.spoints[2] || {skillname:"无",sec:541},
			difference = secondS.sec - firstS.sec || 0;
		updateCskill(0,1,firstS,secondS,difference);
		
		currentT = currentS = initS.sec;		
		ele_partn.textContent = "P1";
		ele_cdskill.textContent = firstS.skillname;
		ele_nextskillname.textContent=secondS.skillname;
		clockms();	
		countdownCore();
		if(menuitem_last) ele_msg.style.display = 'none';
		else ele_msg.style.display = 'block';	
		
	}
	/* 开始|停止 
	*/
	function switchApp(com){
		//开始
		if(com)
		{	if(_mainTimer) return;
			if(!menuitem_last) return;
			clearInterval(mainTimer);
			cdbySecond();
			mainTimer = setInterval(function(){
				if(currentT > 540) switchApp(false);
				cdbyFrame(); //逐帧执行
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
	/* 逐帧执行
	*/
	function cdbyFrame(){ 
		currentT += 1/FPS;
		let _currentT = Math.floor(currentT);
		if(_currentT>currentS || tuning){
			currentS = _currentT;
			cdbySecond();//逐秒执行
		}else {
			currentS = _currentT;
			countdownCore(); //逐帧执行
		}
	}
	//逐秒执行
	function cdbySecond(){
		clockms();
		ttsSpeak();
		countdownSwitchskill();
		countdownCore();
	}
	function clockms(){
		if(currentS>=0){
			ele_min.innerHTML = Math.floor(currentS/60); 
			ele_sec.innerHTML = currentS%60 > 9 ? currentS%60 : '0' + currentS%60; 
		}else{
			ele_min.textContent = '-';
			ele_sec.textContent = '-';
		}
	}
	function ttsSpeak(){
		if(cskill.ttsindex < cskill.tpoints.length){
			let tcd = cskill.tpoints[cskill.ttsindex].ttscd,
				tstr = cskill.tpoints[cskill.ttsindex].ttsstr;	
			if(currentS == tcd){
				try{
				chrome.tts.speak(tstr, {'lang': 'zh-CN', 'rate': 1.5, 'enqueue': true});
				}catch(e){}
				cskill.ttsindex++;
			}
		}
	}
	/* 倒计时条
	*/
	function countdownCore(){
		cdSeconds = cskill.currentSkill.sec - currentT || 0;
		cdSecondsint = cskill.currentSkill.sec - currentS || 0;
		if(cdSecondsint >= 0){
			ele_countdowns.textContent = cdSecondsint + 's';
			let ele_point = ele_timerbar.querySelector('.skillpoint');
			if(cskill.currentSkill.special) ele_point.classList.add('special');	else ele_point.classList.remove('special');	
			if(cskill.nextSkill.special)ele_nextskillpoint.classList.add('special'); else ele_nextskillpoint.classList.remove('special');
			if(cdSeconds>=35) {ele_timerbar.style.width = 35*10+'px';ele_nextskillpoint.style.left = "360px;";}
			else {ele_timerbar.style.width = cdSeconds*10+'px';ele_nextskillpoint.style.left = (cdSeconds + cskill.difference)*10+'px';}
		}
	}
	function countdownSwitchskill(){
		let tindex,
			sindex,
			_point,
			_currentSkill,
			_nextskill,
			difference,
			spoints = cskill.spoints;
			tpoints = cskill.tpoints;
		if(currentS > cskill.currentSkill.sec){
			sindex = cskill.skillindex?cskill.skillindex+1:0;
			_currentSkill = spoints[sindex]||{skillname:'无',sec:0};
			_nextskill = spoints[sindex+1]||{skillname:'无',sec:0};
			difference = _nextskill.sec - _currentSkill.sec;
			updateCskill(tindex,sindex,_currentSkill,_nextskill,difference);
			ele_cdskill.textContent = _currentSkill.skillname;
			ele_nextskillname.textContent=_nextskill.skillname;
		}	
		if(tuning){
			try{
			chrome.tts.stop();
			}catch(e){
				
			}
			_currentSkill = {skillname:'',sec:0};
			_nextskill = {skillname:'',sec:0};
			tuning = false;
			for(let i=0; i<spoints.length;i++ ){
				let skill = spoints[i];
				if(skill.sec > currentS ) 
				{
					_currentSkill = skill;
					_nextskill = i<spoints.length-1?spoints[i+1]:{skillname:'',sec:540};
					difference = _nextskill.sec - skill.sec;
					sindex = i;
					break;
				}
			};
			for(let i=0; i<tpoints.length;i++ ){
				let point = tpoints[i];
				if(point.ttscd > currentS) 
				{
					tindex = i;
					break;
				}
			};
			updateCskill(tindex,sindex,_currentSkill,_nextskill,difference);
			ele_cdskill.textContent = _currentSkill.skillname;
			ele_nextskillname.textContent=_nextskill.skillname;
		}
	}	
	function updateCskill(ttsindex,skillindex,currentSkill,nextSkill,difference){
		cskill = cskill || {};
		cskill.ttsindex = ttsindex==undefined?cskill.ttsindex:ttsindex;
		cskill.skillindex = skillindex==undefined?cskill.skillindex:skillindex;
		cskill.currentSkill = currentSkill==undefined?cskill.currentSkill:currentSkill;
		cskill.nextSkill = nextSkill==undefined?cskill.nextSkill:nextSkill;
		cskill.difference = difference==undefined?cskill.difference:difference;
		// cskill.tpoints = tpoints || cskill.tpoints;
		// cskill.spoints = spoints || cskill.spoints;
	}
	/* 下P
		调整currentPart数组的值时间成为绝对值
	*/
	function nextpart(){
		if (currentT<=0) return;
		if(!doing && cboss.pindex < cboss.bossParts.length-1 && _mainTimer){
			doing = true;	
			cboss.pindex++;
			ele_partn.textContent = "P"+ cboss.pindex;
			cskill.spoints = loadPart(cboss.pindex,cboss.bossParts,currentS).spoints;
			cskill.currentSkill = cskill.spoints[1];
			tuning =true;
			setTimeout(function(){doing = false},2000);
		}
	};
	/* 时间微调
	*/
	// 快进
	function tuningplus(){
		if(cboss.pindex == 1) {
			currentT++;
		}
		else{
			for(var i = 1; i<cskill.spoints.length;i++){
				if(!cskill.spoints[i].special)
				cskill.spoints[i].sec--;
			}
		}
		tuning = true;
	};
	function tuningmin(){
		if (currentT<=0) return;
		if(cboss.pindex == 1) {
			currentT--;
		}
		else{
			if(cdSeconds>=cskill.currentSkill.sec) return;
			for(var i = 1; i<cskill.spoints.length;i++){
				if(!cskill.spoints[i].special)
				cskill.spoints[i].sec++;
			}
		}
		tuning = true;
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

 }
	
global.module.exports.timeline = timeline;	