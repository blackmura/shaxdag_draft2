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
		this.is_ready = 1;
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
					app.PN.Instance.register(tokenHandler, app.PN.errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"app.PN.onNotificationAPN"});	// required!
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
				}
			}
				
			console.log('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
			console.log('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
		}
	},
	getPhoneGapPath: function()  {

		var path = window.location.pathname;
		path = path.substr( path, path.length - 10 );
		return 'file://' + path;

	},
	CameraTrans : {
		type: 0,
		onBtnExplore : function(ev){
			console.log("btn clicked");
			ev.preventDeafult();
			var upload_type = $(this).attr("upload_type");
			app.CameraTrans.type == upload_type; //1- загрузка preview fotos, 2 -загрузка preview users_fotos 
			//detect image format
			var Camoptions = {
			  destinationType : Camera.DestinationType.FILE_URI,
			  sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
			  mediaType: Camera.MediaType.PICTURE,
			  encodingType: Camera.EncodingType.JPEG,
			};
			
			navigator.camera.getPicture( app.CameraTrans.onImageChoose, app.CameraTrans.cameraError, Camoptions);
		},
		onImageChoose : function(uri){
			var options = {};
			var server; 
			//получен путь к файлу
			console.log(uri);
			if (app.CameraTrans.type == 1 || app.CameraTrans.type == 2){
				options.fileKey = "userfile";
				options.params = {method: "savePicture", upload_type: app.CameraTrans.type};
				server = LS("server/proc_preview.php");
				
				var ft = new FileTransfer();
				ft.upload(uri, encodeURI(server), app.CameraTrans.onUpload,  app.CameraTrans.fail, options);
				
				
				
			}
		},
		onImageError : function(msg){
			console.log(msg);
		},
		onUpload : function(r){
			var data = JSON.parse(r.response);
			console.log("upload success" + r);
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
		},
		fail : function(error){
			console.log("upload error source " + error.source);
			console.log("upload error target " + error.target);
		}
		
	}
};