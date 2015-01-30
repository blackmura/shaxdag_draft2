NavLefPanel = new Object({
		turnOff : function(){ 
			var html_='<h2>Меню</h2><p>Вы не вошли под своим аккаунтом на Шах-Даг</p>';
			html_ += '<p><a href="#page_auth"  data-transition="slide" data-icon="lock" class="ui-btn ui-shadow ui-corner-all ui-btn-b nav-login">Войти</a></p>';
			$("#left_panel").html(html_);
			console.log("Отработал объект NavLeftPanel. закрытие");
		},
		turnOn : function(req_obj){
			//обновление панели
			var html_left_panel='';
				html_left_panel+='<div class="user-info-wrapper">';
				html_left_panel+='	<div class="nav-home user-avatar-wrapper" user_id="'+User.I.id+'"><img src="'+User.html.avatar_url(User.I.foto, 60)+'" class="user-avatar-circle"></div>';
				html_left_panel+='	<div class="nav-home user-name-wrapper" user_id="'+User.I.id+'">'+User.html.online_status(User.I, "tiny")+' '+User.I.name+'</div>';
				html_left_panel+='	<div class="nav-home user-buttons-wrapper">'+
					'<input type="button" data-icon="gear" data-iconpos="notext"  data-inline="true" data-mini="true" id="nav-settings" value="Настрокйи">'+
					'<input type="button" data-iconpos="notext" data-icon="refresh"  data-inline="true"  data-mini="true" class="cl_nav-hrefresh" value="Обновить">'+
					'<input type="button" data-iconpos="notext" data-icon="power"  data-inline="true"  data-mini="true" class="cl_nav-logout" confirm_type="logout" value="Выход">'+
					'<input type="button" data-iconpos="notext" data-icon="play"  data-inline="true"  data-mini="true" id="play_btn"  value="">'+ 
					'</div>';
				html_left_panel+='</div>';
				
				
				html_left_panel+='<ul data-role="listview" id="nav-listview1" class="ui-nodisc-icon ui-alt-icon">';
				html_left_panel+=' <li class="nav-news"><a ><i class="fa fa-home"></i> Главная</a> <span class="ui-li-count b" style="display: none;"></span></li>';
				html_left_panel+=' <li class="nav-msg"><a href="#page_msg1" ><i class="fa fa-envelope"></i> Мои сообщения</a> <span class="ui-li-count b" style="display: none;"></span></li>';
				html_left_panel+=' <li class="nav-fotos" user_id="'+User.I.id+'"><a ><i class="fa fa-camera"></i> Мои фотографии</a> <span class="ui-li-count b" style="display: none;"></span></li>';
				html_left_panel+=' <li class="nav-music" user_id="'+User.I.id+'"><a > <i class="fa fa-music"></i> Моя музыка</a> <span class="ui-li-count b" style="display: none;"></span></li>';
				html_left_panel+=' <li class="nav-friends" user_id="'+User.I.id+'"><a > <i class="fa fa-users"></i> Мои друзья</a> <span class="ui-li-count b" style="display: none;"></span></li>';
				
				html_left_panel+='</ul>';
				//друзья онлайн и пользователи онлайн
				html_left_panel+='<div class="friends-div" ><div class="friends-online"><div class="ui-bar ui-bar-b" user_id="'+User.I.id+'"><h2><i class="fa fa-circle user-online"></i> Друзья онлайн (<span>0</span>)</h2></div><ul data-role="listview">';
				html_left_panel+='</div></ul></div>';
				//пользователи онлайн
				html_left_panel+='<div class="users-div" ><div class="friends-online"><div class="ui-bar ui-bar-b" ><h2 online="1"><i class="fa fa-circle user-online"></i> Онлайн (<span>0</span>)</h2> <div class="ui-btn-right my-nation" nation="0" online="1"></div></div><ul data-role="listview">';
				html_left_panel+='</div></ul></div>';

				$("#left_panel").html(html_left_panel);
				$( "#nav-listview1" ).listview();
				$( ".cl_nav-logout" ).button();
				$( ".cl_nav-hrefresh" ).button();
				$( "#nav-settings" ).button();
				$( "#play_btn" ).button();
				
				//adding events
				$( ".cl_nav-logout" ).on( "vclick", Environment.Confirm.onShow);
				$( ".cl_nav-hrefresh" ).on( "vclick",Environment.UI.hard_refresh);
				$( "#nav-settings" ).on( "vclick",  User.Settings.Page.Go);
				$( "#play_btn" ).on("vclick", Music.link.onPanelPlay);
				
				$( "#left_panel .user-avatar-wrapper, .user-name-wrapper" ).on( "vclick",  UserPage.Go); 
				$( "#nav-listview1 .nav-music" ).on( "vclick",  Music.Go); 
				$( "#nav-listview1 .nav-news" ).on( "vclick",  Evants.Go);
				$("#left_panel").on("panelbeforeopen", NavLefPanel.Handlers.onOpen);
				$( "#nav-listview1 .nav-friends" ).on( "vclick",  UserList.GoFriends);
				$( "#nav-listview1 .nav-fotos" ).on( "vclick",  Fotos.Go);
				//кто онлайн
				$("#left_panel .users-div h2").on("vclick", UserList.GoLink);
				$("#left_panel .users-div .my-nation").on("vclick", UserList.GoLink);
				$("#left_panel .friends-div .ui-bar").on("vclick", UserList.GoFriends);
		},
		Users : {
			html : function(users_obj){
				var html="";
				$.each(users_obj, function(key,obj){
					html+='<li class="ui-shadow" id="userlist_'+obj.id+'" user_id="'+obj.id+'">';
					html+='<div class="foto"><img src="'+User.html.avatar_url(obj.foto,60)+'" class="user-avatar-rounded" user_id="'+obj.id+'"></div>';
					html+='<div class="name"><h2>'+User.html.online_status(obj, "tiny")+" "+ User.html.gender(obj)+ " " + obj.name+'</h2>'; 
					html+='<a user_id="'+obj.id+'" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-notext ui-icon-envelope kvadro-btn userlist_amsg" >Сообщение</a>';
					html+="<div class='info_1'>";
					if(obj.city)
						html+="Живет в: "+obj.city+"<br>";
					if(obj.nation_id>0)
						html+="<i class='fa fa-globe'></i> "+Environment.Nations.nation_by_id(obj.nation_id).nationality+"<br>";	
					else
					if(obj.resp)
						html+="Родом из: "+obj.resp+" ";	
					html+='</div>';
					html+='</div><div style="clear: left"></div></li>';
				});
				return html;
			},
			display : function(users_obj, variant) {
				var total = users_obj.total;
				//если нужно отобразить друзей онлайн
				if(variant == "friends_online"){
					if(total>0){
						$("#left_panel .friends-div .friends-online").css({display: "block"});
						$("#left_panel .friends-div .friends-online h2 span").html(total);
						$("#left_panel .friends-div .friends-online ul").html(NavLefPanel.Users.html(users_obj.list));
						$("#left_panel .friends-div .friends-online ul").listview();
					}
					else{
						$("#left_panel .friends-div .friends-online h2 span").html("0");
						$("#left_panel .friends-div .friends-online").css({display: "none"});
					}
				}
				else	
				if(variant == "users_online"){
					if(total>0){
						$("#left_panel .users-div .friends-online").css({display: "block"});
						$("#left_panel .users-div .friends-online h2 span").html(total);
						$("#left_panel .users-div .friends-online ul").html(NavLefPanel.Users.html(users_obj.list));
						$("#left_panel .users-div .friends-online ul").listview();
						//если есть люди моей нации
						if(users_obj.my_nation!=null){
							$("#left_panel .users-div .friends-online .my-nation").css({display: "block"});
							$("#left_panel .users-div .friends-online .my-nation").html(Environment.Nations.nation_by_id(users_obj.my_nation.nation).nationality + "("+users_obj.my_nation.total+")"); 							
							$("#left_panel .users-div .friends-online .my-nation").attr("nation", users_obj.my_nation.nation);
						
						}
						else{
							$("#left_panel .users-div .friends-online .my-nation").css({display: "none"}); 
						}
					}
					else{
						$("#left_panel .users-div .friends-online h2 span").html("0");
						$("#left_panel .users-div .friends-online").css({display: "none"});
					}
				}
				//добавляем обработчики
				$( "#left_panel .user-avatar-rounded" ).off( "vclick"); 
				$( "#left_panel .user-avatar-rounded" ).on( "vclick",  UserPage.Go); 
				//Обработчики кнопок
				$( "#left_panel .userlist_amsg").on( "vclick", function (ev){
					ev.preventDefault();
					NavMsg.OpenDialog($(this).attr("user_id"))
				});
			},
			//отображалка для всех пользователей онлайн с подргрузкой данных с сервера
			display_all : function(){
				var total = Environment.OnlineUsers.total;
				if(total>0){
					$("#left_panel .users-div .friends-online").css({display: "block"});
					$("#left_panel .users-div .friends-online h2 span").html(total);
					$.get( LS("refresh_ui.php"), {method : "refreshOnline"}, 
						function( data ) {
							console.log(data);
							if(data.auth_status=="success" ){
								if(data.method_status=="success"){
									Environment.OnlineUsers = data.online_users;
									NavLefPanel.Users.display(Environment.OnlineUsers, "users_online");
								}								
							}
							
						},
						"json"
					);
				}
				else{
					$("#left_panel .users-div .friends-online h2 span").html("0");
					$("#left_panel .users-div .friends-online").css({display: "none"});
				}
			}
			
		},
		Handlers : {
			onOpen : function(){
				//обновляем визуализацию списка друзей онлайн
				NavLefPanel.Users.display(Environment.Friends.online, "friends_online");
				//обновляем визуализацию всех пользователей онлайн
				NavLefPanel.Users.display_all();
			}
		},
		Ntfy : {
			obj : {evants: 0, friends: 0, board: 0, msg: 0},			
			grab : function(){
				if(Evants.new_!=null){
					NavLefPanel.Ntfy.obj.evants=Evants.new_.fotos+Evants.new_.music+Evants.new_.clips;
				}
				NavLefPanel.Ntfy.obj.msg = NavMsg.Utils.count_new();
				NavLefPanel.Ntfy.obj.friends = Environment.Friends.income_users.total_all;
			},
			display: function(){
				var btn_left_count=0;
				//------левая панель
				//обновления
				if(NavLefPanel.Ntfy.obj.evants>0){
					$(".nav-news .ui-li-count").css({display: "block"});
					$(".nav-news .ui-li-count").html(NavLefPanel.Ntfy.obj.evants);
					btn_left_count=btn_left_count+NavLefPanel.Ntfy.obj.evants;
				}
				else{
					$(".nav-news .ui-li-count").css({display: "none"});
					$(".nav-news .ui-li-count").html(null);
				}
				//сообщения
				if(NavLefPanel.Ntfy.obj.msg>0){
					$(".nav-msg .ui-li-count").css({display: "block"});
					$(".nav-msg .ui-li-count").html(NavLefPanel.Ntfy.obj.msg);
				}
				else{
					$(".nav-msg .ui-li-count").css({display: "none"});
					$(".nav-msg .ui-li-count").html(null);
				}
				//друзья
				if(NavLefPanel.Ntfy.obj.friends>0){
					$(".nav-friends .ui-li-count").css({display: "block"});
					$(".nav-friends .ui-li-count").html(NavLefPanel.Ntfy.obj.friends);
					btn_left_count=btn_left_count+NavLefPanel.Ntfy.obj.friends;
				}
				else{
					$(".nav-friends .ui-li-count").css({display: "none"});
					$(".nav-friends .ui-li-count").html(null);
				}
				
				//-----добавляем счетчики на кнопки топ меню
				//кнопка левого меню
				if(btn_left_count>0)
					$('.topmenu-left').badger(btn_left_count.toString());
				else
					$('.topmenu-left').badger('');
				//кнопка сообщений
				if(NavLefPanel.Ntfy.obj.msg>0){
					$('.topmenu-msg').badger(NavLefPanel.Ntfy.obj.msg.toString());
				}
				else{
					$('.topmenu-msg').badger('');
				}
			},
			refresh : function(){
				NavLefPanel.Ntfy.grab();
				NavLefPanel.Ntfy.display();
			}
		}
	});
