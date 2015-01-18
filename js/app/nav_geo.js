//Геопозиционирование
	Geo = new Object({ //инициализируем из двух мест, либо из app когда устройство готово, либо отсюда
		is_supported : false,
		pos : {x :-1, y: -1, time: getUnixTime()},
		init : function(){
			//проверка поддержки geo

			if(window.navigator.geolocation) {
				Geo.is_supported = true;
			} else {
				Geo.is_supported = false;
			}
			
			
			if(Geo.is_supported){
				var pos_str;
				var pos_obj;
				if(GLOBAL_APP_VERS.type == "web_mobile"){
					pos_str = getCookie("m_geo");
				}
				else
				if(GLOBAL_APP_VERS.type == "app_mobile"){					
					pos_str = window.localStorage.getItem("geo");
				}
				if(pos_str!=null){
					pos_obj = JSON.parse(pos_str);
					//если последнее обновление было более 10 мин назад то запрашиваем координаты. Или координаты другого юзера
					if((parseInt(pos_obj.time)+600 < getUnixTime()) || (pos_obj.id!=User.I.id)){
						Geo.Get();
					}
				
				}
				//если в хранилище нет данных то запрашиваем с сервера
				else{
					Geo.Get();
				}
				
			}
			
		},
		ProcessGetPosition : function(position){
			var latitude = position.coords.latitude;
			var longitude = position.coords.longitude;
			var local_info = {x: String(latitude), y: String(longitude), time: String(getUnixTime()), id: User.I.id};
			
			Geo.pos = {x: latitude, y: longitude, time: getUnixTime()};
			Geo.Send(Geo.pos);
			if(GLOBAL_APP_VERS.type == "web_mobile"){
				setCookie("m_geo", JSON.stringify(local_info));
			}
			else
			if(GLOBAL_APP_VERS.type == "app_mobile"){					
				window.localStorage.removeItem("geo");
				window.localStorage.setItem("geo", JSON.stringify(local_info));
			}
		},
		Get : function(){

			navigator.geolocation.getCurrentPosition(function(position) {
				Geo.ProcessGetPosition(position);
				
			},function(){ //on error
				show_popup("fast_ntfy", "Не удалось определить местоположение");
			}
			);	
			
		},
		Send : function(pos){
			var params = pos;
			params.method = "setLocation";
			params.silent_mode = "true";
			$.get( LS("server/proc_geo.php"), params, 
				function( data ) {
					$("#page_usersearch .btn-in-radius").removeClass("blink");
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							
						}
						else{
							if(GLOBAL_APP_VERS.type == "web_mobile"){
								setCookie("m_geo", null);
							}
							else
							if(GLOBAL_APP_VERS.type == "app_mobile"){	
								window.localStorage.removeItem("geo");
							}
							show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
						}
						
					}
				},
				"json"
			).fail(function(){
					$("#page_usersearch .btn-in-radius").removeClass("blink");
				});;
		},
		Map : {
			obj : Object(),
			canvas_id: "map_canvas",
			initialize : function(){
				var map_options = {
					zoom: 9,
					center: new google.maps.LatLng(55.752198, 37.619044)
				};
				Geo.Map.obj = new google.maps.Map(document.getElementById(Geo.Map.canvas_id), map_options);
				Geo.Map.Show();
			},
			init : function() {
			  var script = document.createElement('script');
			  script.type = 'text/javascript';
			  script.src = 'http://maps.google.com/maps/api/js?sensor=false&' + 'callback=Geo.Map.initialize';
			  document.body.appendChild(script);
			},
			DisplayUsers : function(geo_user_arr){
				var markerImg = new Object();
				var pos = new Object();
				var infowindow = new Object();
				var marker = new Object();
				$.each(geo_user_arr, function(key, geo_user){
					//определяем формат маркера
					markerImg = new google.maps.MarkerImage(
						User.html.avatar_url(geo_user.user.foto,40),
						new google.maps.Size(50,50),
						new google.maps.Point(0,0),
						new google.maps.Point(0,50)
					);
					//местоположение
					pos = new google.maps.LatLng(geo_user.pos[0], geo_user.pos[1]);
					//тултип
					infowindow[key] = new google.maps.InfoWindow({
					 content: geo_user.user.name
					});
					
					//ставим маркер
					marker[key] = new google.maps.Marker({
					  icon: markerImg,
					  position: pos, 
					  map: Geo.Map.obj,
					  title: geo_user.user.name
					});
					google.maps.event.addListener(marker[key], 'click', function() {
					  infowindow[key].open(Geo.Map.obj, marker[key]);
					});
				});
			},
			Show : function(type){
				var params = {method: "getUsersLocation"}
				$.get( LS("server/proc_geo.php"), params, 
					function( data ) {
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								console.log(data);
								Geo.Map.DisplayUsers(data.geo_users);
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}
							
						}
					},
					"json"
				);
			}
			
			
		},
		Page : {
			Go : function(){
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_map"), { transition: "none"} );
				Geo.Map.init();
			}
		},
		Utils : {
			getCachedObj : function(){
				if(GLOBAL_APP_VERS.type == "web_mobile"){
					var pos_str = getCookie("m_geo");
				}
				else
				if(GLOBAL_APP_VERS.type == "app_mobile"){					
					var pos_str = window.localStorage.getItem("geo");
				}
				if(pos_str!=null){
					return JSON.parse(pos_str);									
				}
				else
					return null;
			},
			isTimedOut : function (cached_obj){
				if((parseInt(cached_obj.time)+600 < getUnixTime()) || (cached_obj.id!=User.I.id)){
						return true;
				}
				else{
					return false;
				}
			},
			distance_text: function(distance){
				var text;
				if(parseInt(distance)<1){
					text = "Менее 1 км от Вас"
				}
				else
				{
					text = "В "+Math.round(parseInt(distance))+" км от Вас"
				}
				return text;
			}
		}
	});
