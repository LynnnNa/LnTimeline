window.onload = function(){
	var
		ele_bossListwarp = document.getElementById('bosslist'),  //boss列表wrap
		ele_addBoss = document.getElementById('addBoss'),  //添加boss
		ele_jsonboxs, //input
		ele_currentFB= document.getElementById('currentFB'), //当前副本集
		ele_jsonwrap= document.getElementById('json'), //
		ele_datasave = document.getElementById('dataSave'),  //时间轴数据保存
		ele_hotkeysave = document.getElementById('hotkeySave'),  //快捷键保存
		ele_nav = document.getElementById('settingNav'),  //导航
		ele_navli = ele_nav.getElementsByTagName('li'),  //导航li
		ele_contents = document.getElementById('content').children,  //content divs
		ele_hotkeys = document.getElementById('hotkeys').querySelectorAll('input'),  //content divs
		ele_confirm = document.getElementById('confirm'),  //确认对话框
		ele_userInputdialog = document.getElementById('userInputdialog'),  //用户输入对话框
		ele_userInput = document.getElementById('userInput'),  //用户输入内容
		ele_bossDelete = document.getElementById('bossDelete'),  //删除当前boss
		ele_checkbossmsg = document.getElementById('checkbossmsg'),  //选择boss提示信息
		flg_staging_updataing = [false,false],
		editBossindex = localStorage.getItem('editBossindex') || 0,
		ele_msg = document.getElementById('msg'), //msg
		win,
		timeline, 
		FBcontainer,
		currentFBID,
		tofs_FBcontainer,
		tofs_data,
		// traymenu,
		hotkey,
		_hotkey,
		currentTimeline,
		currentBossname,  
		ele_currentBoss //[label,div.show]
		;
	var DELETEBOSS = '确认删除该boss吗? <br /> 确认后, 点击 "保存" 键永久删除.'
		;
	/* module */
	var dataconversion = require('dataconversion'),
		inputStrToJsonArray = dataconversion.inputStrToJsonArray,
		jsonArrTonputStr = dataconversion.jsonArrTonputStr,
		copyObj = dataconversion.copyObj
		;
	/* 公共方法 */
	function tlconfirm(callback){
		ele_confirm.style.display = 'block';
		new Promise(function(resolve,reject){
			ele_confirm.querySelectorAll('a')[0].onclick = function(){
				resolve();
			};
			ele_confirm.querySelectorAll('a')[1].onclick = function(e){
				reject()
			};
		}).then(function(){
			callback();
			ele_confirm.style.display = 'none';
		}).catch(function(){
			ele_confirm.style.display = 'none';
		});
	}
	function tluserInput(callback){
		ele_userInputdialog.style.display = 'block';
		ele_userInput.focus();
		new Promise(function(resolve,reject){
			ele_userInputdialog.addEventListener('keyup',function(){
				if (event.keyCode == "13") {
					if(ele_userInput.value.trim()!='')
					resolve(ele_userInput.value);
					else alert('boss名称不能为空')
				}
			});
			ele_userInputdialog.querySelectorAll('a')[0].onclick = function(){
				if(ele_userInput.value.trim()!='')
					resolve(ele_userInput.value);
					else alert('boss名称不能为空')
			};
			ele_userInputdialog.querySelectorAll('a')[1].onclick = function(e){
				reject()
			};
		}).then(function(text){
			callback(text);
			ele_userInputdialog.style.display = 'none';
		}).catch(function(){
			ele_userInputdialog.style.display = 'none';
		});
	}
	function stagingAlert(){
		
	}
	function quickSortjson(array, left, right) {
		if (left < right) {
			var x = array[right].sec, i = left - 1, temp;
			for (var j = left; j <= right; j++) {
				if (array[j].sec <= x) {
					i++;
					temp = array[i];
					array[i] = array[j];
					array[j] = temp;
				}
			}
			quickSortjson(array, left, i - 1);
			quickSortjson(array, i + 1, right);
		}
	　　return array;
	}	
	function updataCurrntbossdata(){
		let
		 fs_json = [],
		 str_currrntBossname = ele_currentBoss[0].textContent,
		 ele_currrntJsonboxs = ele_currentBoss[1].querySelectorAll('div')
		 ;
		for(let i=0; i<ele_currrntJsonboxs.length; i++){
			let jsonarr = inputStrToJsonArray( ele_currrntJsonboxs[i].textContent) || undefined;
			if(jsonarr == "error"){ele_currrntJsonboxs[i].classList.add('error'); return;}
			if(!jsonarr && i<2) fs_json[i]='';
			if(jsonarr!=undefined)	{
				// jsonarr = sortJsonArr(jsonarr);   //Array 0:{sec: 174, name: "箭雨/冰弹"}
				/* jsonarr.forEach(function(items, index){
					items.sec
				}) */
				fs_json.push(quickSortjson(jsonarr, 0, jsonarr.length-1));
				//fs_json.push(jsonarr);
			}
		}
		FBcontainer[str_currrntBossname] = fs_json;
	}
	function setGlobalmsg(isshow,msg){
		ele_msg.style.display = isshow;
		ele_msg.querySelector('h1').innerHTML = msg;
	}
	
	/* 主导航 
	*/
	for(let i=0; i<ele_navli.length;i++){
		ele_navli[i].addEventListener('click',function(e){
			for(let li of ele_navli){
				li.classList.remove('on');
			}
			for(let div of ele_contents){
				div.classList.remove('show');
			}
			ele_navli[i].classList.add('on');
			ele_contents[i].classList.add('show');
		});
	}
	/* 创建boss */
	function createBoss(boss,i,bossname){
		var _boss = boss;
		var _i = i;
		/* 创建radio */
		this.ele_radioli = function(i){
			i = i||_i;
			boss = boss || bossname;
			var ele_radioli = document.createElement('li');
			ele_radioli.innerHTML = '<label><input type="radio" name="boss" value="'+boss+'" />'+boss+'</label>';
			//boss点击事件
			ele_radioli.firstElementChild.onclick = function(){
					ele_currentBoss = [this,ele_jsonwrap.children[i]];
					//currentBossname = this
					for(let ele of ele_jsonwrap.children){
						ele.classList.remove('show');
					}
					ele_jsonwrap.children[i].classList.add('show');
					//traymenu.items[i].click();
					localStorage.setItem('editBossindex',i);
			};
			return ele_radioli;
		};
		/* 创建tab div */
		this.ele_div = function(text){
			var ele_jsondiv = document.createElement('div');
			ele_jsondiv.setAttribute('class','json');
			ele_jsondiv.setAttribute('contenteditable','true');
			ele_jsondiv.textContent = text;
			ele_jsondiv.addEventListener('keyup',function(e){
				checkjsoninput(this);
			});
			ele_jsondiv.addEventListener('blur',function(e){
				if(checkjsoninput(this)) updataCurrntbossdata();
			});
			return ele_jsondiv;	
		}
		this.ele_divcontainer = function(boss,i){
			boss = boss||_boss;
			i = i||_i;
			//创建tab content元素
			var ele_div = document.createElement('div');
			ele_div.setAttribute('id','json-'+i);
			
			//为单tab创建div input
			tldata = boss==undefined?['','']:FBcontainer[boss];
			for(let i=0; i<tldata.length; i++){
				let jsonstr = jsonArrTonputStr(tldata[i]);
				ele_div.append(new createBoss().ele_div(jsonstr));
			}
			
			//添加Part按钮
			var ele_addbtn = document.createElement('p');
			ele_addbtn.addEventListener('click',function(){
				this.parentElement.append(new createBoss().ele_div(''));
				this.parentElement.append(this)
			});
			ele_div.appendChild(ele_addbtn);
			return ele_div;
		}
	}

	/* tab-时间轴 radio初始化 
	*/
	try{
		win = nw.Window.get();
		timeline = global.module.exports.timeline;
		FBcontainer = copyObj(timeline.FBcontainer.data);
		// traymenu = timeline.traymenu;
		intimelinedata();
		if(timeline.currentFBID)ele_checkbossmsg.style.display = 'none';
		
	}
	catch(e){
	console.log(e)
	}
	function intimelinedata(){
		ele_bossListwarp.innerHTML = '';
		ele_jsonwrap.innerHTML = '';
		let i=0;
		ele_currentFB.value = timeline.FBcontainer.name;
		for(boss in FBcontainer){		
			var obj_boss = new createBoss(boss,i);
			var ele_radioli = obj_boss.ele_radioli();
			var ele_div = obj_boss.ele_divcontainer();
			ele_jsonwrap.appendChild(ele_div);
			ele_bossListwarp.appendChild(ele_radioli);
			i++;
		}
		editBossindex = editBossindex<ele_bossListwarp.children.length?editBossindex:0;
		ele_bossListwarp.children[editBossindex].firstChild.click();
	}
	//数据检测
	function testJsonstr(str){
		var reg = /^[1-9][0-9]*:[^:^,]+(,[1-9][0-9]*:[^:^,]+)*,{0,1}$/;
		return reg.test(str);
	}
	function checkjsoninput(jsonboxs){
		if(jsonboxs.textContent.trim()!=='' && !testJsonstr(jsonboxs.textContent)){
			jsonboxs.classList.add('error');
			return false;
		}else {
			jsonboxs.classList.remove('error');
			return true;
		}
	}
	/* 添加boss */
	ele_addBoss.addEventListener('click',function(){
		tluserInput(function(text){
			let i = ele_bossListwarp.children.length,
			obj_boss = new createBoss(undefined,i,text),
			ele_radioli = obj_boss.ele_radioli(),
			ele_div = obj_boss.ele_divcontainer()
			;
			ele_jsonwrap.appendChild(ele_div);
			ele_bossListwarp.appendChild(ele_radioli);
			FBcontainer[text] = ['',''];
			ele_radioli.firstElementChild.click();
			ele_userInput.value = '';
		})
		
	});
	/* 删除当前boss */
	ele_bossDelete.addEventListener('click',function(e){
		if(ele_jsonwrap.children.length<=1) {
			alert("请保留至少一个boss");
			return;
		}
		ele_confirm.querySelector('h1').innerHTML = DELETEBOSS;
		tlconfirm(function(){
			let boss = ele_currentBoss[0].lastChild.nodeValue,
				ele_li = ele_currentBoss[0].parentElement;
				ele_div = ele_currentBoss[1];
				;
			delete FBcontainer[boss];
			ele_bossListwarp.removeChild(ele_li);
			ele_jsonwrap.removeChild(ele_div);
			// ele_bossListwarp.firstChild.firstChild.click();  //默认执行 无需写代码
			intimelinedata();
		});
	});
	/* 保存 时间轴数据
	*/
	ele_datasave.addEventListener('click',function(e){
		if(flg_staging_updataing[1]) return;
		flg_staging_updataing[1] = true;
		setGlobalmsg('block',"保存中...");
		var
		 fbname = ele_currentFB.value || FBcontainer.name
		;
		currentFBID = currentFBID || timeline.currentFBID;
		let fs =require("fs"),
			sfdata = JSON.parse(fs.readFileSync(timeline.datapath+"\\default.dat",'utf-8'));
		tofs_FBcontainer = {};
		/* 
		tofs_FBcontainer.data = tofs_FBcontainer || {"老1":['','']}; */
		tofs_data = sfdata || {};
		tofs_data[currentFBID].name=fbname;
		tofs_data[currentFBID].data = FBcontainer;
		try{
			fs =require("fs");
			fs.writeFileSync(timeline.datapath+"\\default.dat", JSON.stringify(tofs_data));
			new Promise(function(resolve,reject){
				setGlobalmsg('block',"保存完毕");
				setTimeout(function(){
					setGlobalmsg('none',"");
					resolve();
				},1000);
			}).then(function(){
				timeline.initApp();
			}).catch(function(){
				//console.log(e);
			})
			//win.reload();
			// ele_currentBoss[0].click();
		}
		catch(e){
			console.log(e)
		}		
	});
	
	/* tab-快捷键 
	*/
	try{
		hotkey = timeline.hotkey;
		_hotkey = copyObj(hotkey);
		ele_hotkeys.forEach(function(ele_input,i){
			//let i = i;
			ele_input.value = hotkey[i];
			ele_input.addEventListener('keydown',function(e){
				//shiftKey ctrlKey altKey
				e.preventDefault();
				let strvalue = '', _strvalue,
				 shiftKey = e.shiftKey,
				 ctrlKey = e.ctrlKey,
				 altKey = e.altKey;
				if(e.key != 'Control'){
					strvalue += shiftKey?'Shift+':'';
					strvalue += ctrlKey?'Ctrl+':'';
					_strvalue = strvalue += altKey?'Alt+':'';
					strvalue += e.key;
					_strvalue += e.code;
					this.value = strvalue;
					_hotkey[i] = _strvalue;
					//console.log(_hotkey);
				}
			})
		});
		
	}
	catch(e){
		console.log(e)
	}
	
	ele_hotkeysave.addEventListener('click',function(e){
		// hotkey = _hotkey;
		localStorage.setItem('hk_start',_hotkey[0]);
		localStorage.setItem('hk_stop',_hotkey[1]);
		localStorage.setItem('hk_forwd',_hotkey[2]);
		localStorage.setItem('hk_revrs',_hotkey[3]);
		localStorage.setItem('hk_nextp',_hotkey[4]);
		timeline.initApp();
	});
	}
	