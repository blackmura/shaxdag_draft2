Rpl =new Object({
		watch_online : function(data){
			var page_id = getCurrentPage();
			var found_i=-1;
			Environment.Friends.online.total=0;
			Environment.Friends.online.list = new Array();
			$.each(data, function(i, obj){
				//если активна страница переписки то обновляем статус пользователя
				if(page_id == "page_msg2"){	
					if(obj.id == NavMsg.ActiveUser.id){
						NavMsg.ActiveUser.online_status.code=obj.status;
						//меняем заголовок страницы
						$("#page_msg2 .topheader h1").html(User.html.online_status(NavMsg.ActiveUser,"tiny")+ " "+NavMsg.ActiveUser.name);
						User.html.online_status(NavMsg.ActiveUser, "tiny");
						
					}
				}
				//обновляем статусы друзей
				found_i=Environment.Utils.get_friend_index(Environment.Friends.list, obj.id);
				if(found_i>=0){
					Environment.Friends.list[found_i].online_status.code=obj.status;					
				}
				
				
			});
			//обновляем боковую панель с друзьями онлайн, если она открыта
			$.each(Environment.Friends.list, function(i, obj){ //заполяем по новой объект онлайн
				if(obj.online_status.code==1){
					Environment.Friends.online.list.push(obj);
					Environment.Friends.online.total++;
				}
			});
			if($("#left_panel").hasClass("ui-panel-open")){
				NavLefPanel.Users.display(Environment.Friends.online, "friends_online");
			}
			
		}
	});
	Debug = new Object({
		show : function(){
			var html=get_session()+"<br>";
			html+=User.I.name+"<br>";
			html+=Debug.getCookie("PHPSESSID")+"<br>";
			html+=JSON.stringify(Geo.pos)+"<br>";
			$("#debug_a").html(html);
		},
		getCookie : function(name) {
			var cookie = " " + document.cookie;
			var search = " " + name + "=";
			var setStr = null;
			var offset = 0;
			var end = 0;
			if (cookie.length > 0) {
				offset = cookie.indexOf(search);
				if (offset != -1) {
					offset += search.length;
					end = cookie.indexOf(";", offset)
					if (end == -1) {
						end = cookie.length;
					}
					setStr = unescape(cookie.substring(offset, end));
				}
			}
			return(setStr);
		}
	});
	Environment = new Object({
		Dics : Object(),
		Friends : Object(),
		OnlineUsers : Object(),
		System : { LastUnsuccessAjaxCall: Object(), LastAjaxCall : Object(), popupclose_timeout_id: -1, UnAuthAjaxCall: Object(), last_hard_refresh: 0},
		init : function (data){			
			Environment.Dics = data.dics;
			Help.popups = data.popups;
			Environment.Friends = data.friends;
			Environment.OnlineUsers = data.online_users;
			//здесь будет обновление всего UI клиента
			//обновление боковой панели
			User.I = data.myInfo;
			NavLefPanel.turnOn(data);
			NavMsg.LoadMsgList(data.msg_list);
			
			//Устанавливаем  обработчики RealPlexor (вынести в функцию или объект)
			//Подключаем RealPlexor
			
			realplexor.subscribe("u"+data.myInfo.id, function(data, id) {
				if(data.type=="msg" || data.type==null){
					//console.log(data);
					NavMsg.RplIncome(data);//обработчик входящих сообщений
				}
				else
				if(data.type=="typing" ){
					//console.log(data);
					NavMsg.Utils.keyPress.rec_handler(data);//обработчик входящих сообщений
				}
				else
				if(data.type=="mark" || data.type=="fotos"  || data.type=="users_fotos" || data.type=="friend_req"){ //обработчик новых комментариев и сообщений
					if(data.type=="mark"){
						if(data.base=="fotos" || data.base=="users_fotos")
							Evants.Utils.increase_ntfy_obj("fotos",1);
						else
							Evants.Utils.increase_ntfy_obj(data.base,1); //муз и видео
					}
					else
					if(data.type=="fotos"  || data.type=="users_fotos"){
						Evants.Utils.increase_ntfy_obj("fotos",1);
					}
					else
					if(data.type=="friend_req"){
						Environment.Friends.income_users.total_all++;
					}
					NavLefPanel.Ntfy.refresh();
					Audio_.income_msg.play();
				}
			});
			//подписываемся на общий канал оповещений
			
			realplexor.subscribe("general_evants", function(data, id) {
				if(data.type=="watch_online"){
					Rpl.watch_online(data.stat_array);
					//console.log(data.stat_array); 
				}				
			});
			
			realplexor.execute();
			//Инициализируем геопозиционирование
			
			//Загружаем обновления
			Evants.init();
			Evants.total_all=data.evants.total_all;
			Evants.list=data.evants.evants;
			Evants.Display(data.evants, Evants.url_params);
			//считываем с объектов оповещения и отображаем баджеры на боковой панели
			NavLefPanel.Ntfy.refresh();
			
			//инициализация мобильного приложения
			if(GLOBAL_APP_VERS.type == "app_mobile"){
				app.initialize();
			}
			if(GLOBAL_APP_VERS.type == "web_mobile"){
	
				Geo.init();
			}
			
			if(GLOBAL_APP_VERS.type == "web_mobile" && /Android/i.test(navigator.userAgent)){
				show_popup("important_ntfy", "Мобильное приложение Шах-Даг теперь доступно и на платформе Андроид. Поторопитесь скачать его на Google Play! <a href='https://play.google.com/store/apps/details?id=com.shaxdag.app' rel='external' class='ui-btn ui-corner-all ui-shadow ui-btn-b'><i class='fa fa-android'></i> Установить!</a>");
				Geo.init();
			}
			
		},
		Nations : {
			nations_selectmenu : function(selected_id){
				var html="";
				var html_selected="";
				$.each(Environment.Dics.nations, function(key,obj){
					if(obj.id == selected_id)
						html_selected="selected";
					else
						html_selected="";
					html+="<option value='"+obj.id+"' "+html_selected+">"+Environment.Nations.modify(obj.title, "ая")+"</option>";
				});
				return html;
			},
			nations_selectmenu_var : function(selected_id, variant){  //variant == "nation" || "ая"
				var html="";
				var html_selected="";
				var title = "";
				
				$.each(Environment.Dics.nations, function(key,obj){
					if(obj.id == selected_id)
						html_selected="selected";
					else
						html_selected="";
					if(variant == "nation")
						title = obj.nationality;
					else
						title = Environment.Nations.modify(obj.title, variant);
						
					html+="<option value='"+obj.id+"' "+html_selected+">"+title+"</option>";
				});
				return html;
			},
			nations_listview : function(selected_id){
				var html="";
				var html_selected="";
				$.each(Environment.Dics.nations, function(key,obj){
					if(obj.id == selected_id)
						html_selected="selected";
					else
						html_selected="";
					html+="<li><a href='' nation_id='"+obj.id+"'>"+Environment.Nations.modify(obj.title, "ая")+"</a></li>";
				});
				return html;
			},
			modify : function(nation_str, postfix){
				if(!nation_str)
					return null;
				else
					return nation_str.substr(0,nation_str.length-2)+postfix;
			},
			nation_by_id : function(id){ //type=title, nationality
				var found_i=-1;
				$.each(Environment.Dics.nations, function(key,obj){
					if(obj.id == id){
						found_i = key;
					}
				});
				if(found_i>=0)
					return Environment.Dics.nations[found_i];
				else
				if(id==100)
					return {title: "Не тематический", nationality: ""};
				else
					return {title: "", nationality: ""};
			}
		},
		Utils : {
			is_friend : function(user_id){
				var found_i=-1;
				$.each(Environment.Friends.list, function(key,obj){
					if(obj.id == user_id){
						found_i = key;
					}
				});
				if(found_i>=0)
					return true
				else
					return false;
			},
			get_friend_index : function(listObj, user_id){
				var found_i=-1;
				$.each(listObj, function(key,obj){
					if(obj.id == user_id){
						found_i = key;
					}
				});
				return found_i;
			},
			push_friend : function(user){
				var found_i=-1;
				if(Environment.Utils.is_friend(user.id)){
					Environment.Friends.list.push(user);
					Environment.Friends.total++;
				}
			},
			pop_friend : function(user_id){
				var found_i=-1;
				found_i = Environment.Utils.get_friend_index(Environment.Friends.list,user_id);
				if(found_i>=0){
					Environment.Friends.list.splice(found_i,1);
					Environment.Friends.total--;
				}
			},
			retryAjax : function(ev){//выполняется при клике на кнопку Повторить запрос
				clearTimeout(Environment.System.popupclose_timeout_id);
				$( "#popup_window" ).popup( "close");
				$.ajax(Environment.System.LastUnsuccessAjaxCall);
			},
			handle_auth_error : function(){ //выполняется при не авторизованном запросе ajax
				Environment.System.UnAuthAjaxCall = Environment.System.LastAjaxCall;
				gl_reconnect();
			},
			refresh_public_navbar : function (navbar_id, active_class){
				$(navbar_id+" .btn-evants").removeClass("ui-btn-active");
				$(navbar_id+" .btn-fotos").removeClass("ui-btn-active");
				$(navbar_id+" .btn-music").removeClass("ui-btn-active");
				$(navbar_id+" .btn-users").removeClass("ui-btn-active");
				$(navbar_id+" ."+active_class).addClass("ui-btn-active")
			},
			set_header : function(val, page_id, type){
				if(type=="user"){
					var user=val;
					if(user!=null){
						//меняем заголовок страницы
						var html = /*'<img src="'+User.html.avatar_url(user.foto,40)+'"  class="user-avatar-rounded"> '+*/
									User.html.online_status(user,"tiny")+ " "+user.name;
						$("#"+page_id+" .topheader h1").html(html);
						$("#"+page_id+" .topheader h1").attr("user_id", user.id);
						//click event
						$("#"+page_id+" .topheader h1").off("vclick");
						$("#"+page_id+" .topheader h1").on("vclick", UserPage.Go);
					}
				}
				else
				if(type=="title"){
					//меняем заголовок страницы
					$("#"+page_id+" .topheader h1").html(val);
					
				}
			},
			google_resize : function(url, w){
				return "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?url="+url+"&container=focus&resize_w="+w+"&refresh=31536000";
			},
			processHash : function( url ) {
			    var parsed = $.mobile.path.parseUrl( url ),
			        queryParameters = {},
			        hashQuery = parsed.hash.split( "?" );
			    // Create name: value pairs from the query parameters
			    $.each( ( hashQuery.length > 1 ? hashQuery[ 1 ] : "" ).split( "&" ), function() {
			        var pair = this.split( "=" );
			        if ( pair.length > 0 && pair[ 0 ] ) {
			            queryParameters[ pair[ 0 ] ] =
			                ( pair.length > 1 ? pair[ 1 ] : true );
			        }
			    });
			    return {
			        parsed: parsed,
			        cleanHash: ( hashQuery.length > 0 ? hashQuery[ 0 ] : "" ),
			        queryParameters: queryParameters
			    };
			},
			on_check_keyup : function(){
				var elem = $(this).attr("check_elem"); //куда выводить результат
				var val = $(this).val();
				var type = $(this).attr("check_type"); // тип проверки
				var params = {method: "check_input", "elem" : elem, "val" : val, type: type};				
				if(val.length>=3){
					$(params.elem).html('<i class="fa fa-refresh fa-spin"></i>');
					console.log(val);
					$.get( LS("refresh_ui.php"), params, 
						function( data ) {
							if(data.status == "ok"){
								$(params.elem).html(" <span style='color: #1d9d74;'><i class='fa fa-check-square-o'</i> свободно</span>");
							}
							else
							if(data.status == "not_valid"){
								$(params.elem).html(" <span style='color: #ED2847'><i class='fa fa-times-circle-o'</i> не допустимо</span>");
							}
							else{
								$(params.elem).html(" <span style='color: #ED2847'><i class='fa fa-times-circle-o'</i> занято</span>");
							}
						},
						"json"
					);
				}
				
			}
		},
		ShowVotes: function(base, t_key, page_id){
			var params = {method : "getMarks", base: base, t_key: t_key};
			var html;
			var list;
			$.get( LS("server/proc_votes.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							console.log(data); 
							if(data.votes!=null)
								list='<li data-role="list-divider">Оценка: '+data.rating+'</li>';
							$.each(data.votes, function(key,obj){
								console.log(obj);
								list+='<li class="ui-shadow" id="votelist_'+obj.user.id+'" user_id="'+obj.user.id+'">';
								list+='<img src="'+User.html.avatar_url(obj.user.foto,60)+'" class="userlist_afoto user-avatar-circle" user_id="'+obj.user.id+'"> ';
								list+='<h2>'+User.html.online_status(obj.user, "tiny")+" "+ User.html.gender(obj.user)+ " " + obj.user.name+'</h2>'; 
								list+='<p>'+User.html.translate(obj.user, "ru", "оценил")+" на "+ User.html.mark_icon(obj.mark)+'</p>'; 
								list+='</li>';
							});
							html='<div data-role="popup"  id="popup_votes" class="ui-content" style="max-width:300px; z-index:99;"><a href="#" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right">Закрыть</a>';
							html+='<ul id="popup_votes_list" data-role="listview" data-theme="a" >'+list+'</ul></div>';
							var popup_obj=$("#" +page_id).append(html);
							$( "#popup_votes" ).popup();
							$( "#popup_votes_list" ).listview();
							$( "#popup_votes" ).popup( "open", {PositionTo : "window"} );
							//событие на клик по аватарке
							$( "#popup_votes .user-avatar-circle").off("vclick");
							$( "#popup_votes .user-avatar-circle").on("vclick", UserPage.Go);
							
							
						}
						else{
							show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
						}
						
					}
				},
				"json"
			);			
		},
		Confirm : {
			onShow : function(ev){
				ev.preventDefault();
				var page_id = $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				var html;
				var type = $(this).attr("confirm_type");
				var h;
				var title;
				var attrs;
				//откуда вызвано окно
				if(page_id == "page_user"){
					$("#page_user_topmenu").popup("close");
				}
				if(page_id == "page_comment"){
					$("#page_comment_menu").popup("close");
				}
				//определяем текст попапа
				if(type=="add_to_friend"){
					h="Добавить в друзья?";
					title = "Вы уверены что хотите добавить в друзья?";
					attrs = "f_id='"+$(this).attr("f_id")+"' act='add' type='"+type+"'";
				}
				else
				if(type=="delete_from_friend"){
					h="Удалить из друзей?";
					title = "Вы уверены что хотите удалить из друзей?";
					attrs = "f_id='"+$(this).attr("f_id")+"' act='delete' type='"+type+"'";
				}
				else
				if(type=="logout"){
					h="Выйти?";
					title = "Вы уверены что хотите выйти из аккаунта?";
					attrs = " type='"+type+"'";
				}
				else
				if(type=="delete_all_comments"){
					h="Удалить комментарии?";
					title = "Вы уверены что хотите удалить все комментарии?";
					attrs = " type='"+type+"' base='"+$(this).attr("base")+"' t_key='"+$(this).attr("t_key")+"'";
				}
				else
				if(type=="delete_source"){
					h="Удалить?";
					if($(this).attr("base") == "fotos" || $(this).attr("base") == "users_fotos")
						title = "Вы уверены что хотите удалить эту фотографию?";
					else
					if($(this).attr("base") == "music" )
						title = "Вы уверены что хотите удалить эту песню?";
					else
					if($(this).attr("base") == "clips" )
						title = "Вы уверены что хотите удалить это видео?";
					attrs = " type='"+type+"' base='"+$(this).attr("base")+"' t_key='"+$(this).attr("t_key")+"'";
				}
				else
				if(type=="forgot_pass"){
					h="Это Ваша страница?";
					title = "Вы уверены что эта страница принадлежит Вам?";
					attrs = " type='"+type+"' user_id='"+$(this).attr("user_id")+"'";
				}
				html='<div data-role="popup" id="confirm_popup" data-overlay-theme="b" data-theme="b" data-dismissible="false" style="max-width:400px;">' +
					'<div data-role="header" data-theme="a" role="banner" class="ui-header ui-bar-a">'+
						'<h1 class="ui-title" role="heading" aria-level="1">'+h+'</h1>'+
					'</div>'+
					'<div role="main" class="ui-content">'+
						'<h3 class="ui-title">'+title+'</h3>' +
						'<a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b yes" '+attrs+'>Да</a>' +
						'<a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">Отмена</a> '+
					'</div>'+
					'</div>';
				$(html).appendTo($.mobile.activePage).popup();
				
				/*
				$("#" +page_id).append(html);
				$( "#confirm_popup" ).popup();
				$( "#confirm_popup" ).popup( "open", {PositionTo : "window"} );
				*/
				//настраиваем обработчики
				$("#confirm_popup .yes").on("click", function(ev){
					$("#confirm_popup" ).popup( "close");
					var type = $(this).attr("type");
					//если добавление в друзья
					if(type=="add_to_friend" || type=="delete_from_friend"){
						var f_id = $(this).attr("f_id");
						var act = $(this).attr("act");
						User.link.proc_friend(f_id, act);
					}
					else
					//если выход
					if(type=="logout"){
						gl_logout();
					}
					//если удаление всех комментов
					else
					if(type=="delete_all_comments"){
						var t_key = $(this).attr("t_key");
						var base = $(this).attr("base");
						Comments.Delete.All.Send(t_key,  base);
					}
					//если удаление ресурса
					else
					if(type=="delete_source"){
						var t_key = $(this).attr("t_key");
						var base = $(this).attr("base");
						if(base=="fotos" || base=="users_fotos"){
							Fotos.link.Delete_Handle(t_key, base);
						}
					}
					//если восстановление пароля
					else
					if(type=="forgot_pass"){
						var user_id = $(this).attr("user_id");
						Offline.Forgot.send(user_id);
					}
					
				});
				setTimeout(function(){$( "#confirm_popup" ).popup( "open", {PositionTo : "window"} )},300);
				
			}
		},
		UI :{
			hard_refresh: function(){
				window.location.href = "index.html";
			},
			silent_refresh : function(){
			
			}
		},
		Like : function(ev){
			ev.preventDefault();
			var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
			var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: $(this).attr("mark"), method: "putMark"};
			var link_obj = this;
			rotateEffect1($(this));
			$.get( LS("server/proc_votes.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							$(link_obj).find("span").html(data.vote.rating);
	
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
			
		}
	});
