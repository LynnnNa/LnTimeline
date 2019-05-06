const win = nw.Window.get();
// win.showDevTools();
const {spawn} = nw.require('child_process');
const {createHash} = nw.require('crypto');
const {createReadStream, createWriteStream, stat, unlink} = nw.require('fs');
const {dirname, resolve} = nw.require('path');
const {execPath, platform} = process;
const semver = nw.require('semver');
const shell = nw.require('shelljs');
const {appInstDir, bundledUpdaterPath} = resolvePaths(execPath, platform);
const UPDATER_TEMP_DIR = resolve(appInstDir, 'temp');
const UPDATES_DIR = resolve(UPDATER_TEMP_DIR, 'updates');
const UPDATER_BIN = resolve(UPDATER_TEMP_DIR, /^win/.test(platform) ? 'nwjs-autoupdater.exe' : 'nwjs-autoupdater');
shell.mkdir('-p', UPDATES_DIR);
const {manifest: appManifest} = nw.App;
const {manifestUrl: remoteManifestUrl} = appManifest;
fetchManifest(remoteManifestUrl)
  .then(remoteManifest => {
        const {version: currentVersion} = appManifest;
        const {version: latestVersion, [platform]: bundle} = remoteManifest;
		if (semver.gt(latestVersion, currentVersion)) {
          const bundlePath = resolve(UPDATES_DIR, hashString(latestVersion));
          return fetchUpdate(bundle, bundlePath)
            .then(()=> {return notifyUser("发现新版本","点击这里开始更新")})
            .then(result => {
              if (result) {
                return startUpdate(bundlePath)
				.then(()=>{return notifyUser("更新成功","请重新开启软件")})
				.then(result => {nw.App.quit();})
              }else{
				win.close(); 
			  }
            });
        }else{
			notifyUser("已经是最新版本",currentVersion)
			.then(result => {win.close();})
		}
    })
  .catch(err => {
	  notifyUser("检查更新失败",err)
			.then(result => {win.close();})
  });
function resolvePaths (execPath, platform) {
  let appDir;
  let appInstDir;
  let appExec;
  let bundledUpdaterPath;

  if (platform === 'darwin') {
    appDir = resolve(execPath, '../../../../../../../');
    appInstDir = dirname(appDir);
    appExec = appDir;
    bundledUpdaterPath = resolve(appDir, 'Contents', 'Resources', 'nwjs-autoupdater');
  } else if (platform === 'win32') {
    appDir = dirname(execPath);
    appInstDir = appDir;
    appExec = resolve(appDir, 'nw.exe');
    bundledUpdaterPath = resolve(appDir, 'nwjs-autoupdater.exe');
  } else {
    appDir = dirname(execPath);
    appInstDir = appDir;
    appExec = resolve(appDir, 'nw');
    bundledUpdaterPath = resolve(appDir, 'nwjs-autoupdater');
  }

  return {
    appDir,
    appInstDir,
    appExec,
    bundledUpdaterPath,
  };
}
function fetchManifest (url) {
  return new Promise((resolve, reject) => {
    const http = /^https/.test(url) ? nw.require('https') : nw.require('http');
    http.get(url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(res.statusMessage));
      }
      const buffer = [];
      res.on('data', chunk => buffer.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(buffer).toString();
        const manifest = JSON.parse(raw);
        resolve(manifest);
      });
    }).on('error', err => reject(err));
  });
}
function hashString (value, algorithm = 'sha256', inputEncoding = 'latin1', digestEncoding = 'hex') {
  return createHash(algorithm).update(value, inputEncoding).digest(digestEncoding);
}
function fetchUpdate ({url, sha256}, dest) {
  return fileExists(dest)
    .then(exists => {
      if (exists) {
        return checkSHA(dest, sha256)
          .then(() => Promise.resolve(dest))
          .catch(err => {
            if (/^SHA256 mismatch/.test(err.message)) {
              return removeFile(dest)
                .then(() => downloadFile(url, dest, sha256));
            }
            return Promise.reject(err);
          });
      }
      return downloadFile(url, dest, sha256);
    });
}
function checkSHA (filepath, sha256) {
  return new Promise((resolve, reject) => {
    const rs = createReadStream(filepath);
    const hash = createHash('sha256');

    rs.pipe(hash).on('data', digest => {
      const digestHex = digest.toString('hex');

      if (digestHex !== sha256) {
        return reject(new Error(`SHA256 mismatch: ${sha256} !== ${digestHex}`));
      }

      resolve();
    });
  });
}
function notifyUser (title,body) {
  return new Promise((resolve, reject) => {
    const options = {
      icon: '/ln/asset/icon/logo-ly.png',
      body: body,
    };
    const notification = new Notification(title, options);
    notification.onclick = () => {
      notification.close();
      resolve(true);
    };
    notification.onclose = () => {resolve(false)};
  });
}
function alertnotifyUser (title,body) {
    const options = {
      icon: '/ln/asset/icon/logo-ly.png',
      body: body,
    };
    const notification = new Notification(title, options);
}
function fileExists (bundledUpdaterPath) { 
  return new Promise(resolve => {
    stat(bundledUpdaterPath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(false);
        }
        throw err;
      }
      if (stats.isFile()) {
        return resolve(true);
      }
      resolve(false);
    });
  });
}
function removeFile (filepath) {
  return new Promise((resolve, reject) => {
    unlink(filepath, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
function downloadFile (source, dest, sha256 = false) {
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(dest);
    const http = /^https/.test(source) ? nw.require('https') : nw.require('http');

    http.get(source, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(res.statusMessage));
      }

      res.pipe(ws).on('finish', () => {
        if (!sha256) {
          return resolve(dest);
        }

        checkSHA(dest, sha256)
          .then(() => resolve(dest))
          .catch(err => reject(err));
      });
    }).on('error', err => reject(err));
  });
}
function startUpdate (bundlePath) {
	return new Promise(resolve=>{
		 shell.cp(bundledUpdaterPath, UPDATER_BIN);
		  shell.chmod(755 & ~process.umask(), UPDATER_BIN);
		  spawn(UPDATER_BIN, [
			'--bundle', bundlePath,
			'--inst-dir', appInstDir,
		  ], {
			cwd: dirname(UPDATER_BIN),
			detached: true,
			stdio: 'ignore',
		  }).unref();
		  resolve();
	});
  //nw.App.quit();
}