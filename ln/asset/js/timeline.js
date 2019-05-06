/* **
	Copyright (C) 2018 Lynn
	All rights reserved
	http://www.lynnote.site
	
***/
//Secure Preferences
let path = require("path");
let Ln = global.module.exports.Ln;
const {copyObj:copyObj,sortrduplication:skillsort} = require('dataconversion');
const errormsg = Ln.errormsg;

var timeline = {},
	currentT,
	currentS,
	preSkill,  
	cskill = {},
	currentP, 
	cboss = {},
	_mainTimer,
	mainTimer,
	cdSeconds,
	doing = false, //防重标识
	tuning = false,  //是否微调了时间
	ele_controlarea = document.getElementById('controlarea'),  //body
	ele_maintimeline = document.getElementById('maintimeline'),  //总时间
	ele_tllist = document.getElementById('tllist'),  //tllist
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
	ele_pseudoRandom = document.getElementById('pseudoRandom'), //伪随机boss
	ele_msg = document.getElementById('msg'), //msg
	ele_timebox = document.getElementById('timebox'), //盒子形计时
	ele_tb_preMin = null, //盒子形计时上一个当前行
	ele_tb_preSkill = null, //盒子形计时上一个当前skill
	// ele_skinLine = document.getElementById('skinLine'), //选择皮肤line
	// ele_skinBox = document.getElementById('skinBox'), //选择皮肤box
	FPS = 20
	;
	var fs,sfdata, FBcontainer, jsonobj, currentFBID, currentBossname
	;
	
	/* nw */
	var win = nw.Window.get(),winmin = false, gui = require('nw.gui'), menuitem_last,
	moveing,
	hotkeys,
	shortcuts,
	msgHotKeyfailed = false
	;
	window.onload = function(){	
		try{
			chrome.tts.getVoices(
			  function(voices) {
				let hasCN = false;
				for (var i = 0; i < voices.length; i++) {
					console.log(i);
				  let lang = voices[i].lang;
				  if(lang == "zh-CN" || lang == "zh-HK" || lang == "zh-TW")
				  {hasCN = true; break;}
				}
				//if (!hasCN) errormsg("您的系统中没有中文TTS语音包,这可能会影响软件中的语音功能");
			});	
			chrome.tts.speak("", {'lang': 'zh-CN', 'rate': 1});
		}catch(e){
			errormsg("语音功能初始化失败");
		}
		/* module */
		timeline.initData();
		timeline.initApp();
		timeline.intMaintimeline();
		timeline.initTray();
		timeline.intAppear();
	}
	function initVariate(){
		menuitem_last = null;
		currentT = null;
		cskill.spoints = [{skillname:"初始化",sec:0},{skillname:"当前技能",sec:0},{skillname:"下一技能",sec:20}];
		cskill.tpoints = [];
	}
	timeline.initData = function (){
		initVariate();
		/* 数据读取
		*/
		try{
			fs =require("fs");
			let data = timeline.sfdata = JSON.parse(fs.readFileSync(Ln.datapath+"\\default.dat",'utf-8'));
			sfdata = copyObj(data).data;
		}catch(e){
			errormsg(window, '读取数据失败,请确保data文件夹没有丢失, 尝试以管理员身份重新开启本软件');
			closeTimeline();
		}
	}
	timeline.initTray = function (){
		/* 托盘 */	
		try{
			/* if (Ln.tray) {
				Ln.tray.remove();
				Ln.tray = null;
			} */
			Ln.tray.menu = Ln.traymenu;
			let traymenu = createMenuforFB(sfdata);
			traymenu.append(new nw.MenuItem({label: '设置', click:opensetting}));
			for(let item of Ln.tray.menu.items){
				if(item.label == "时间轴"){
					item = new nw.MenuItem({label: '关闭时间轴', click:closeTimeline});
				}
				else{
					item = new nw.MenuItem({label: item.label, click:item.click});
				}
				traymenu.append(item);
			}
			Ln.tray.menu = traymenu;
			// if(menuitem_last) menuitem_last.click();
		}catch(e){ 
			errormsg(window,'托盘初始化失败,请确保data文件夹没有丢失或损坏');
			closeTimeline(win);
		}
	}
	timeline.initApp = function (){
		win = nw.Window.get();
		// win.resizeTo(356, 57);	
		if(!win.isTransparent) document.body.style.background = "#606060";
		//win.setResizable(false);
	
		timeline.registerGHotKey();
		
		/* 主窗口初始化 */
		try{
			ele_controlarea.addEventListener('mouseenter',function(e){
				Ln.addClass(this,"tlhover");
			});
			ele_controlarea.addEventListener('mouseleave',function(e){
			Ln.removeClass(this,"tlhover");
			});
			ele_controlarea.addEventListener('mousedown', function (e) {
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
			ele_controlarea.addEventListener('mouseup', function (e) {
			  e.preventDefault();		
			  if (e.button != 2)
				moveing = null;
			});
			win.on('resize', function() {
			  //this.resizeTo(356, 157);	
			});
			/* ele_skinLine.addEventListener('click',function(){
					ele_maintimeline.style.display = ''
			});
			ele_skinBox.addEventListener('click',function(){
				
			}); */
		}catch(e){ 
			errormsg(window, '初始化窗口失败');
		}
		win.on('close',function(){
			localStorage.setItem('editBossindex',0);
			global.module.exports.timeline = null;
			try{
				Ln.tray.menu = Ln.traymenu;
				for(var i=0; i<shortcuts.length; i++){
					nw.App.unregisterGlobalHotKey(shortcuts[i]);
				}
			}catch(e){}
			this.close(true);
		});
	}
		
	/* 选择boss */
	function checkboss(lv1_menuItem,lv2_menuItem,fbid,bossid){
		if(menuitem_last) menuitem_last.checked = false;
		lv2_menuItem.checked = true;
		// lv1_menuItem.checked = true;
		timeline.menuitem_last = menuitem_last = lv2_menuItem;
		try{
		Ln.win_setting.reload();
		}
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
		/* if(bossName == "老1乌夜啼"){
			pseudoRandom(bossParts);
		} else  
			ele_pseudoRandom.style.display = "none";*/
		cskill = loadPart(1,bossParts);
		ele_bossname.textContent = cboss.bossName;
		timeline.intMaintimeline();
		timeline.inttimebox();
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
		_cskill.spoints = skillsort(_cskill.spoints);
		_cskill.tpoints = skillsort(_cskill.tpoints);
		return _cskill;
	}
	function pseudoRandom(bossParts){
		ele_pseudoRandom.style.display = "block";
		skillbths = ele_pseudoRandom.querySelectorAll('span');
		skillbths.forEach(function(btn,i){
			let _i = i
				skillarr = ["沸血针","背刺", "冰圈", "飞镖"];
			;
			let	partTL = copyObj(bossParts)||[];
			btn.onclick = function(){
				partTL[1].forEach(function(skill,j){
					if(skill.sec < 340 || skill.sec > 357){
						let sindex = (j+_i)%4 ;
						skill.skillname = skillarr[sindex];
						skill.tts[0].ttsstr = skillarr[sindex];
					}
				});
				let _cskill = loadPart(1,partTL);
				cskill.spoints = _cskill.spoints;
				cskill.tpoints = _cskill.tpoints;
				//ele_pseudoRandom.style.display = "none";
				tuning = true;
			skillbths.forEach(function(btn,i){
				btn.classList.remove('on');
			});
			btn.classList.add('on');
			}
			
		})
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
	timeline.registerGHotKey = ()=>{
		
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
					msgHotKeyfailed = true;
					}
				}
			}
		];
		
		shortcuts = Ln.shortcuts = Ln.shortcuts||[];
		//注销快捷键
		/* for(var i=0; i<shortcuts.length; i++){
			nw.App.unregisterGlobalHotKey(shortcuts[i]);
		} */
		//注册全局快捷键
		try{
			for(var i=0; i<hotkeys.length; i++){
				shortcuts[i] = new nw.Shortcut(hotkeys[i]);
				nw.App.registerGlobalHotKey(shortcuts[i]);
			} 
		}catch(e){
			errormsg(window, "快捷键注册失败,请尝试以管理员身份重新开启本软件.");
			closeTimeline();
		}	
	}
	function closeTimeline(){
		/*if(timeline.tray){
			timeline.tray.remove();
			timeline.tray = null;
		} */
		if(Ln.win_setting) Ln.win_setting.close();
		win.close();
	}
	timeline.intMaintimeline = ()=>{
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
	timeline.intAppear = () => {
		let appeartl = localStorage.getItem('appear0') || 'checked';
		let appearList = localStorage.getItem('appear1') || 'checked';
		ele_maintimeline.style.display = appeartl == 'checked'?"block":"none";
		ele_tllist.style.display = appearList == 'checked'?"block":"none";
	}
	timeline.inttimebox = () => {
		// cskill
		ele_timebox.innerHTML = null;
		ele_timebox.style.marginTop = 0;
		if(ele_tb_preMin) Ln.removeClass(ele_tb_preMin,"linenow");
		if(ele_tb_preSkill) Ln.removeClass(ele_tb_preSkill,"linow");;
		let {spoints:skill} = cskill;
		let ele_skillul = document.createElement('ul');
		ele_skillul.className = "clearfix linenow";
		ele_skillul.id = "line0";
		let min = 0,lastminindex = 0;
		for(let i=1;i< skill.length; i++){
			let ele_skillli = document.createElement('li');
			let ele_skilllispan1 = document.createElement('span');
			let ele_skilllispan2 = document.createElement('span');
			let _min = Math.floor(skill[i].sec/60), sec = skill[i].sec%60<10?'0'+skill[i].sec%60:skill[i].sec%60; /* diff = skill[i+1].sec%60 - sec */
			time = _min + ":" + sec;
			ele_skilllispan1.innerHTML = time;
			ele_skilllispan2.innerHTML = skill[i].skillname;
			ele_skillli.id = "li"+_min+sec;
			if(i==1) {ele_skillli.className = "linow";ele_tb_preSkill = ele_skillli;}
			ele_skillli.appendChild(ele_skilllispan1);
			ele_skillli.appendChild(ele_skilllispan2);
			// if(_min>min) {ele_skillli.className = "clearleft";min = _min;}
			if(_min>min) {
				min = _min;
				ele_skillul = document.createElement('ul');
				ele_skillul.className = _min>2 ? "clearfix" : "clearfix line"+_min;
				ele_skillul.id = "line"+_min;
			}
			ele_skillul.appendChild(ele_skillli);
			ele_timebox.appendChild(ele_skillul);
		}
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
		timeboxCore();
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
	/* 倒计时盒 
	*/
	function timeboxCore(){
		let min = Math.floor(currentS/60);
		let preMin = min?min-1:0;
		if(currentS%60 == 1|| tuning){	
			let curline = document.getElementById('line'+min);
			ele_tb_preMin = ele_tb_preMin || document.getElementById('line'+preMin);
			if(ele_tb_preMin) Ln.removeClass(ele_tb_preMin,"linenow");
			if(curline) Ln.addClass(curline,"linenow");
			ele_tb_preMin = curline;
			ele_timebox.style.marginTop = min>1? "-" + (curline.offsetTop - curline.offsetHeight) + "px":0;	
		}
		let {currentSkill:skill} = cskill;
		let sec = skill.sec%60<10?'0'+skill.sec%60:skill.sec%60;
		let ele_preSkill = document.getElementById("li"+min+sec) || ele_tb_preSkill;
		if(ele_preSkill && (ele_tb_preSkill!=ele_preSkill || tuning)){
			if(ele_tb_preSkill) Ln.removeClass(ele_tb_preSkill,"linow");
			Ln.addClass(ele_preSkill,"linow");
			ele_maintimer.style.left =  ele_preSkill.offsetLeft + "px";
			ele_tb_preSkill = ele_preSkill;
		}else{
			
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
			if(cdSeconds>=25) {ele_timerbar.style.width = 25*10+'px';ele_nextskillpoint.style.left = "250px;";}
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
	}
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
	}
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
	}
	/* 打开设置 */
	function opensetting(){
		switchApp(false);
		var options = {
			"id":"setting",
			"focus":true
		};
		nw.Window.open('/ln/pages/setting.html', options, function(new_win) {
			Ln.win_setting = new_win;
			new_win.on('closed',function(){
				Ln.win_setting = null;
			})
		});
	}

	
global.module.exports.timeline = timeline;	