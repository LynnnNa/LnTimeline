/* Ajax公共方法 */
var Ajax={
    get: function(url, fn ,failfn) {
        var obj = new XMLHttpRequest();  // XMLHttpRequest对象用于在后台与服务器交换数据          
        obj.open('GET', url, true);
        obj.onreadystatechange = function() {
            if (obj.readyState == 4 && obj.status == 200 || obj.status == 304) { // readyState == 4说明请求已完成
                fn.call(this, obj.responseText);  //从服务器获得数据
            }
			else{
				failfn.call(this, obj.status);
			}
        };
        obj.send();
    },
    post: function (url, data, fn) {         // datat应为'a=a1&b=b1'这种字符串格式，在jq里如果data为对象会自动将对象转成这种字符串格式
        var obj = new XMLHttpRequest();
        obj.open("POST", url, true);
        obj.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // 添加http头，发送信息至服务器时内容编码类型
        obj.onreadystatechange = function() {
            if (obj.readyState == 4 && (obj.status == 200 || obj.status == 304)) {  // 304未修改
                fn.call(this, obj.responseText);
            }
        };
        obj.send(data);
    }
}
window.onload = function(){
	var
		ele_bossListwarp = document.getElementById('bosslist'),  //boss列表wrap
		ele_addBoss = document.getElementById('addBoss'),  //添加boss
		ele_addFBcontainer = document.getElementById('addFBcontainer'),  //添加副本集
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
		ele_importDat = document.getElementById('importDat'), //导入数据
		ele_exportDat = document.getElementById('exportDat'), //导出数据
		ele_userDatas = document.getElementById('userDatas'), //frame - data
		ele_homepage = document.getElementById('homepage'), //frame - 关于
		ele_tutorial = document.getElementById('tutorial'), //frame - 教程
		datavalid = true, 
		win,
		timeline, 
		sfdata,
		settingFbid,
		FBcontainer,
		tofs_data,
		// traymenu,
		hotkey,
		_hotkey,
		currentTimeline,
		currentBossname,  
		ele_currentBoss //[label,div.show,index]
		;
	var DELETEBOSS = '确认删除该boss吗? <br /> 确认后, 点击 "保存" 键永久删除.'
		;
	/* module */
	var dataconversion = require('dataconversion'),
		inputStrToJsonArray = dataconversion.inputStrToJsonArray,
		jsonArrTonputStr = dataconversion.jsonArrTonputStr,
		copyObj = dataconversion.copyObj,
		arrRemove = dataconversion.arrRemove,
		// quickSortskill = dataconversion.quickSortskill
		sortrduplication = dataconversion.sortrduplication;
		;
	/* 公共方法 */
	function tlconfirm(title,callback,fnreject){
		ele_confirm.querySelector('h1').innerHTML = title;
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
			if(fnreject) fnreject();
			ele_confirm.style.display = 'none';
		});
	}
	function tluserInput(title,tip,callback){
		ele_userInputdialog.querySelector('label').textContent = title;
		ele_userInputdialog.querySelector('.tip').textContent = tip;
		ele_userInputdialog.style.display = 'block';
		ele_userInput.focus();
		new Promise(function(resolve,reject){
			ele_userInputdialog.addEventListener('keyup',function(){
				if (event.keyCode == "13") {
					if(ele_userInput.value.trim()!='')
					resolve(ele_userInput.value);
					else alert(title+'不能为空')
				}
			});
			ele_userInputdialog.querySelectorAll('a')[0].onclick = function(){
				if(ele_userInput.value.trim()!='')
					resolve(ele_userInput.value);
					else alert(title+'不能为空')
			};
			ele_userInputdialog.querySelectorAll('a')[1].onclick = function(e){
				reject()
			};
		}).then(function(text){
			ele_userInputdialog.style.display = 'none';
			ele_userInput.value = '';
			callback(text);
		}).catch(function(){
			ele_userInputdialog.style.display = 'none';
			ele_userInput.value = '';
		});
	}
	function updataCurrntbossdata(){
		let
		 fs_json = [],
		 boxindex = ele_currentBoss[2],
		 ele_currrntJsonboxs = ele_currentBoss[1].querySelectorAll('div.json')
		 ;
		for(let i=0; i<ele_currrntJsonboxs.length; i++){
			let jsonarr = inputStrToJsonArray( ele_currrntJsonboxs[i].textContent) || undefined;
			if(jsonarr == "error"){ele_currrntJsonboxs[i].classList.add('error'); return;}
			if(!jsonarr && i<2) fs_json[i]=[];
			if(jsonarr!=undefined)	{
				fs_json.push(sortrduplication(jsonarr, 0, jsonarr.length-1));
			}
		}
		FBcontainer.FBbosses[boxindex].bossParts = fs_json;
	}
	function setGlobalmsg(isshow,msg){
		ele_msg.style.display = isshow;
		ele_msg.querySelector('h1').innerHTML = msg;
	}
	function showGlobalmsginsec(msg,sec){
		ele_msg.style.display = 'block';
		ele_msg.querySelector('h1').innerHTML = msg;
		setTimeout(function(){
			ele_msg.style.display = 'none';
		},sec*1000);
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
	/* 初始化外链页 */
	initLinkPages("http://timeline.lynnote.site/tl-data/",ele_userDatas);
	initLinkPages("http://timeline.lynnote.site/tutorial/",ele_tutorial);
	initLinkPages("http://timeline.lynnote.site/",ele_homepage);
	function initLinkPages(url,ele){
		try{
			Ajax.get(url,function(data){
				let domConsider = document.createElement('div');
				domConsider.innerHTML = data;
				var _html = domConsider.querySelector('#site-main').innerHTML;
				ele.innerHTML = _html;
				ele.querySelectorAll('a').forEach(function(ele_a,i){
					ele_a.onclick = function(e){
						e.preventDefault();
						nw.Shell.openExternal(this.href);
					}
				})
			},function(error){
				ele.innerHTML = error;
			});
		}catch(e){
			
		}
	}
	/* 创建boss */
	function createBoss(boss,i,bossname){
		let _boss = boss,
		_i = i;
		/* 创建radio */
		this.ele_radioli = function(i){
			i = i||_i;
			let	_bossname = bossname || boss.bossName;
			let ele_radioli = document.createElement('li');
			ele_radioli.innerHTML = '<label><input type="radio" name="boss" value="'+_bossname+'" />'+_bossname+'</label>';
			//boss点击事件
			ele_radioli.firstElementChild.onclick = function(){
					ele_currentBoss = [this,ele_jsonwrap.children[i],i];
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
			let ele_jsondiv = document.createElement('div');
			ele_jsondiv.setAttribute('class','json');
			ele_jsondiv.setAttribute('contenteditable','true');
			ele_jsondiv.innerHTML = text;
			ele_jsondiv.addEventListener('keyup',function(e){
				checkjsoninput(this);
			});
			ele_jsondiv.addEventListener('blur',function(e){
				datavalid = true;
				if(checkjsoninput(this)) updataCurrntbossdata(); 
				else datavalid = false;
			});
			return ele_jsondiv;	
		}
		this.ele_divcontainer = function(boss,i){
			boss = boss||_boss;
			i = i||_i;
			let bossParts = boss == undefined?[[],[]] : boss.bossParts;
			//创建tab content元素
			let ele_div = document.createElement('div');
			ele_div.setAttribute('id','json-'+i);
			
			//为单tab创建div input
			bossParts.forEach(function(cpart,pn){
				let jsonstr = jsonArrTonputStr(cpart);
				ele_div.append(new createBoss().ele_div(jsonstr));
			});
			
			//添加Part按钮
			let ele_addbtn = document.createElement('p');
			ele_addbtn.addEventListener('click',function(){
				this.parentElement.append(new createBoss().ele_div(''));
				this.parentElement.append(this);
			});
			ele_div.appendChild(ele_addbtn);
			return ele_div;
		}
	}
	
	/* tab-时间轴 radio初始化 
	*/
	timeline = global.module.exports.timeline;
	try{
		win = nw.Window.get();
		settingFbid = copyObj(timeline.settingFbid);
		initSetting(timeline);
	}catch(e){
		console.log(e)
	}
	function initSetting(tl){
			if(settingFbid==undefined) ele_checkbossmsg.style.display = 'block';
			else {ele_checkbossmsg.style.display = 'none';
			FBcontainer = copyObj(tl.sfdata.data[settingFbid]);
			intimelinedata();
			}	
	} 
	function intimelinedata(){
		ele_bossListwarp.innerHTML = '';
		ele_jsonwrap.innerHTML = '';
		let i=0;
		ele_currentFB.value = FBcontainer.FBname;
		FBcontainer.FBbosses.forEach(function(boss,bossid){
			var obj_boss = new createBoss(boss,bossid);
			var ele_radioli = obj_boss.ele_radioli();
			var ele_div = obj_boss.ele_divcontainer();
			ele_jsonwrap.appendChild(ele_div);
			ele_bossListwarp.appendChild(ele_radioli);	
		});
		editBossindex = editBossindex<ele_bossListwarp.children.length?editBossindex:0;
		ele_bossListwarp.children[editBossindex].firstChild.click();
	}
	//数据检测
	function testJsonstr(str){
		let reg = /^[1-9][0-9]*:[^:^,^\[^\]]+(\[(0|[1-9][0-9]*),[^:^,^\[^\]]+\])*$/;
		let strarr = str.split(';');
		for(let i=0;i<strarr.length;i++){
			if(i==0){
				//-5: 准备[5,准备开怪][3,3][2,2][1,1];
				let _reg = /^-{0,1}[1-9][0-9]*:[^:^,^\[^\]]+(\[(0|[1-9][0-9]*),[^:^,^\[^\]]+\])*$/;
				//let _reg = /^-{0,1}[1-9][0-9]*:[^:^,]+(,(0|[1-9][0-9]*){0,1},[^:^,]+){0,1}$/;
				if(!_reg.test(strarr[i])) return false;
				continue;
			}
			if(i==strarr.length-1 && strarr[i]==''){
				continue;
			}
			if(!reg.test(strarr[i])) return false;
		}		
		return true;
	}
	function checkjsoninput(jsonboxs){
		if(jsonboxs.textContent.trim()!=='' && !testJsonstr(jsonboxs.textContent)){
			jsonboxs.classList.add('error');
			return false;
			// return true;
		}else {
			jsonboxs.classList.remove('error');
			return true;
		}
	}
	function addboss(text){
		let i = FBcontainer.FBbosses.length,
			obj_boss = new createBoss(undefined,i,text),
			ele_radioli = obj_boss.ele_radioli(),
			ele_div = obj_boss.ele_divcontainer()
			;
			ele_jsonwrap.appendChild(ele_div);
			ele_bossListwarp.appendChild(ele_radioli);
			let newboss = {bossName: text, bossParts: [[],[]]}
			FBcontainer.FBbosses.push(newboss);
			ele_radioli.firstElementChild.click();
	}
	/* 添加boss */
	ele_addBoss.addEventListener('click',function(){
		tluserInput("boss名称",'',function(text){
			addboss(text);
		})
	});
	/* 添加副本集 */
	ele_addFBcontainer.addEventListener('click',function(){
		tluserInput("副本名称","请确保修改的数据已经保存",function(fbname){
			tluserInput("boss名称",'',function(bossname){
				try{
					let	_fbid
					;
					sfdata = sfdata || copyObj(timeline.sfdata);
					_fbid = sfdata.data.length;
					timeline.settingFbid = settingFbid = _fbid;
					FBcontainer = {
						FBname:fbname,
						FBbosses:[]
					}
					ele_currentFB.value = fbname;
					ele_jsonwrap.innerHTML = '';
					ele_bossListwarp.innerHTML = '';
					addboss(bossname);
				}
				catch(e){
					console.log(e)
				}
			})
		})
		
	});
	/* 删除当前boss */
	ele_bossDelete.addEventListener('click',function(e){
		if(ele_jsonwrap.children.length<=1) {
			alert("请保留至少一个boss");
			return;
		}
		tlconfirm(DELETEBOSS,function(){
			let ele_li = ele_currentBoss[0].parentElement;
				ele_div = ele_currentBoss[1];
				i = ele_currentBoss[2]
				;
			// delete FBcontainer.FBbosses[i];
			FBcontainer.FBbosses = arrRemove(FBcontainer.FBbosses,i);
			ele_bossListwarp.removeChild(ele_li);
			ele_jsonwrap.removeChild(ele_div);
			// ele_bossListwarp.firstChild.firstChild.click();  //默认执行 无需写代码
			intimelinedata();
		});
	});
	/* 保存 时间轴数据
	*/
	ele_datasave.addEventListener('click',function(e){
		formatData();		
	});
	/* 数据整理 */
	function formatData(filepath,_resolve){
		if(!datavalid) {
			alert('数据格式错误'); return;
		}
		if(ele_currentFB.value.trim() == ''){
			tlconfirm('副本名称为空,则会永久删除当前副本集内的数据,确定这样做吗?',function(){
				setGlobalmsg('block',"保存中...");
				let	_sfdata = sfdata|| copyObj(timeline.sfdata),
					fbid = settingFbid
					;
				tofs_data = _sfdata || {};
				tofs_data.data = arrRemove(tofs_data.data,fbid);
				tofs_data = addExampleData(tofs_data);
				saveDatatofile(true,filepath,_resolve);
			},function(){
				return;
			});
		}else{
			setGlobalmsg('block',"保存中...");
			let _sfdata = sfdata|| copyObj(timeline.sfdata),
				fbid = settingFbid
				;			
			FBcontainer.FBname = ele_currentFB.value || FBcontainer.FBname;
			tofs_data = _sfdata || {};
			tofs_data.data[fbid] = FBcontainer;
			tofs_data = addExampleData(tofs_data);
			saveDatatofile(null,filepath,_resolve);
		}
	}
	function saveDatatofile(isClear,filepath,_resolve){
		new Promise(function(resolve,reject){
			let _filepath = filepath;
			filepath = filepath || timeline.datapath+"\\default.dat";
			try{
				fs = require("fs");
				fs.writeFileSync(filepath, JSON.stringify(tofs_data));
				showGlobalmsginsec('保存完毕',1);						
				timeline.settingFbid = settingFbid = (_filepath != undefined)?settingFbid:isClear?0:settingFbid;
				if(_filepath == undefined){
					timeline.initApp();
					timeline = global.module.exports.timeline;
					try{
						initSetting(timeline);
					}catch(e){
						alert('初始化失败'+'\n错误码: '+e);
						console.log(e)
						
					}
				}
				resolve();
			}
			catch(e){
				showGlobalmsginsec('保存失败',1);
			}
		}).then(function(){_resolve();
		}).catch(function(){});
		
	}
	/* 添加教程数据 */
	function addExampleData(data){
		let fs,tutorial;
		if(!data.data[0] || data.data[0].FBname!="教程实例")
		{
			try{
			fs =require("fs");
			tutorial = JSON.parse(fs.readFileSync(timeline.path+"\\asset\\datafile\\tutorial.dat",'utf-8')).data[0];
			
			}catch(e){
				alert('读取教程文件失败');
				return data;
			}
			data.data.unshift(tutorial);
		}
		else if(!data.data[0] || data.data[0].FBname=="教程实例"){
			try{
			fs =require("fs");
			tutorial = JSON.parse(fs.readFileSync(timeline.path+"\\asset\\datafile\\tutorial.dat",'utf-8')).data[0];
			}catch(e){
				alert('读取教程文件失败');
				return data;
			}
			data.data[0] = tutorial;
		}
			
		return data;
	}
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
	/* 导入 */
	ele_importDat.addEventListener('change',function(e){
		let file = e.target.value,fs =require("fs"),imsfdata;
		try{
		imsfdata = JSON.parse(fs.readFileSync(file,'utf-8'));
		}catch(e){
			alert('导入失败'+'\n错误码: '+e);
			return;
		}
		let newdata = {};
		newdata.sfdata = inportData(imsfdata);
		if(typeof newdata.sfdata == 'object'){	//数据转换成功 newdata
			try{
				timeline.settingFbid = settingFbid = 0;
				initSetting(newdata);
				sfdata = newdata.sfdata;
				showGlobalmsginsec('数据导入成功,请点击保存.',2)
				
			}catch(e){
				alert('导入失败,初始化错误.'+'\n错误码: '+e);
			}
		e.target.value = null;	
		}else{
			tlconfirm('导入数据与当前版本不符,是否转换数据?',function(){
				newdata.sfdata = tocurrentversion(imsfdata);
				if(typeof newdata.sfdata == 'object'){
					try{
						timeline.settingFbid = settingFbid = 0;
						initSetting(newdata);
						sfdata = newdata.sfdata;
						showGlobalmsginsec('数据转换成功,请点击保存.',2);						
					}catch(e){
						alert('导入失败,初始化错误.'+'\n错误码: '+e);
					}
				}else{
					alert(newdata.sfdata);
				}
				e.target.value = null;
			},function(){
				e.target.value = null;
			})
			
		}
	});
	function tocurrentversion(imdata){
		let newdata = {version:"2.1",data:[]};
		switch(imdata.version){
		case undefined:
			try{
				for(let fbid in imdata){
				let FB={};
					// if(parseInt(fbid) == NaN) throw "FBID wrong";
					FB.FBname = imdata[fbid].name; //if(FB.FBname == undefined) throw "FBname wrong";
					FB.FBbosses = [];
					let bosses = imdata[fbid].data;
					for(let fbboss in bosses){
						let boss = {},parts = bosses[fbboss];
						boss.bossName = fbboss;
						boss.bossParts = [];
						parts.forEach(function(part,i){
							let cpart = [];
							if(part == "") part = [];
							part.forEach(function(skill,j){
								let cskill = {};
								cskill.sec = skill.sec;  if(cskill.sec == undefined) throw "skillsec wrong";
								cskill.skillname = skill.name; if(cskill.skillname == undefined) throw "skillname wrong";
							cpart.push(cskill);
							})
						boss.bossParts.push(cpart);
						});
					FB.FBbosses.push(boss);
					}
				newdata.data.push(FB);
				}
			return newdata;
			}catch(e){
				return ('数据转换失败!'+'\n错误码: '+e);
			}
			break;
		case "2.0":
			try{
				imdata.data.forEach(function(FB){
					if(FB.FBname == undefined) throw "FBname null"; 
					FB.FBbosses.forEach(function(boss){
						if(boss.bossName == undefined) throw "bossName null";
						boss.bossParts.forEach(function(part){
							part.forEach(function(skill){
								if(typeof skill.sec != "number") throw "skillsec is not number";
								if(skill.skillname == undefined) throw "skillname undefined";
								if(skill.ttscd!=undefined && typeof skill.ttscd != "number") throw "skillttscd is not number";
								if(typeof skill.ttscd == "number" && skill.ttsstr == undefined) throw "ttsstr undefined";
								if(skill.ttsstr != undefined){
									skill.tts = [{ttscd:skill.ttscd,ttsstr:skill.ttsstr}];
									skill.ttscd = null;
									skill.ttsstr = null;
								}
							});	
						});
					});
				});
			newdata.data = imdata.data;
			return newdata;
			}
			catch(e){
				alert('导入的数据有错误!'+'\n错误码: '+e);
				console.log(e);
				return false;
			}
			break;	
		default:
			return '数据转换失败! 未知版本';
		}
	}
	function inportData(imdata){
		if(imdata.version == "2.1"){
			try{
				imdata.data.forEach(function(FB){
					if(FB.FBname == undefined) throw "FBname null"; 
					FB.FBbosses.forEach(function(boss){
						if(boss.bossName == undefined) throw "bossName null";
						boss.bossParts.forEach(function(part){
							part.forEach(function(skill){
								if(typeof skill.sec != "number") throw "skillsec is not number";
								if(skill.skillname == undefined) throw "skillname undefined";
								if(skill.ttscd!=undefined && typeof skill.ttscd != "number") throw "skillttscd is not number";
								if(typeof skill.ttscd == "number" && skill.ttsstr == undefined) throw "ttsstr undefined";
							});	
						});
					});
				});
			return imdata;
			}
			catch(e){
				alert('导入的数据有错误!'+'\n错误码: '+e);
				console.log(e);
				return false;
			}
		}else{
			return false;
		}
	}
	/* 导出 */
	ele_exportDat.addEventListener('click',function(e){
		 let cdate = new Date(),
		  filename = timeline.exportpath + "\\lntl-"+cdate.getFullYear() + (cdate.getMonth()+1) + cdate.getDate()+"-"+cdate.getHours()+cdate.getMinutes()+cdate.getSeconds()+".dat";
		try{
			formatData(filename,function(){
				try{
				nw.Shell.showItemInFolder(filename);
				}catch(e){
					alert('文件浏览失败,请手动查看"data\export"路径! 或者以管理员身份重新运行本软件'+'\n错误码: '+e);
				}
			});
		}catch(e){
				console.log(e)
			}
	});
}
	