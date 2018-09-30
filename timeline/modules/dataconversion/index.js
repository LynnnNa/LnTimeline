var dataconversion = {
	jsonArrTonputStr : function(arr){
	if (!arr) return '';
		var str='';
		for(i=0 ; i<arr.length; i++)
		{
			str+=arr[i].sec+":"+arr[i].name+",";
		}
		return str;
	},
	inputStrToJsonObj : function(str){
		if(!str.trim()) return false;
		return JSON.parse(dataconversion.tojsonstr(str));
	},
	tojsonstr(str){
		return ('{"sec":'+str.replace(/:/g, ",\"name\":\"") +'"}');
	},
	inputStrToJsonArray : function(str){
		if (!str || str === '') return false;
		var arr = str.split(',');  //["技能1:30", "技能12:60", "技能13:122"]
		var arrC = [];
		for(i = 0; i<arr.length; i++)
		{
			if (arr[i].trim())
			arrC[i]= dataconversion.inputStrToJsonObj(arr[i]);   //"技能1:30"
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
	}
	
};
exports = module.exports = dataconversion;