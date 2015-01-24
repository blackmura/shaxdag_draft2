var GLOBAL_GOOGLE_PID = "979380629492";
var app = {
    // Application Constructor
    is_ready: 0,
	initialize: function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	onDeviceReady: function(){
		app.is_ready = 1;
		app.Device.appendListeners();
		//включаем push
		app.PN.onDeviceReady();
		//включаем геолокацию
		Geo.init();
	},
	PN : {
		Instance : Object(),
		RegId : 0,
		onDeviceReady :function () {
			//console.log('<li>deviceready event received</li>');
			try 
			{ 
				app.PN.Instance = window.plugins.pushNotification;
				if (device.platform == 'android' || device.platform == 'Android') {
					//console.log('<li>registering android</li>');
					app.PN.Instance.register(app.PN.successHandler, app.PN.errorHandler, {"senderID":GLOBAL_GOOGLE_PID,"ecb":"app.PN.onNotificationGCM"});		// required!
				} else {
					//console.log('<li>registering iOS</li>');
					//app.PN.Instance.register(tokenHandler, app.PN.errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"app.PN.onNotificationAPN"});	// required!
				}
			}
			catch(err) 
			{ 
				txt="There was an error on this page.\n\n"; 
				txt+="Error description: " + err.message + "\n\n"; 
				alert(txt); 
			} 
		},

		// handle APNS notifications for iOS
		onNotificationAPN: function (e) {
			if (e.alert) {
				 $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
				 navigator.notification.alert(e.alert);
			}
				
			if (e.sound) {
				var snd = new Media(e.sound);
				snd.play();
			}
			
			if (e.badge) {
				app.PN.Instance.setApplicationIconBadgeNumber(app.PN.successHandler, e.badge);
			}
		},

		// handle GCM notifications for Android
		onNotificationGCM : function (e) {
			//console.log('<li>EVENT -> RECEIVED:' + e.event + '</li>');
			
			switch( e.event )
			{
				case 'registered':
				if ( e.regid.length > 0 )
				{
					// Your GCM push server needs to know the regID before it can push to this device
					// here is where you might want to send it the regID for later use.
					console.log("regID = " + e.regid);
					app.PN.saveDeviceId(e.regid,1);
				}
				break;
				
				case 'message':
					// if this flag is set, this notification happened while we were in the foreground.
					// you might want to play a sound to get the user's attention, throw up a dialog, etc.
					app.PN.HandlePush(e);
				break;
				
				case 'error':
					console.log('<li>ERROR -> MSG:' + e.msg + '</li>');
				break;
				
				default:
					console.log('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
				break;
			}
		},

		tokenHandler: function  (result) {
			console.log('Token handler: token: '+ result +'</li>');
			app.PN.saveDeviceId(result,2);
			// Your iOS push server needs to know the token before it can push to this device
			// here is where you might want to send it the token for later use.
		},

		successHandler : function  (result) {
			console.log('Success Handler: success:'+ result +'</li>');	
		},

		errorHandler: function  (error) {
			console.log('Error Handler: error:'+ error +'</li>');
		},
		saveDeviceId : function(regid, push_type){
			params = {method: "setRegID", regid : regid, push_type: push_type, silent_mode: "true"};
			$.get( LS("refresh_ui.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							app.PN.RegId = params.regid;
						}
						else{
							
							show_popup("message_not_sent", data.error_text);
						}
						
					}
					else{
						Environment.Utils.handle_auth_error();
					}
				},
				"json"
			);
		},
		HandlePush : function(e){
			if (e.foreground){
				console.log('<li>--INLINE NOTIFICATION--' + '</li>');
				// if the notification contains a soundname, play it.
				//var my_media = new Media("/android_asset/www/"+e.soundname);
				//my_media.play();
			}
			else{	// otherwise we were launched because the user touched a notification in the notification tray.
				if (e.coldstart){
					console.log('<li>--COLDSTART NOTIFICATION--' + '</li>');
				}
				else{
					console.log('<li>--BACKGROUND NOTIFICATION--' + '</li>');
					//если пришло сообщение
					if(e.payload.type == "msg")
						NavMsg.OpenDialog(e.payload.user_id);
					else
					if(e.payload.type == "fotos" || e.payload.type == "users_fotos" || e.payload.type == "fotos_reply" || e.payload.type == "users_fotos_reply" || e.payload.type == "clips_reply" || e.payload.type == "music_reply")
						Comments.GoParams(e.payload.t_key, e.payload.base);
				}
			}
				
			console.log('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
			console.log('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
		}
	},
	getPhoneGapPath: function()  {
		if(device.platform == "iOS")
			return "";
		else{
			var path = window.location.pathname;
			path = path.substr( path, path.length - 10 );
			return 'file://' + path;
		}

	},
	CameraTrans : {
		type: 0,
		
		onBtnExplore : function(ev){
			ev.preventDefault()	
			var upload_type = $(this).attr("upload_type");
			app.CameraTrans.type = upload_type; //1- загрузка preview fotos, 2 -загрузка preview users_fotos  - avatar
			if(app.CameraTrans.type == 1 || app.CameraTrans.type== 2 || app.CameraTrans.type == 3){
				var Camoptions = {
				  destinationType : Camera.DestinationType.FILE_URI,
				  sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
				  mediaType: Camera.MediaType.PICTURE,
				  encodingType: Camera.EncodingType.JPEG
				};
			}
			else{
				var Camoptions = {
				  destinationType : Camera.DestinationType.FILE_URI,
				  sourceType : Camera.PictureSourceType.CAMERA,
				  mediaType: Camera.MediaType.PICTURE,
				  encodingType: Camera.EncodingType.JPEG
				};
			}
			
			//detect image format
			navigator.camera.getPicture( app.CameraTrans.onImageChoose, app.CameraTrans.onImageError, Camoptions);
		},
		onImageChoose : function(uri){
			var options = {};
			var server; 
			//получен путь к файлу
			console.log(uri);
			//если загружаем превью 
			if (app.CameraTrans.type == 1 || app.CameraTrans.type == 2){
				options.fileKey = "userfile";
				options.params = {method: "savePicture", upload_type: app.CameraTrans.type};
				server = LS("server/proc_preview.php");
				
				var ft = new FileTransfer();
				$(".ajax-loader-center").show();
				ft.upload(uri, encodeURI(server), app.CameraTrans.onUpload,  app.CameraTrans.fail, options);
			}
			else
			//если загружаем аватар
			if (app.CameraTrans.type == 3){
				options.fileKey = "userfile";
				options.params = {method: "setAvatar", upload_type: app.CameraTrans.type};
				server = LS("server/proc_settings.php");
				
				var ft = new FileTransfer();
				$(".ajax-loader-center").show();
				ft.upload(uri, encodeURI(server), app.CameraTrans.onUpload,  app.CameraTrans.fail, options);
			}
		},
		onImageError : function(msg){
			console.log(msg);
		},
		onUpload : function(r){
			$(".ajax-loader-center").hide();
			console.log(r);
			var data = JSON.parse(r.response);

			if(data.upload_type == 1 || data.upload_type == 2){ //обработчик загрузки превью фоток
				if(data.upload_type == 1)
					base="fotos";
				else
					base="users_fotos";
				if(data.auth_status == "success"){	
					if(data.method_status == "success"){
						//сохраняем id текущей фотографии и отоображаем превью
						Uploader.current ={id : data.num, src : data.src};
						$("#page_upload .uploader .preview i").css({display: "none"}); 
						$("#page_upload .uploader .preview .preview-src img").attr("src", User.html.preview_url("large_800/"+data.src, base));
						$("#page_upload .uploader .preview .preview-src").css({display: "block"});
						//отображаем кнопку снова
						$("#page_upload .uploader .btn-save").css({display: "block"}); 
					
					}
					else
						show_popup("message_not_sent", data.error_text);
				} 
				else{
					console.log(data);	
				}
				console.log(data);
			} 
			else
			if(data.upload_type == 3 ){ //обработчик загрузки avatar
				if(data.auth_status == "success"){	
					if(data.method_status == "success"){
						User.I.foto = data.src;
						$("#left_panel .user-avatar-circle").attr("src", User.html.avatar_url(data.src, 60)); 
						$("#page_user_avatar img").attr("src", Environment.Utils.google_resize(User.html.avatar_url(data.src, 800),480)); 
						$("#page_user_avatar .like-avatar").remove();
					
					}
					else
						show_popup("message_not_sent", data.error_text);
				} 
				else{
					console.log(data);	
				}
				console.log(data);
			} 
		},
		fail : function(error){
			$(".ajax-loader-center").hide();
			console.log("upload error source " + error.source);
			console.log("upload error target " + error.target);
		}
		
	},
	Device : {
		status:0,
		appendListeners : function(){
			document.addEventListener("pause", app.Device.onPause, false);
			document.addEventListener("resume", app.Device.onResume, false);
		},
		onPause : function(){
			app.Device.status == "online";
		},
		onResume : function(){
			app.Device.status == "offline";
		}
		
	},
	Download: {
		music : function(url, filename){
			
			var  fileTransfer= new FileTransfer();
			var fileName = getUnixTime()+".mp3";
			var store = cordova.file.cacheDirectory;
			console.log("About to start transfer");
			
			fileTransfer.download(url, store + fileName, 
				function(entry) { // если есть кеш
					console.log("Success!"+store + fileName);
					
				}, 
				function(err) {
					console.log("Error");
					console.dir(err);
				});
				
			
		}
	},
	Cache : {
		Music : {
			onPlay : function(c_url){
				if (app.is_ready == 1 && !c_url.indexOf("http://")>0){
					
					console.log("Going to cache "+c_url);
					var dom = $(".sm2_link[href='"+c_url+"']");
					var cache_path = cordova.file.cacheDirectory+c_url.substring(c_url.lastIndexOf('/')+1);
					window.resolveLocalFileSystemURL(cache_path, 
						function(fileSystem) { // если есть кеш
							console.log("cache already exist, replacing...");
							app.Cache.Music.replace_url(dom, cache_path);
						}, 
						function(){ // если кеша нет
							var  fileTransfer= new FileTransfer();
							console.log("cache not exist. Downloading data...");
							fileTransfer.download(c_url, cache_path, 
								function(entry) { // если есть кеш
									console.log(cache_path+" Successfully cached");
									app.Cache.Music.replace_url(dom, cache_path);
									
								}, 
								function(err) {
									console.log("Error while trying to download the cache");
								}
							);
						}
					);
				}
				else
					return false;
			},
			replace_url : function(dom, cache_path){
				dom.attr("href", cache_path);
				dom.parents(".song-item").children(".btn-add").append("<div class='cache-flag'><i class='fa fa-check'></i>кэш</div>");
				console.log("music cached");
			},
			apply_cache : function (musics){
				console.log("getting info about cached music");
				if(musics.length){
					$.each(musics, function(key,obj){ 
						app.Cache.Music.apply_single_cache(obj);
					});
				}
				else{
					app.Cache.Music.apply_single_cache(musics);
				}				
			},
			apply_single_cache : function(obj){
				var c_url = Music.Utils.full_url(obj.path);
				var dom = $("#"+getCurrentPage()+" .mus_"+ obj.num+" .sm2_link");
				var cache_path = cordova.file.cacheDirectory+c_url.substring(c_url.lastIndexOf('/')+1);
				window.resolveLocalFileSystemURL(cache_path, 
						function(fileSystem) { // если есть кеш
							app.Cache.Music.replace_url(dom, cache_path);
						}, 
						function(){ // если кеша нет
						
						}
				);
				
			}
		}
	}
};