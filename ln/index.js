/* **
	Copyright (C) 2019 Lynn
	All rights reserved
	http://www.lynnote.site
	
***/
global.module.paths = [process.cwd()+'\\ln\\node_modules'];
var Ln = {
    path: process.cwd() + "\\Ln",
    datapath: process.cwd() + "\\data",
    exportpath: process.cwd() + "\\data\\export"
}
Ln.errormsg = (win,msg) => {
    win.alert(msg);
}
Ln.removeClass = (element,classname) => {
  if (hasClass(element, classname)) {
    var newClass = ' ' + element.className.replace(/[\t\r\n]/g, '') + ' ';
    while (newClass.indexOf(' ' + classname + ' ') >= 0) {
      newClass = newClass.replace(' ' + classname + ' ', ' ');
    }
    element.className = newClass.replace(/^\s+|\s+$/g, '');
  }
}
Ln.addClass = (element,classname) => {
  if (!hasClass(element, classname)) {
    element.className = element.className == '' ? classname : element.className + ' ' + classname;
	}
}
function hasClass(elem, cls) {
  cls = cls || '';
  if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
  return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
}
Ln.initApp = function() {
	var win = nw.Window.get();
	/* win.on('close', function() {
	  this.minimize(); // Pretend to be closed already
	}); */
	setTimeout(function(){win.minimize();},1000);	
    /* 托盘 */
    try {
       if (Ln.tray) {
            Ln.tray.remove();
            Ln.tray = null;
        }
        let tray = Ln.tray = new nw.Tray({
            title: 'Tray',
            icon: './ln/asset/icon/logo-ly.png',
            tooltip: 'Lynn的小软件\n Lynnote.site'
        });
        let traymenu =Ln.traymenu= new nw.Menu();
		traymenu.append(new nw.MenuItem({
            label: '生活技能',
            click: openrecipe
        }));
        traymenu.append(new nw.MenuItem({
            label: '时间轴',
            click: opentimeline
        }));
        traymenu.append(new nw.MenuItem({
            label: '关闭',
            click: function() {
                Ln.tray.remove();
                Ln.tray = null;
                nw.App.closeAllWindows();
            }
        }));
        tray.menu = traymenu;
    } catch(e) {
    }
}
function opentimeline() {
    var options = {
        "id": "timeline",
        "focus": true,
		"frame": false,
		"transparent": true,
		"always_on_top": true,
		"show_in_taskbar":false
    };
    nw.Window.open('/ln/pages/timeline.html', options,
    function(new_win) {
        Ln.win_timeline = new_win;
        new_win.on('closed',
        function() {
            localStorage.setItem('editBossindex', 0);
        })
    });
}
function opensetting() {
    var options = {
        "id": "setting",
        "focus": true
    };
    nw.Window.open('/ln/pages/setting.html', options,
    function(new_win) {
        Ln.win_setting = new_win;
        new_win.on('closed',
        function() {
            localStorage.setItem('editBossindex', 0);
        })
    });
}
function openrecipe() {
    var options = {
        "id": "recipe",
        "focus": true
    };
    nw.Window.open('/ln/pages/jobber.html', options,
		function(new_win) {
			Ln.win_recipe = new_win;
		}
	);
}
Ln.initApp();
global.module.exports.Ln = Ln;