Help = new Object({
		isShown: 0,
		popups : Array(),
		onPageShow : function(){
			var page_id = getCurrentPage();
			$.each(Help.popups, function(key,pop){
				if(pop.page_id==page_id){
					Help.Show(key);
				}
			});
		},
		Show: function(i){
			if(Help.popups[i]!=null && Help.isShown == 0){
				Help.isShown = 1;
				show_popup("help", Help.popups[i].txt+'<a href="javascript: Help.Close('+Help.popups[i].num+');" class="ui-btn ui-corner-all ui-shadow ui-btn-b">Спасибо</a>');
				Help.popups.splice(i,1);
			}
		},
		Close : function(id){
			var params = {method: "closePopup", num: id, "silent_mode": "true"};
			$.get( LS("refresh_ui.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							$( "#popup_window" ).popup( "close");
							Help.isShown=0;
						}						
					}
				},
				"json"
			);
		}
	});
Exch = new Object({
		sources : {type: null, list: Array()}, //что вставляем
		to : {type: null, keys: Object()}, //куда вставляем
		status: 0,
		init : function(){
			Exch.sources = {type: null, list: Array()}; //что вставляем
			Exch.to = {type: null, keys: Object()}; //куда вставляем
			Exch.status = 0;
			$(".share-panel").hide();
			Exch.Utils.refresh_count();
		},
		Go: function(ev){
			ev.preventDefault();
			Exch.init();
			var to_type = $(this).attr("to_type"); //куда вставляем
			if(to_type == "msg"){
				var user_id = $(this).attr("user_id"); 
				Exch.to = {type: to_type, keys: {user_id: user_id}};
			}
			else
			if(to_type == "comments"){
				var t_key = $(this).attr("t_key"); 
				var base = $(this).attr("base"); 
				Exch.to = {type: to_type, keys: {t_key: t_key, base: base}};
			}
			var source_type = $(this).attr("source_type"); // откдуа берем
			Exch.sources.type = source_type;
			if(source_type == "my_fotos"){
				Fotos.GoShare(User.I.id);
			}
			else
			if(source_type == "my_music"){
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_music"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_music?user_id="+User.I.id+"&share=1"} )
			}
			
		},
		onChoose : function(ev){
			ev.preventDefault();
			var t_key = $(this).attr("t_key"); 
			var base = $(this).attr("base"); 
			var param1 = $(this).attr("param1"); 
			var found_i = Exch.Utils.check_exist(t_key, base);
			//обработчики визуализации
			if(getCurrentPage() == "page_usersfotos"){
				//если добавляем
				if(found_i<0){
					Exch.sources.list.push({t_key: t_key, base: base, param1: param1});
					$(this).css({opacity: "1"});
					$(this).children(".btn-choose").show();
				}
				else{
					Exch.sources.list.splice(found_i,1);
					$(this).css({opacity: "0.4"});
					$(this).children(".btn-choose").hide();
				}
			}
			else
			if(getCurrentPage() == "page_music"){
				//если добавляем
				if(found_i<0){
					Exch.sources.list.push({t_key: t_key, base: base, param1: param1});
					$("#page_music .mus_"+ t_key+" .btn-add").html('<i class="fa fa-check fa-button-active" style="font-size: 2em;"></i>'); 
				}
				else{
					Exch.sources.list.splice(found_i,1);
					$("#page_music .mus_"+ t_key+" .btn-add").html('<i class="fa fa-plus fa-button-theme-a" style="font-size: 1.6em;"></i>'); 
				}
			}
			Exch.Utils.refresh_count();
		},
		onSend : function(){
			if(Exch.sources.list.length>0){
				Exch.status = 1;
				if(Exch.to.type == "msg" && Exch.to.keys.user_id>0){
					NavMsg.OpenDialog(Exch.to.keys.user_id);
				}
				else
				if(Exch.to.type == "comments" && Exch.to.keys.t_key>0 && Exch.to.keys.base){
					Comments.GoParams(Exch.to.keys.t_key, Exch.to.keys.base);
				}
			}
			else{
				show_popup("fast_ntfy", "Не выбрано ни одного элемента");
			}
		},
		onCancel : function(){
			Exch.init();
			history.back();
		},
		onReturn : function(){//функция которая вызвается при открытии страниц сообщений и комментарий			
			var post_arr = new Array();
			$.each(Exch.sources.list, function(key,obj){
				if(obj.base == "users_fotos")
					post_arr[key] = "[a users_fotos="+obj.t_key+"]"+obj.param1+"[/a]";
				else
				if(obj.base == "fotos")
					post_arr[key] = "[a fotos="+obj.t_key+"]"+obj.param1+"[/a]";
				else
				if(obj.base == "music")
					post_arr[key] = "[a music="+obj.t_key+"]"+obj.param1+"[/a]";
				else
				if(obj.base == "clips")
					post_arr[key] = "[a video="+obj.t_key+"]"+obj.param1+"[/a]";
			});
			var post_str = post_arr.join(" ");
			if(getCurrentPage() == "page_msg2"){//если открыта страница сообщений, то проверяем есть ли готовые ресурсы для отправки этому юзеру
				if(NavMsg.ActiveUser.id == Exch.to.keys.user_id && Exch.status == 1 && Exch.sources.list.length>0){
					$("#nav-msg-txtarea").val(post_str);
					NavMsg.SendMsgHandler(Exch.to.keys.user_id);
					Exch.init();
				}
			}
			else
			if(getCurrentPage() == "page_comment"){//если открыта страница сообщений, то проверяем есть ли готовые ресурсы для отправки этому юзеру
				if(Comments.source.base == Exch.to.keys.base && Comments.source.t_key == Exch.to.keys.num && Exch.status == 1 && Exch.sources.list.length>0){
					$("#nav-comment-txtarea").val(post_str);
					Comments.SendCommentHandlerParams(Exch.to.keys.t_key, Exch.to.keys.base, $( "#nav-comment-btn").attr("reply_to"));
					Exch.init();
				}
			}
		},
		Utils :{
			check_exist : function(t_key, base){
				var found_i =-1;
				$.each(Exch.sources.list, function(key,obj){
					if(obj.t_key == t_key && obj.base == base)
						found_i = key;
				});
				return found_i;
			},
			refresh_count : function(){
				if(Exch.sources.list.length>0)
					$(".btn-share-ok").html("Отправить ("+Exch.sources.list.length+")");
				else
					$(".btn-share-ok").html("Отправить");
			}
		}
		
	});
