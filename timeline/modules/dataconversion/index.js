var dataconversion = {
	jsonArrTonputStr : function(arr){
	if (!arr) return '';
		var str='';
		for(let i=0; i<arr.length; i++)
		{
			let tts;
			if(arr[i].tts!=undefined){
				tts = "";
				arr[i].tts.forEach(function(ctts,i){
					tts +='['+(parseInt(ctts.ttscd)>=0?ctts.ttscd:"")
						+(ctts.ttsstr?","+ctts.ttsstr:"")+']';
				}) 
			}
			str+=(i>0?"<br />":"")
				+arr[i].sec+":"+arr[i].skillname
				+(tts?tts:"")
				+";";
		}
		return str;
	},
	inputStrToJsonObj : function(str){
		if(!str.trim()) return false;
		return JSON.parse(dataconversion.tojsonstr(str));
	},
	tojsonstr(str){
		let 
			a = str.split(':'),
			b = a[1].replace(/]\[|\[|];|]/g,",").split(','),
			jsonobj = {
				sec:parseInt(a[0]),
				skillname:b[0],
				// ttscd:(parseInt(b[1])>=0?parseInt(b[1]):undefined),
				// ttsstr:b[2]
			},
			tts = [];
			b.forEach(function(str,i,_b){
				if(i>0&&str!=""&&i%2 == 1){
						let obj={};
						obj.ttscd = parseInt(str);
						obj.ttsstr = _b[i+1];
						tts.push(obj);
				}
			});
			jsonobj.tts = tts.length>0?tts:undefined;
			
		return JSON.stringify(jsonobj); 
		//return ('{"sec":'+str.replace(/:/g, ",\"skillname\":\"") +'"}');
	},
	inputStrToJsonArray : function(str){
		if (!str || str === '') return false;
		var arr = str.split(';');  //180:月影,3,驱散准备;
		var arrC = [];
		for(let i = 0; i<arr.length; i++)
		{
			if (arr[i].trim())
			arrC[i]= dataconversion.inputStrToJsonObj(arr[i]); 
		}
		return arrC;
	},
	copyObj : function(obj){
		if(typeof obj != 'object')  return obj;
		if(Object.prototype.toString.call(obj) == "[object Array]"){
			var newobj = []; let i=0;
			for ( item of obj) {
				newobj[i] = dataconversion.copyObj(item);
				i++;
			}
			return newobj;
		}
		var newobj = {};
		for ( var attr in obj) {
			newobj[attr] = dataconversion.copyObj(obj[attr]);
		}
		return newobj;
	},
	arrRemove : function(arr,index){
		let temArray=[];
		arr.forEach(function(item,i,array){
			if(i!=index){
			temArray.push(array[i]);
			}
		});
		return temArray;
	},
	quickSortskill: function(array, left, right) {
		if (left < right) {
			let x = array[right].ttscd||array[right].sec, i = left - 1, temp;
			for (let j = left; j <= right; j++) {
				let y = array[j].ttscd || array[j].sec;
				if (y <= x) {
					i++;
					temp = array[i];
					array[i] = array[j];
					array[j] = temp;
				}
			}
			dataconversion.quickSortskill(array, left, i - 1);
			dataconversion.quickSortskill(array, i + 1, right);
		}
	　　return array;
	},
	sortrduplication:function(array){
		let newArray = [],item,temp,flag;
		for(let i = 0; i < array.length; i++) {
			flag = 0;
			item = array[i];
			if( item == undefined) {continue;}
			let isec = item.ttscd||item.sec;
			flag = 1;
			for(let j = i+1; j < array.length; j++) {
				if( array[j] == undefined) {continue;}
				isec = item.ttscd||item.sec;
				let jsec = array[j].ttscd||array[j].sec;
				if(jsec<isec){
					temp = item;
					item = array[j];
					array[j] = temp;
					flag = 2;
				}
				if(jsec==isec){
					item = array[j];
					array[j] = null;
					flag = 2;
				}
			}
			if(flag)  newArray.push(item);
		}
	return newArray;
	}
	
};
exports = module.exports = dataconversion;