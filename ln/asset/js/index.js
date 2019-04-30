/* **
	Copyright (C) 2019 Lynn
	All rights reserved
	http://www.lynnote.site
	
***/
var path = require("path");
var execPath = path.dirname(process.execPath);
var Ln = {
    path: process.cwd() + "\\Ln",
    datapath: execPath + "\\data",
    exportpath: execPath + "\\data\\export"
}
Ln.errormsg = (win,msg) => {
    win.alert(msg);
}
Ln.initApp = function() {
    /* 托盘 */
    try {
        if (Ln.tray) {
            Ln.tray.remove();
            Ln.tray = null;
        }
        let tray = Ln.tray = new nw.Tray({
            title: 'Tray',
            icon: './ln/asset/icon/logo-ly.png',
            tooltip: '早恋君的小软件\n Lynnote.site'
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