Offline = new Object({
		Registration :{
			refresh_nation :function(){
				$("#page_auth_nation").html("<option value='-1' >...</option>"+Environment.Nations.nations_selectmenu()+"<option value='0'>Другая</option>");						
				$("#page_auth_nation").selectmenu("refresh", true);
			},
			check_fields : function(){
				var nation = $("#page_auth_nation").val();
				var email = $("#page_auth_email").val();
				var login = $("#page_auth_login").val();
				var pass = $("#page_auth_pass").val();
				var pass2 = $("#page_auth_pass2").val();
				var gender = $("#page_auth_gender").val();
				var fio = $("#page_auth_fio").val();
				var html="";
				if(pass!=pass2){
					html+="<li>Пароли не совпадают</li>";
				}
				if(!pass){
					html+="<li>Задайте пароль</li>";
				}
				if(!email){
					html+="<li>Укажите email</li>";
				}
				if(!gender){
					html+="<li>Укажите Ваш пол</li>";
				}
				if(nation==-1){
					html+="<li>Укажите Вашу народность</li>";
				}
				if(html){
					html="<h3>Ошибка</h3>"+html;
					show_popup("error", html);
					return false;
				}
				else
					return true;
			},
			onRegister : function(ev){
				ev.preventDefault();
				var nation = $("#page_auth_nation").val();
				var email = $("#page_auth_email").val();
				var login = $("#page_auth_login").val();
				var pass = $("#page_auth_pass").val();
				var pass2 = $("#page_auth_pass2").val();
				var gender = $("#page_auth_gender").val();
				var fio = $("#page_auth_fio").val();
				var params = {method: "registr", ver: GLOBAL_APP_VERS.type, login: login, email: email, pass: pass, fio: fio, gender: gender, nation: nation}
				var valid = Offline.Registration.check_fields();
				if(valid){
					$.get(LS("server/proc_account.php"), params, 
						function( data ) {
							if(data.method_status == "success"){
								var html = "<h3>Поздравляем!</h3>";
								html+="Вы почти зарегистрированы на ШахДаге.<br> Для активации аккаунта, Вам необходимо перейти по ссылке, которую мы отправили Вам по почте.<br><b>Если Вы не нашли письмо, то поищите его в папке Спам.</b>";
								html+='<p><a href="javascript: gl_logout();" data-icon="check" class="ui-btn ui-shadow ui-corner-all ui-btn-b">Далее</a></p>';
								show_popup("important_ntfy", html);
							}
							else{
								show_popup("error", data.error_text);
							}
						},
						"json"
					);
				}
			}
			
		},
		Forgot : {
			send : function(user_id){
				var params = {method: 'forgot', id: user_id, ver: GLOBAL_APP_VERS.type}
				$.get(LS("server/proc_account.php"), params, 
					function( data ) {
						var html;
						if(data.method_status == "success"){
							var html = "<h3>Почти готово!</h3>";
							html+="На Вашу почту отправлена инструкция по восстановлению доступа к вашей странице.";
							html+='<p><a href="javascript: gl_logout();" data-icon="check" class="ui-btn ui-shadow ui-corner-all ui-btn-b">Хорошо</a></p>';
							show_popup("important_ntfy", html);
						}
						else{
							show_popup("error", data.error_text);
						}
					},
					"json"
				);
			},
			link : {
				show_logins : function(){
					var cred = $("#forgot_cred").val();
					var params = {method: 'forgot', cred: cred, ver: GLOBAL_APP_VERS.type}
					if(cred){
						$.get(LS("server/proc_account.php"), params, 
							function( data ) {
								var html;
								if(data.method_status == "success"){
									html='';
									$.each(data.users, function(key,obj){
										html+='<li class="ui-shadow"  confirm_type="forgot_pass" style="cursor: pointer;" user_id="'+obj.id+'">';
										html+='<img src="'+User.html.avatar_url(obj.foto,100)+'" class="userlist_afoto user-avatar-rounded" user_id="'+obj.id+'"> ';
										html+='<h2>'+User.html.online_status(obj, "tiny")+" "+ User.html.gender(obj)+ " " + obj.name+'</h2>'; 										
										html+='<p>';
										html+="<span class='info_1'>Живет: "+obj.city+"</span> ";
										if(obj.nation_id>0)
											html+="<span class='info_1'>Народность: "+Environment.Nations.nation_by_id(obj.nation_id).nationality+"</span>";
										html+="<br>";
										//откуда родом
										if(obj.resp)
											html+="<span class='add_info'>Родом из: "+obj.resp+"</span>";
										if(obj.raion)
											html+="<span class='add_info'>, "+obj.raion+"</span>";
										if(obj.selo) 
											html+="<span class='add_info'>, "+obj.selo+"</span>";
										html+="<span class='add_info'><br></span>";															
										html+='</p>';
										html+='</li>';
									});
									$("#page_auth .userlist .holder").html("Выберите Вашу страницу");
									$("#page_auth .userlist ul").html(html);
									$( "#page_auth .userlist ul").listview();
									$( "#page_auth .userlist ul").listview('refresh');
									$( "#page_auth .userlist li").on("vclick", Environment.Confirm.onShow);
								}
								else{
									show_popup("error", data.error_text);
								}
							},
							"json"
						);
					}
					else{
					}
				}
			}
		}
	});
		