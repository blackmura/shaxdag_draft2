UserPage = new Object({
		PS_list : Array(),
		User : Object(),
		Go : function (ev){
			ev.preventDefault();
			var user_id = $(this).attr("user_id");			
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_user"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_user?user_id="+user_id} )
			$.mobile.silentScroll(0); 
			/*
			//если переход из PS то сначала закрываем его
			if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
				if(Fotos.PS.isShown){
					photoSwipeInstance.hide();
				}
			}
			*/
			//UserPage.GoId($(this).attr("user_id"));
		},
		GoId : function(user_id){
			UserPage.Load(user_id);
		},
		Load : function(user_id){
			$.get( LS("server/proc_user.php"), { method: "getPage", user_id: user_id}, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							UserPage.User = data.user;
							//рисуем диалог
							UserPage.Display(data);
							console.log("go to user page");
							
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
		Display: function(resp_obj){ 
			var html="";
			UserPage.PS_list = new Array();
			//обновляем ссылке в шапке
			UserPage.Utils.refresh_dropdown_menu(resp_obj.user);
			//прорисовываем страницу
			//----имя
			html='<h3 class="ui-bar ui-bar-a ui-corner-all">'+User.html.gender(resp_obj.user)+resp_obj.user.name+' '+User.html.online_status(resp_obj.user, "user_page")+'</h3>';
			//инфо-меню
			html+="<div class='info-line'>";
				if(resp_obj.user.nation_id>0)
					html+="<a style='cursor: pointer;' class='nation' nation='"+resp_obj.user.nation_id+"'><i class='fa fa-globe'></i><b> "+Environment.Nations.nation_by_id(resp_obj.user.nation_id).nationality+"</b></a>";														
				if(resp_obj.user.guests.total>0)
					html+="<span class='guests'><i class='fa fa-star-o'></i> Гостей сегодня: "+resp_obj.user.guests.total+"</span>";
				if(resp_obj.user.rating!=0)
					html+="<span class='rating'><i class='fa fa-heart-o'></i>: "+resp_obj.user.rating+"</span>";
				if(!resp_obj.user.online_status.code)
					html+="<span class='last-visit'>"+resp_obj.user.online_status.txt+"</span>";
			html+="</div>";
			$("#page_user_name").html(html);
			Environment.Utils.set_header(resp_obj.user,"page_user", "user");
			//----аватарка
			//если есть крупная фотка то вставляем ее
			html="<img src='"+Environment.Utils.google_resize(User.html.avatar_url(resp_obj.user.foto, 800),480)+"' bd_src='"+resp_obj.user.foto+"' style='display: none'>";
			$("#page_user_avatar").html(html);
			$("#page_user_avatar img").error(function(){
				var user_foto = $(this).attr("bd_src");
				//если ошибка вызвана не старой миниатюрой, то отображаем старую миниатюру
				if($(this).attr("src")!= User.html.avatar_url(user_foto, 200)){
					$(this).attr("src", User.html.avatar_url(user_foto, 200));
				}//если вызвано старой миниатюрой, то отображаем вопрос
				else{
					$(this).attr("src", User.html.avatar_url("no_avatar.png", 200));
				}
			});
			$("#page_user_avatar img").load(function(){
				$(this).velocity("fadeIn",500);
			});
			//если страница моя, то добавляем кнопку обновления аватарки
			if(resp_obj.user.id==User.I.id){  
				if(GLOBAL_APP_VERS.type =="web_mobile"){
					$("#page_user_avatar").append('<div class="file-avatar"><i class="fa fa-plus fa-button-circle"></i> <input  type="file" name="images" id="upload_avatar" accept="image/jpeg,image/png,image/gif" /></div>');
					$("#upload_avatar").on("change", User.Settings.UploadAvatar);
					clickEffect1($("#page_user_avatar .file-avatar"));
				}
				else
				if(GLOBAL_APP_VERS.type =="app_mobile"){
					clickEffect1($("#page_upload .upload-btn"));
					$("#page_user_avatar").append('<div class="file-avatar"><i class="fa fa-plus fa-button-circle"></i></div>');
					$("#page_user_avatar .file-avatar").attr("upload_type",3);
					$("#page_user_avatar .file-avatar").off("vclick");
					$("#page_user_avatar .file-avatar").on("vclick", app.CameraTrans.onBtnExplore);
					
				}
				
				
				$("#page_user_avatar .file-avatar").trigger("create");
				$("#page_user_left .buttons .msg").css({display: "none"});
			}
			else{
				//удаляем кнопку загрузки фотки
				$("#page_user_avatar .file-avatar").remove();
				$("#page_user_left .buttons .msg").css({display: "block"});
			}
			//если есть привязка к фотке из альбома, то добавляем кнопку лайка
			if(resp_obj.user.userfoto!=null){
				$("#page_user_avatar ").prepend('<div class="avatar-top-options"><div class="like-avatar" base="users_fotos" mark="plus" t_key="'+resp_obj.user.userfoto.num+'"><i class="fa fa-heart"></i> <span>'+resp_obj.user.userfoto.rating+'</span></div>'+
					'<div class="comm-avatar" base="users_fotos" t_key="'+resp_obj.user.userfoto.num+'"><i class="fa fa-comments"></i> <span>'+resp_obj.user.userfoto.comments+'</span></div></div>');
				$("#page_user_avatar .like-avatar").off("vclick");
				$("#page_user_avatar .like-avatar").on("vclick", Environment.Like);
				$("#page_user_avatar .comm-avatar").off("vclick");
				$("#page_user_avatar .comm-avatar").on("vclick", Comments.Go);
			
			}
			else{
				$("#page_user_avatar .avatar-top-options").remove();
			}
			$("#page_user_left .buttons .msg").attr("user_id", resp_obj.user.id);
			//----Основная инфа пользователя 
			html="";
			if(resp_obj.user.place!=null){
				html+='<div class="user-page-info-t1">Живет в</div><div class="user-page-info-t2"><a href="#" country="'+resp_obj.user.place.country+'"> '+resp_obj.user.place.country+'</a>, <a href="#" city="'+resp_obj.user.place.city+'">'+ resp_obj.user.place.city+'</a></div>';
				
			}
			if(resp_obj.user.origin_from!=null){
				html+='<div class="user-page-info-t1">Родом из</div><div class="user-page-info-t2"><a href="#" resp="'+resp_obj.user.origin_from.resp+'">'+resp_obj.user.origin_from.resp+'</a>, <a href="#" raion="'+resp_obj.user.origin_from.raion+'">'+ resp_obj.user.origin_from.raion+'</a> р-н, <a href="#" selo="'+resp_obj.user.origin_from.selo+'">'+ resp_obj.user.origin_from.selo+'</a></div>';

			}
			if(resp_obj.user.edu!=null){
				html+='<div class="user-page-info-t1">Учеба </div><div class="user-page-info-t2">'+resp_obj.user.edu.vuz_name+' '+resp_obj.user.edu.year+', '+ resp_obj.user.edu.faculty+' фак-т</div>';
			}
			if(resp_obj.user.family_status!=null){
				html+='<div class="user-page-info-t1">Семейное положение </div><div class="user-page-info-t2">'+resp_obj.user.family_status+'</div>';
			}
			$("#page_user_info1").html(html);
			//----Фотки
			html="";
			if(resp_obj.fotos_block.total>0){
				html='<div class="ui-corner-all rounded-corners">';
				html+='<div class="ui-bar ui-bar-a">';
				html+='<h3>Фотографии</h3>'; 
				html+='<div class="ui-btn-right"><a  id="page_user_fotos_allfotos" user_id="'+resp_obj.user.id+'" class="ui-btn ui-btn-inline ui-mini ui-corner-all" >все '+resp_obj.fotos_block.total+'</a></div>';
				html+='</div>';
				html+='<div class="ui-body ui-body-a"><p>';
				
				var i=0;				
				$.each(resp_obj.fotos_block.fotos, function(key,obj){
					if(obj.private_foto)
						var base="users_fotos";
					else
						var base="fotos";
					UserPage.PS_list.push({base: base, user : UserPage.User, source: obj});
					html+= "<div class='foto'><a href='"+User.html.fotos_url(obj.path, obj.private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos_block.fotos[i].path, resp_obj.fotos_block.fotos[i].private_foto, "small")+"'></a></div>";
					i++;
				});
				html+='</p></div>';
				html+='</div>';
			}
			$("#page_user_fotos").html(html);
			$( "#page_user_fotos_allfotos" ).on( "vclick",  Fotos.Go);
			PS.ReCreate($("#page_user_fotos .foto a"), UserPage.PS_list, null);
			//----Друзья
			html="";
			if(resp_obj.friends_block != null){
				if( resp_obj.friends_block.total>0){
					html='<div class="ui-corner-all rounded-corners">';
					html+='<div class="ui-bar ui-bar-a">';
					html+='<h3>Друзья</h3>';
					html+='<div class="ui-btn-right"><a href="#" class="ui-btn ui-btn-inline ui-mini ui-corner-all btn-all-friends" user_id="'+resp_obj.user.id+'">все '+resp_obj.friends_block.total+'</a>';
					if(resp_obj.friends_block.total_joint>0){
						html+='<a href="#" class="ui-btn ui-btn-inline ui-mini ui-corner-all" >общие '+resp_obj.friends_block.total_joint+'</a>';
					}
					if(resp_obj.friends_block.total_online>0){
						html+='<a href="#" class="ui-btn ui-btn-inline ui-mini ui-corner-all" >онлайн '+resp_obj.friends_block.total_online+'</a>';
					}
					html+='</div></div>';
					html+='<div class="ui-body ui-body-a"><p>';
					var i=0;
					$.each(resp_obj.friends_block.limits, function(key,obj){
						html+= "<div class='friend'>";
						html+="<img src='"+User.html.avatar_url(resp_obj.friends_block.limits[i].foto, 100)+"' user_id='"+resp_obj.friends_block.limits[i].id+"' class='user-avatar'>";
						html+="<div>"+User.html.gender(resp_obj.friends_block.limits[i])+" "+User.html.online_status(resp_obj.friends_block.limits[i], "tiny")+" "+resp_obj.friends_block.limits[i].name+"</div></div>";
						i++;
					});
					html+='</p></div>';
					html+='</div>';
				}
			}
			$("#page_user_friends").html(html);
			$( ".friend .user-avatar").on( "vclick", UserPage.Go);
			$( "#page_user .btn-all-friends").on( "vclick", UserList.GoFriends);
			$( "#page_user .user-page-info-t2 a").on( "vclick", UserList.GoLink);
			$("#page_user_name .nation").on("vclick", UserList.GoLink);
			
			//подсказки
			if(resp_obj.user.id==User.I.id){
				if(!resp_obj.user.place.country || !resp_obj.user.place.city)
					show_popup ("important_ntfy", 'Вы не заполнили важную информацию о себе! Пожалуйста, укажите город и страну проживания. <a href="javascript: User.Settings.Page.Go()" class="ui-btn ui-shadow ui-corner-all ui-btn-b">Настройки</a>');
				else
				if(!resp_obj.user.origin_from.resp)
					show_popup ("important_ntfy", 'Вы не заполнили важную информацию о себе! Пожалуйста, укажите откуды Вы родом. <a href="javascript: User.Settings.Page.Go()" class="ui-btn ui-shadow ui-corner-all ui-btn-b">Настройки</a>');
			}			
			
		},
		Utils :{
			refresh_dropdown_menu: function(){
				var user = UserPage.User;
				if(user.id ==User.I.id){
					var html='<li><a href="#"  class="go-settings" ><i class="fa fa-cog fa-lg"></i>  Настройки</a></li>';
					$("#page_user_topmenu ul").html(html);
					$("#page_user_topmenu ul").listview();
					$("#page_user_topmenu ul").listview("refresh");
					//обработчики 
					$("#page_user_topmenu .go-settings").on("click", User.Settings.Page.Go);
				}
				else
				if(Environment.Utils.is_friend(user.id)){
					var html='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" act="delete" confirm_type="delete_from_friend"><i class="fa fa-times fa-lg"></i>  Удалить из друзей</a></li>';
					if(!user.is_ban)
						html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="add_to_ban"><i class="fa fa-lock fa-lg"></i>  Заблокировать</a></li>';
					else
						html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="remove_from_ban"><i class="fa fa-unlock-alt fa-lg"></i>  Разблокировать</a></li>';
					
					$("#page_user_topmenu ul").html(html);
					$("#page_user_topmenu ul").listview();
					$("#page_user_topmenu ul").listview("refresh");
					//обработчики 
					$("#page_user_topmenu .go-confirm").on("click", Environment.Confirm.onShow);
				}
				else{
					var html='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" act="add" confirm_type="add_to_friend"><i class="fa fa-plus fa-lg"></i>  Добавить в друзья</a></li>';
					if(!user.is_ban)
						html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="add_to_ban"><i class="fa fa-lock fa-lg"></i>  Заблокировать</a></li>';
					else
						html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="remove_from_ban"><i class="fa fa-unlock-alt fa-lg"></i>  Разблокировать</a></li>';
					
					$("#page_user_topmenu ul").html(html);
					$("#page_user_topmenu ul").listview();
					$("#page_user_topmenu ul").listview("refresh");
					//обработчики 
					$("#page_user_topmenu .go-confirm").on("click", Environment.Confirm.onShow);
				}
				
				
				
			}
		}
		
		
	});
	
	User = new Object({ 
		I : Object(),
		html :{
			gender : function(user_obj){
				if(user_obj.gender=="Ж")
					return '<i class="fa fa-female fa-lg"></i> '
				else
					return '<i class="fa fa-male fa-lg"></i> '
			},
			online_status : function(user_obj, format){
				var html_online_icon;
				//онлайн
				if(user_obj.online_status.code>0){
					//user_page
					if(format=="user_page"){
						if(user_obj.online_status.client_ver == 1 || user_obj.online_status.client_ver == 2){
							return '<div class="user-status user-online"><i class="fa fa-mobile fa-lg"></i> <span>'+user_obj.online_status.txt+'</span></div>';
						}
						else{
							return '<div class="user-status user-online"><i class="fa fa-circle fa-lg"></i> <span>'+user_obj.online_status.txt+'</span></div>';
						}
						
					}
					else
					if(format=="tiny"){
						if(user_obj.online_status.client_ver == 1 || user_obj.online_status.client_ver == 2){
							return '<i class="fa fa-mobile user-online"></i>';
						}
						else{						
							return '<i class="fa fa-circle user-online"></i>';
						}
					}
				}//оффлайн
				else{
					if(format=="user_page")
						return '<div class="user-status user-offline"><i class="fa fa-circle-thin fa-lg"></i> <span>'+user_obj.online_status.txt+'</span></div>';
					else
					if(format=="tiny")
						return '';
				}
			},
			fotos_url : function (path, type, size){
				var p="";
				if(type==1){
					if(size=="small")
						p="small/";
					else
					if(size=="full")
						p="";
					return LLocal("users_fotos/"+p+path);
				
				}
				else
				if(type==0){
					if(size=="small")
						p="small/";
					else
					if(size=="full")
						p="";
					return LLocal("fotos/"+p+path);
				}
				else
					return "no_foto";
			},
			preview_url : function (path, type){
				var p="";
				if(type=="fotos"){
					return LLocal("previews/fotos/"+path);
				
				}
				else
				if(type=="music"){
					return LLocal("previews/music/"+path);
				
				}
				else
					return "no_foto";
			},
			avatar_url: function(path,size){
				if(size==60){
					return LLocal("avatars/small/"+path);
				}
				else
				if(size==40){
					return LLocal("avatars/small/small/"+path);
				}
				else
				if(size==100){
					return LLocal("avatars/small_100/"+path);
				}
				else
				if(size==800){
					return LLocal("avatars/large_800/"+path);
				}
				else{
					return LLocal("avatars/"+path);
				}
			},
			mark_icon :function(mark_val){
				if(mark_val=="+" || mark_val=="++") 
					return '<i class="fa fa-thumbs-o-up" style="color: rgb(32, 163, 32);"></i>';
				else
				if(mark_val=="-")
					return '<i class="fa fa-thumbs-o-down" style="color: rgb(237, 81, 81);"></i>';
			},
			translate : function (user, lang, word){
				if(lang=="ru"){
					if(user.gender == 'М')
						return word;
					else
						return word+'а';
				}
			},
			gift_url : function(path){
				return LLocal("gifts/"+path);
			},
			wedding_status : function(val, gender){
				var html
				if(gender == "Ж"){
					if(val ==1)
						return "Не замужем";
					if(val ==2)
						return "Помолвлена";
					if(val ==3)
						return "Замужем";
					if(val ==4)
						return "Есть парень";
					
				}
				else
				{
					if(val ==1)
						return "Не женат";
					if(val ==2)
						return "Помолвлен";
					if(val ==3)
						return "Женат";
					if(val ==4)
						return "Есть девушка";
					
				}
			}
			
		},
		Settings : {
			UploadAvatar : function(ev){
				var	len = this.files.length; 
				var file;				
				var formdata = new FormData();
				for ( i=0; i < len; i++ ) {
					file = this.files[i];
					console.log(this.files[i]);
					//alert(JSON.stringify(file));
					if (formdata) {
						formdata.append("userfile", file);
						formdata.append("method", "setAvatar");
						$.ajax({
							url: LS("server/proc_settings.php"),
							type: "POST",
							data: formdata,
							processData: false,
							contentType: false,
							success: function (res) {
								var data;
								data = JSON.parse(res); 
								if(data.auth_status == "success"){	
									if(data.method_status == "success"){
										User.I.foto = data.src;
										$("#left_panel .user-avatar-circle").attr("src", User.html.avatar_url(data.src, 60)); 
										$("#page_user_avatar img").attr("src", Environment.Utils.google_resize(User.html.avatar_url(data.src, 800),480)); 
										$("#page_user_avatar .avatar-top-options").remove();
										
										
									}
									else
										show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
								} 
								else{
									console.log(data);	
									gl_logout();
								}
								console.log(data);
							}
						});
					}
					
				}
			},
			
			Page : {
				Go : function(){
					$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_settings"), { transition: "none", allowSamePageTransition: true} );
					User.Settings.Page.Load({"method" : "getAllSettings"});
				},
				init : function(){
					
				},
				Load : function(params){
					$.get( LS("server/proc_settings.php"), params, 
						function( data ) {
							if(data.auth_status=="success" ){
								if(data.method_status=="success"){
									if(params.method == "getAllSettings"){
										User.Settings.Page.Display(data.settings);
									}
									else
									if(params.method=="setPass"){
										show_popup("fast_ntfy", "<i class='fa fa-check'></i> Пароль успешно изменен");
										$("#page_settings_old_pass").val("");
										$("#page_settings_new_pass").val("");
									}
									else
									if(params.method=="setEmail"){
										show_popup("fast_ntfy", "<i class='fa fa-check'></i> Ваша почта изменена на "+params.new_email);
										$("#page_settings_email_pass").val("");
									}
									else
									{
										show_popup("fast_ntfy", "<i class='fa fa-check'></i> Информация обновлена");
									}
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
				Display : function(data){
					console.log(data);
					$("#page_settings_fio").val(data.fio);
					$("#page_settings_city").val(data.city);
					$("#page_settings_country").val(data.country);
					$("#page_settings_resp").val(data.resp);
					$("#page_settings_raion").val(data.raion);
					$("#page_settings_selo").val(data.selo);
					$("#page_settings_vuz").val(data.vuz_name);
					$("#page_settings_faсulty").val(data.vuz_faculty);
					if(data.bday)
						$("#page_settings_bday").val(data.bday);
					//селекты:
					User.Settings.Page.Utils.refresh_gender(data.gender);
					User.Settings.Page.Utils.refresh_accesspage(data.accesspage);
					User.Settings.Page.Utils.refresh_wedding(data.wedding_status, data.gender);
					User.Settings.Page.Utils.refresh_report(data.report);
					User.Settings.Page.Utils.refresh_nation(data.nation);
					User.Settings.Page.Utils.refresh_rules(data.access_rules);
				},
				Utils :{
					refresh_gender :function(gender){						
						$("#page_settings_gender option").prop("selected", false);
						if(gender == "Ж"){
							$($("#page_settings_gender option")[1]).prop("selected",true);							
						}
						else{
							$($("#page_settings_gender option")[0]).prop("selected",true);
						}
						$("#page_settings_gender").selectmenu("refresh", true);
					},
					refresh_accesspage :function(val){
						$("#page_settings_accesspage option").prop("selected", false);
						if(val == "Только мои Друзья"){
							$($("#page_settings_accesspage option")[1]).prop("selected", true);
						}
						else{
							$($("#page_settings_accesspage option")[0]).prop("selected", true);
						}
						//$("#page_settings_gender").selectmenu();
						$("#page_settings_accesspage").selectmenu("refresh", true);
					},
					refresh_wedding : function(val, gender){
						var html;
						if(val ==1)
							html+="<option value='1' selected='selected'>"+User.html.wedding_status(1, gender)+"</option>";
						else
							html+="<option value='1'>"+User.html.wedding_status(1, gender)+"</option>";
						if(val ==2)
							html+="<option value='2' selected='selected'>"+User.html.wedding_status(2, gender)+"</option>";
						else
							html+="<option value='2'>"+User.html.wedding_status(2, gender)+"</option>";
						if(val ==3)
							html+="<option value='3' selected='selected'>"+User.html.wedding_status(3, gender)+"</option>";
						else
							html+="<option value='3'>"+User.html.wedding_status(3, gender)+"</option>";
						if(val ==4)
							html+="<option value='4' selected='selected'>"+User.html.wedding_status(4, gender)+"</option>";
						else
							html+="<option value='4'>"+User.html.wedding_status(4, gender)+"</option>";
						$("#page_settings_wedding").html(html);
						$("#page_settings_wedding").selectmenu("refresh", true);
					},
					refresh_report :function(val){
						if(val == "1"){
							$("#page_settings_email_ntfy").prop("checked",true);
						}
						
						//$("#page_settings_gender").selectmenu();
						$("#page_settings_email_ntfy").checkboxradio("refresh", true);
					},
					refresh_nation :function(val){
						$("#page_settings_nation").html(Environment.Nations.nations_selectmenu(val));						
						$("#page_settings_nation").selectmenu("refresh", true);
					},
					refresh_rules : function(data){
						//msg
						$("#page_settings_rules_msg option").prop("selected", false);
						if(data.rules_msg == "0")
							$($("#page_settings_rules_msg option")[0]).prop("selected", true);
						if(data.rules_msg == "1")
							$($("#page_settings_rules_msg option")[1]).prop("selected", true);
						if(data.rules_msg == "2")
							$($("#page_settings_rules_msg option")[2]).prop("selected", true);
						$("#page_settings_rules_msg").selectmenu("refresh", true);
						
						//nature
						$("#page_settings_rules_nature option").prop("selected", false);
						if(data.rules_nature == "0")
							$($("#page_settings_rules_nature option")[0]).prop("selected", true);
						if(data.rules_nature == "1")
							$($("#page_settings_rules_nature option")[1]).prop("selected", true);
						if(data.rules_nature == "2")
							$($("#page_settings_rules_nature option")[2]).prop("selected", true);
						$("#page_settings_rules_nature").selectmenu("refresh", true);
						//friends
						$("#page_settings_rules_friends option").prop("selected", false);
						if(data.rules_friends == "0")
							$($("#page_settings_rules_friends option")[0]).prop("selected", true);
						if(data.rules_friends == "1")
							$($("#page_settings_rules_friends option")[1]).prop("selected", true);
						if(data.rules_friends == "2")
							$($("#page_settings_rules_friends option")[2]).prop("selected", true);
						$("#page_settings_rules_friends").selectmenu("refresh", true);
						//wedding
						$("#page_settings_rules_wedding option").prop("selected", false);
						if(data.rules_wedding == "0")
							$($("#page_settings_rules_wedding option")[0]).prop("selected", true);
						if(data.rules_wedding == "1")
							$($("#page_settings_rules_wedding option")[1]).prop("selected", true);
						if(data.rules_wedding == "2")
							$($("#page_settings_rules_wedding option")[2]).prop("selected", true);
						$("#page_settings_rules_wedding").selectmenu("refresh", true);
						//bday
						$("#page_settings_rules_bday option").prop("selected", false);
						if(data.rules_bday == "0")
							$($("#page_settings_rules_bday option")[0]).prop("selected", true);
						if(data.rules_bday == "1")
							$($("#page_settings_rules_bday option")[1]).prop("selected", true);
						if(data.rules_bday == "2")
							$($("#page_settings_rules_bday option")[2]).prop("selected", true);
						$("#page_settings_rules_bday").selectmenu("refresh", true);
						//edu
						$("#page_settings_rules_edu option").prop("selected", false);
						if(data.rules_edu == "0")
							$($("#page_settings_rules_edu option")[0]).prop("selected", true);
						if(data.rules_edu == "1")
							$($("#page_settings_rules_edu option")[1]).prop("selected", true);
						if(data.rules_edu == "2")
							$($("#page_settings_rules_edu option")[2]).prop("selected", true);
						$("#page_settings_rules_edu").selectmenu("refresh", true);
					}
				},
				link :{
					onClick_general_main : function(ev){
						ev.preventDefault();
						var fio = $("#page_settings_fio").val();
						var city = $("#page_settings_city").val();
						var country = $("#page_settings_country").val();
						var gender = $("#page_settings_gender").val();
						var wedding = $("#page_settings_wedding").val();
						var bday = $("#page_settings_bday").val();
						if(!gender || !city || !country)
							show_popup("fast_ntfy", "Обязательно должны быть указаны: <li>Пол</li> <li>Город</li> <li>Страна</li>");
						else{
							var params={method: "setGeneral-main", fio: fio, city: city, country: country, gender: gender, wedding: wedding, bday: bday, gender: gender};
							User.Settings.Page.Load(params);
						}
					},
					onClick_general_edu : function(ev){
						ev.preventDefault();
						var vuz_name = $("#page_settings_vuz").val();
						var vuz_faculty = $("#page_settings_faсulty").val();
						var vuz_year = $("#page_settings_vuz_year").val();

						if(!vuz_name || !vuz_faculty || !vuz_year ||!(parseInt(vuz_year)>0))
							show_popup("fast_ntfy", "Обязательно должны быть указаны: <li>Название ВУЗа</li> <li>Факультет</li> <li>Год окончания</li>");
						else{
							var params={method: "setGeneral-edu", vuz_name: vuz_name, vuz_faculty: vuz_faculty, vuz_year: vuz_year};
							User.Settings.Page.Load(params);
						}
					},
					onClick_nation : function(ev){
						ev.preventDefault();
						var resp = $("#page_settings_resp").val();
						var raion = $("#page_settings_raion").val();
						var selo = $("#page_settings_selo").val();
						var nation = $("#page_settings_nation").val();
						if(!resp || !nation)
							show_popup("fast_ntfy", "Обязательно должны быть указаны: <li>Родная республика</li> <li>Ваша народность</li>");
						else{
							var params={method: "setNation", resp: resp, raion: raion, selo: selo, nation: nation};
							User.Settings.Page.Load(params);
						}
					},
					onClick_privacy : function(ev){
						ev.preventDefault();
						var accesspage = $("#page_settings_accesspage").val();
						var rules_msg = $("#page_settings_rules_msg").val();
						var rules_nature = $("#page_settings_rules_nature").val();
						var rules_friends = $("#page_settings_rules_friends").val();
						var rules_wedding = $("#page_settings_rules_wedding").val();
						var rules_bday = $("#page_settings_rules_bday").val();
						var rules_edu = $("#page_settings_rules_edu").val();
						if($("#page_settings_email_ntfy").is(":checked"))
							var report = 1;
						else
							var report = 0;
						
						var params={method: "setPerms", 
							accesspage: accesspage, 
							rules_msg: rules_msg, 
							rules_nature: rules_nature, 
							rules_friends: rules_friends,
							rules_wedding: rules_wedding,  
							rules_bday: rules_bday,
							rules_edu: rules_edu,
							report: report
							};
						User.Settings.Page.Load(params);
						
					},
					onClick_password : function(ev){
						ev.preventDefault();
						var old_pass = $("#page_settings_old_pass").val();
						var new_pass = $("#page_settings_new_pass").val();
						
						if(!old_pass || !new_pass)
							show_popup("fast_ntfy", "Вы должны указать старый и новый пароль");
						else{
							var params = {method : "setPass", old_pass: old_pass, new_pass: new_pass};
							User.Settings.Page.Load(params);
						}
					},
					onClick_email : function(ev){
						ev.preventDefault();
						var pass = $("#page_settings_email_pass").val();
						var email_old = $("#page_settings_email_old").val();
						var email_new = $("#page_settings_email_new").val();
						
						if(!pass || !email_old ||!email_new)
							show_popup("fast_ntfy", "Вы должны указать пароль, старую и новую почту");
						else{
							var params = {method : "setEmail", pass: pass, old_email: email_old, new_email: email_new};
							User.Settings.Page.Load(params);
						}
					},
				}
			}
		},
		link : {
			proc_friend : function(f_id, action){
				var params= {f_id: f_id, act: action, method: "processFriends"};
				$.get( LS("server/proc_userlist.php"), params, 
					function( data ) {
						console.log(data);
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								if(params.act=="add"){
									show_popup("fast_ntfy", "Запрос на добавление в друзья отправлен");
								}
								else
								if(params.act=="delete"){
									show_popup("fast_ntfy", "Пользователь удален из друзей");
									Environment.Utils.pop_friend(data.user.id);
								}
								//если находимся на странице пользователя, то обновляем меню
								if(getCurrentPage()=="page_user"){
									UserPage.Utils.refresh_dropdown_menu();
								}
								console.log(data);							
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}	
						}
						else{
							Environment.Utils.handle_auth_error();
						}
					},
					"json"
				);
			},
			proc_ban : function(user_id, action){
				var params= {user_id: user_id, method: action};
				$.get( LS("server/proc_user.php"), params, 
					function( data ) {
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								if(params.method=="add_to_ban"){
									show_popup("fast_ntfy", "Пользователь заблокирован");
									if(getCurrentPage()=="page_user")
										UserPage.User.is_ban = 1;
									else
									if(getCurrentPage()=="page_msg2")
										NavMsg.ActiveUser.is_ban = 1;
								}
								else
								if(params.method=="remove_from_ban"){
									show_popup("fast_ntfy", "Пользователь разблокирован");
									if(getCurrentPage()=="page_user")
										UserPage.User.is_ban = 0;
									else
									if(getCurrentPage()=="page_msg2")
										NavMsg.ActiveUser.is_ban = 0;
								}
								//если находимся на странице пользователя, то обновляем меню
								if(getCurrentPage()=="page_user"){
									UserPage.Utils.refresh_dropdown_menu();
								}
								else
								if(getCurrentPage()=="page_msg2"){
									NavMsg.Utils.refresh_dropdown_menu();
								}
								console.log(data);							
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}	
						}
						else{
							Environment.Utils.handle_auth_error();
						}
					},
					"json"
				);
			}
		}
	});
UserList = new Object({
		list : Object(),
		el_per_page : 16,
		loading_data : 0,
		total_all: 0,
		url_params : Object(),
		Filter : Object(),
		init : function(){
			UserList.list = new Object();
			UserList.el_per_page = 16;
			UserList.loading_data =0;
			UserList.total_all = 0;
			UserList.url_params = new Object();
			UserList.Filter = UserList.constructFilter();
			
		},
		constructFilter : function(){
			return {
				name: null,
				country: null,
				city: null,
				resp: null,
				raion: null,
				selo: null,
				gender: null,
				user_nation: null,
				user_vuz_name: null,
				user_vuz_faculty: null,
				user_id : null, //whom friend
				online: 0,
				in_radius: 0
			}
		},
		GoUsers : function(){ //функция открытия списка пользователей
			var params;
			UserList.init(); 
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersearch"), { transition: "none", allowSamePageTransition: true} );
			//показываем навбар
			$("#page_usersearch .navbar-public").css({display : "block"});
			$("#page_usersearch_navbar").css({display : "block"});
			//unhide geolocation
			$("#page_usersearch .btn-in-radius").css({display : "inline-block"});
			
			Environment.Utils.refresh_public_navbar("#page_usersearch .navbar-public", "btn-users");
			//по умолчанию открываем пользователей своей нации
			if(User.I.nation_id>0)
				UserList.Filter.user_nation = User.I.nation_id;
			params=UserList.Filter;
			params.initial=1;
			params.el_per_page=UserList.el_per_page;
			params.last=0;
			params.method='getUsersSearch';
			UserList.Load(params);
			setTimeout(UserList.link.refresh_navbar,100);
			
		},
		//функция перехода по ссылке на друзей пользователя
		GoFriends : function(ev){
			ev.preventDefault();
			var user_id = $(this).attr("user_id");
			UserList.init();
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersearch"), { transition: "none", allowSamePageTransition: true} );
			//скрываем навбар
			$("#page_usersearch .navbar-public").css({display : "none"});
			$("#page_usersearch_navbar").css({display : "none"});
			//hide geolocation
			$("#page_usersearch .btn-in-radius").css({display : "none"});
			//устанавливаем параметры запроса
			UserList.Filter.user_id = user_id;
			params=UserList.Filter;
			params.initial=1;
			params.el_per_page=UserList.el_per_page;
			params.last=0;
			params.method='getUsersSearch';
			UserList.Load(params);
		},
		//функция поиска по ссылке
		GoLink : function(ev){
			ev.preventDefault();
			UserList.init(); 
			var city = $(this).attr("city");
			var country = $(this).attr("country");
			var resp = $(this).attr("resp");
			var raion = $(this).attr("raion");
			var selo = $(this).attr("selo");
			var nation = $(this).attr("nation");
			var online = $(this).attr("online");
			var in_radius = $(this).attr("in_radius");

			
			//показываем навбар
			$("#page_usersearch .navbar-public").css({display : "block"});
			$("#page_usersearch_navbar").css({display : "block"});
			//unhide geolocation
			$("#page_usersearch .btn-in-radius").css({display : "inline-block"});
			UserList.GoSearch({city: city, country: country, resp: resp, raion: raion, selo: selo, user_nation: nation, online: online, in_radius: in_radius});
			//close panel if opened
			if( $("#left_panel").hasClass("ui-panel-open") == true )
				$("#left_panel").panel("close");
				
		},
		//функция перехода на страницу поиска людей
		GoSearch: function(filterObj){
			var params;
			if ($( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id")=="page_usersearch"){
				
			}
			else{
				UserList.init();
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersearch"), { transition: "none", allowSamePageTransition: true} );
				
			}
			$.mobile.silentScroll(0);
			//устанавливаем фильтры
			if(filterObj!=null){
				UserList.Filter=$.extend(UserList.Filter, filterObj);
			}
			//задаем параметры запроса
			params=UserList.Filter;
			params.initial=1;
			params.el_per_page=UserList.el_per_page;
			params.last=0;
			params.method='getUsersSearch';
			UserList.Load(params);
			setTimeout(UserList.link.refresh_navbar,100);
			
		},
		Load : function(params){
			UserList.loading_data=1;
			$.get( LS("server/proc_userlist.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							UserList.total_all=data.users_data.total_all;
							UserList.url_params=params;
							//если загрузка инициализирующая
							if(params.initial==1){
								//заполняем список пользователей
								UserList.list=data.users_data.users;
								UserList.Display(data, params);

							}
							//если догрузка 
							else{
								if(data.users_data.users.length>0){
									UserList.list=UserList.list.concat(data.users_data.users);
									UserList.Append(data, params);
									console.log("Load appended userlist");
								}
							}
						}
						else{
							show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
						}
					}
					else{
						Environment.Utils.handle_auth_error();
					}
					UserList.loading_data=0;
				},
				"json"
			)
				.fail(function(){
					UserList.loading_data=0;
				});
		},
		GoAppend : function(){ //отрабатывает для догрузки данных
			var params=UserList.url_params;
			if(UserList.list.length<UserList.total_all){
				params.last=UserList.list.length;
				params.initial=0;
				UserList.Load(params);
			}
		},
		SingleUser : {
			html : function(users_obj){
				var i=0;
				var html="";
				$.each(users_obj, function(key,obj){
					html+='<li class="ui-shadow" id="userlist_'+obj.id+'" user_id="'+obj.id+'">';
					html+='<img src="'+User.html.avatar_url(obj.foto,100)+'" class="userlist_afoto user-avatar-rounded" user_id="'+obj.id+'"> ';
					html+='<h2>'+User.html.online_status(obj, "tiny")+" "+ User.html.gender(obj)+ " " + obj.name;
						if(!obj.online_status.code){
							html+="<div class='offline-status'>"+obj.online_status.txt+"</div>";
						}
					html+='</h2>'; 
					html+='<p>';
					if(obj.nation_id>0){
						if(obj.nation_id == User.I.nation_id)
							var nation_class = "my_nation";
						else
							var nation_class = "";
						html+="<span class='info_1 "+nation_class+"'><i class='fa fa-globe'></i> "+Environment.Nations.nation_by_id(obj.nation_id).nationality+"</span> ";
					}
					if(obj.distance){
						html+="<span class='info_1'><i class='fa fa-crosshairs'></i> "+Geo.Utils.distance_text(obj.distance)+"</span>";
					}
					else
					if(obj.city)
						html+="<span class='info_1'>Живет: "+obj.city+"</span>";	
						
					html+="<br>";
					//откуда родом
					if(obj.resp)
						html+="<span class='add_info'>Родом из: "+obj.resp+"</span>";
					if(obj.raion)
						html+="<span class='add_info'>, "+obj.raion+"</span>";
					if(obj.selo) 
						html+="<span class='add_info'>, "+obj.selo+"</span>";
					html+="<span class='add_info'><br></span>";
					
					html+='<a user_id="'+obj.id+'" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-left ui-icon-envelope kvadro-btn userlist_amsg" >Сообщение</a>';
					if( Environment.Utils.is_friend(obj.id)==false )
						html+='<a class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-notext ui-icon-plus kvadro-btn go-confirm"  f_id="'+obj.id+'" act="add" confirm_type="add_to_friend" >В друзья</a>';
					//html+='<a user_id="'+obj.id+'" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-notext ui-icon-picture-o kvadro-btn userlist_afriends" >Фотографии</a>';
					//html+='<a user_id="'+obj.id+'" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-notext ui-icon-ellipsis-h kvadro-btn userlist_amore" >Еще</a>';
					html+='</p>';
					html+='</li>';
					i++;
				});
				return html;
			},
			html_income : function(users_obj){
				var i=0;
				var html="";
				$.each(users_obj, function(key,obj){
					html+='<div class="ui-corner-all rounded-corners" id="f_'+obj.id+'">'; 
					html+='<div class="ui-bar ui-bar-a ntfy">';
						html+='<h3 >';
							html+='<div user_id = "'+obj.id+'"  class="user-foto user-go"><img src="'+User.html.avatar_url(obj.foto,40)+'"  class="user-avatar-rounded"></div>';
							html+=' <div user_id = "'+obj.id+'" class="user-name user-go">'+User.html.online_status(obj, "tiny")+" "+ User.html.gender(obj)+ ' '+obj.name+'</div>';
							html+='<div class="ui-btn-right"><i f_id="'+obj.id+'"  act="decline" class="fa fa-times-circle-o  fa-lg fa-button-theme-a btn-close btn-act"></i></div>';
						html+='</h3>';
					html+='</div>';
					html+='<div class="ui-body ui-body-a">';
					html+='<h3>Хочет добавить Вас в друзья</h3>';
					html+='<div user_id="'+obj.id+'" class="foto user-go"><img src="'+User.html.avatar_url(obj.foto,100)+'" class="user-avatar-rounded" user_id="'+obj.id+'"></div>';
					html+='<div class="name">'; 
					html+="<div class='info_1'>";
					if(obj.city)
						html+="Живет в: "+obj.city+"<br>";
					if(obj.nation_id>0)
						html+="Народность: "+Environment.Nations.nation_by_id(obj.nation_id).nationality+"<br>";	
					if(obj.resp)
						html+="Родом из: "+obj.resp+" ";	
					html+='</div>';
					html+='</div><div style="clear: left"></div>';
					html+='<a f_id="'+obj.id+'" act="accept" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-left ui-icon-check kvadro-btn btn-act" >Добавить</a>';
					html+='<a f_id="'+obj.id+'" act="decline" class="ui-btn ui-btn-b ui-btn-inline ui-mini ui-btn-icon-left ui-icon-delete kvadro-btn btn-act" >Отклонить</a>';
					html+='</div></div>';
				});
				return html;
			}
			
		},
		//первая отрисовка списка пользователей
		Display: function(resp_obj, params){ 
			$("#page_userlist_list").html("");
			$("#page_usersearch .income_list").html("");
			//если страница поиска
			if(params.method=="getUsersSearch"){
				//если страница друзей
				if(params.user_id>0){
					//если моя страница
					if(params.user_id == User.I.id){
						//меняем заголовок
						Environment.Utils.set_header("Мои друзья","page_usersearch", "title");
						//обновляем объект в среде
						Environment.Friends.income_users = resp_obj.income_users;
						//отображаем входящие заявки
						if(resp_obj.income_users.total_all>0){							
							$("#page_usersearch .income_list").css({display : "block"});
							$("#page_usersearch .income_list").html(UserList.SingleUser.html_income(resp_obj.income_users.users));
						}
						else{
							//скрываем список входящих заявок
							$("#page_usersearch .income_list").css({display : "none"});
						}
					}
					else{						
						Environment.Utils.set_header(resp_obj.user,"page_usersearch", "user");
						//скрываем список входящих заявок
						$("#page_usersearch .income_list").css({display : "none"});
					}
				}
				else{
					//меняем заголовок
					Environment.Utils.set_header("Люди","page_usersearch", "title");
					//скрываем список входящих заявок
					$("#page_usersearch .income_list").css({display : "none"});
				}
				
				//-------Список пользователей
				if(resp_obj.users_data.total>0){
					var html='<ul id="page_userlist_list_ul" data-role="listview" data-theme="a" >';
					html+=UserList.SingleUser.html(resp_obj.users_data.users);
					html+='</ul>';
					//сколько найдено
					if(params.initial==1){
						UserList.Utils.display_found_number(resp_obj.users_data.total_all);
						if(params.in_radius)
							$("#page_usersearch .found_number").append(" в радиусе "+params.in_radius+"км");
					}
					$("#page_userlist_list").html(html);
					$( "#page_userlist_list_ul" ).listview();
					$( "#page_userlist_list_ul" ).listview('refresh');
					
				}
				//если людей нет
				else{
					//если страница друзей
					if(params.user_id>0){
						$("#page_usersearch .found_number").html("У Вас пока нет друзей.");
					}
					else{
						UserList.Utils.display_found_number(0);
					}
				}
				//обработчики
				$( "#page_userlist_list_ul li").on("click", UserList.link.btn_details_onClick);
				$( "#page_userlist_list .userlist_afoto").on( "vclick", UserPage.Go);
				$("#page_userlist_list .go-confirm").on("click", Environment.Confirm.onShow);
				//Обработчики кнопок
				$( "#page_userlist_list .userlist_amsg").on( "vclick", function (ev){
					ev.preventDefault();
					NavMsg.OpenDialog($(this).attr("user_id"))
				});
				//обработчики заявок
				$("#page_usersearch .income_list .user-go").on( "vclick", UserPage.Go);
				$("#page_usersearch .income_list .btn-act").on( "vclick", UserList.link.btn_accept_onClick);
				
			}
			
		},
		Append: function(resp_obj, params){ 
			var html="";
			//если страница поиска
			if(params.method=="getUsersSearch"){
				if(resp_obj.users_data.total>0){
					html=UserList.SingleUser.html(resp_obj.users_data.users);
					$("#page_userlist_list_ul").append(html);
					$( "#page_userlist_list_ul" ).listview('refresh');
					$( "#page_userlist_list_ul li").on("click", UserList.link.btn_details_onClick);
					$( "#page_userlist_list .userlist_afoto").on( "vclick", UserPage.Go);
					$("#page_userlist_list .go-confirm").on("click", Environment.Confirm.onShow);
					//Обработчики кнопок
					$( "#page_userlist_list .userlist_amsg").on( "vclick", function (ev){
						ev.preventDefault();
						NavMsg.OpenDialog($(this).attr("user_id"))
					});
					//обработчики заявок
					$("#page_usersearch .income_list .user-go").on( "vclick", UserPage.Go);
					$("#page_usersearch .income_list .btn-act").on( "vclick", UserList.link.btn_accept_onClick);
				}
				
			}
			else
			//если галерея
			if(params.method=="getGalleryFotos"){
				
				
			}
		},
		Search : function(){
			var filter = new Object();
			if($("#page_usersearch_name").val())
				filter.name = $("#page_usersearch_name").val();
			if($("#page_usersearch_country").val())
				filter.country = $("#page_usersearch_country").val();
			if($("#page_usersearch_city").val())  
				filter.city = $("#page_usersearch_city").val();
			if($("#page_usersearch_resp").val())
				filter.resp = $("#page_usersearch_resp").val();
			if($("#page_usersearch_raion").val())
				filter.raion = $("#page_usersearch_raion").val();
			if($("#page_usersearch_selo").val())
				filter.selo = $("#page_usersearch_selo").val();
			if($("#page_usersearch_gender").val())
				filter.gender = $("#page_usersearch_gender").val();
			if($("#page_usersearch_nation").val())
				filter.user_nation = $("#page_usersearch_nation").val();
			if($("#page_usersearch_vuz").val())
				filter.user_vuz_name = $("#page_usersearch_vuz").val();
			if($("#page_usersearch_faculty").val())
				filter.user_vuz_faculty = $("#page_usersearch_faculty").val();
			if(!$.isEmptyObject(filter)){
				UserList.GoSearch(filter);
			}
			else
				show_popup("message_not_sent", "Вы не задали ни одного параметра для поиска", $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
			
		},
		link :{
			btn_online_onClick : function(ev){
				console.log("online clicked");
				ev.preventDefault();
				var ExtendFilter = new Object();
				if(UserList.Filter.online==0){
					ExtendFilter={online: 1};
				}
				else{
					ExtendFilter={online: 0};
				}
				UserList.GoSearch(ExtendFilter);
				setTimeout(UserList.link.refresh_navbar,100);
				
			},
			btn_gender_onClick : function(ev){
				ev.preventDefault();
				$("#page_usersearch_gender_popup").popup("close");
				var ExtendFilter = new Object();
				if($(this).attr("gender_id")){
					ExtendFilter={gender: $(this).attr("gender_id")};
				}
				else{
					ExtendFilter={gender: null};
				}
				UserList.GoSearch(ExtendFilter);
				setTimeout(UserList.link.refresh_navbar,100);
				
			},
			btn_nations_onClick : function(){
				var ExtendFilter = new Object();
				if($(this).val()){
					ExtendFilter={user_nation: $(this).val()};
				}
				else{
					ExtendFilter={user_nation: null};
				}
				UserList.GoSearch(ExtendFilter);
				setTimeout(UserList.link.refresh_navbar,100);
				
			},
			btn_radius_onClick : function(ev){
				var radius_distance = 50;
				console.log("radius clicked");
				ev.preventDefault();				
				var ExtendFilter = new Object();
				if(UserList.Filter.in_radius==0){
					$(this).addClass("blink");
					ExtendFilter={online: 1, in_radius: radius_distance};
				}
				else{
					$(this).removeClass("blink");
					ExtendFilter={online: 0, in_radius: 0};
				}
				var cached_obj = Geo.Utils.getCachedObj();
				//проверка на доступность gps
				if(window.navigator.geolocation) {
					Geo.is_supported = true;
				} else {
					Geo.is_supported = false;
				}
				//если геоданные свежие
				if(cached_obj!=null && !Geo.Utils.isTimedOut(cached_obj)){
					$(this).removeClass("blink");
					UserList.GoSearch(ExtendFilter);
					setTimeout(UserList.link.refresh_navbar,100);
				}
				//иначе пробуем обновить
				else
				if(Geo.is_supported){
					navigator.geolocation.getCurrentPosition(function(position) {
						Geo.ProcessGetPosition(position);
						UserList.GoSearch(ExtendFilter);
						setTimeout(UserList.link.refresh_navbar,100);
						
					},function(){ //on error
						$("#page_usersearch .btn-in-radius").removeClass("blink");
						show_popup("fast_ntfy", "Не удалось определить Ваше местоположение. Убедитесь, что Вы разрешили приложению определять ваше местоположение.");
					}
					);	
				}
				else{
					$("#page_usersearch .btn-in-radius").removeClass("blink");
					show_popup("fast_ntfy", "Не удалось подключиться к вашему GPS приемнику");
				}
				
				
			},
			
			refresh_navbar : function(){
				var dom_online=$("#page_usersearch_navbar .navbar_footer_online");
				var dom_gender=$("#page_usersearch_navbar .navbar_footer_gender");
				var dom_nation=$("#page_usersearch_navbar .navbar_footer_nation");
				var dom_nation_title=$("#page_usersearch_navbar .navbar_footer_nation span");
				var dom_search=$("#page_usersearch_navbar .navbar_footer_search");
				var dom_geo=$("#page_usersearch .btn-in-radius i");
				
				if(UserList.Filter.online>0){
					dom_online.addClass("ui-btn-active"); 

				}
				else{
					dom_online.removeClass("ui-btn-active");

				}
				
				if(UserList.Filter.gender){
					dom_gender.addClass("ui-btn-active");
					if(UserList.Filter.gender=="М"){
						dom_gender.html("Мужской");
						dom_gender.removeClass("ui-icon-male"); dom_gender.removeClass("ui-icon-female");
						dom_gender.addClass("ui-icon-male");
					}
					else
					if(UserList.Filter.gender=="Ж"){
						dom_gender.html("Женский");
						dom_gender.removeClass("ui-icon-male"); dom_gender.removeClass("ui-icon-female");
						dom_gender.addClass("ui-icon-female");
					}
					
				}
				else{
					dom_gender.removeClass("ui-btn-active");
					dom_gender.removeClass("ui-icon-male"); dom_gender.removeClass("ui-icon-female");
					dom_gender.addClass("ui-icon-male");
					dom_gender.html("Пол");
				}
				//подсветка меню наций
				if(UserList.Filter.user_nation>0){
					dom_nation.addClass("ui-btn-active"); 
					dom_nation_title.html(Environment.Nations.nation_by_id(UserList.Filter.user_nation).nationality);
					UserList.link.refresh_nation_footer();
				}
				else{
					dom_nation.removeClass("ui-btn-active");
					dom_nation_title.html("Народы");
				}
				
				//подсветка меню поиска
				if(UserList.Filter.name!=null || UserList.Filter.city!=null || UserList.Filter.country!=null || UserList.Filter.resp!=null || UserList.Filter.raion!=null || UserList.Filter.selo!=null){
					dom_search.addClass("ui-btn-active"); 

				}
				else{
					dom_search.removeClass("ui-btn-active");

				}
				
				// геолокация
				if(UserList.Filter.in_radius>0){
					dom_geo.addClass("fa-button-active"); 

				}
				else{
					dom_geo.removeClass("fa-button-active"); 

				}
			
			},
			refresh_nation_selectmenu_sp : function(dom_list){
				dom_list.append(Environment.Nations.nations_selectmenu()); 
				dom_list.selectmenu("refresh", true);
			},
			refresh_nation_footer : function(){
				if (UserList.Filter.user_nation>0){
					var html_options = "<option value=0>Все народы</option>"+Environment.Nations.nations_selectmenu_var(UserList.Filter.user_nation, "nation");
				}
				else{
					var html_options = "<option value=0 selected>Все народы</option>"+Environment.Nations.nations_selectmenu_var(-1, "nation");
				}
				$("#page_usersearch_nation_popup").html(html_options);
				$("#page_usersearch_nation_popup").change (UserList.link.btn_nations_onClick);
			},
			btn_details_onClick : function(ev){
				console.log("details clicked");
				var user_id = $(this).attr("user_id");
				var cur_css=$("#userlist_"+user_id+" .add_info").css("display");
				if(cur_css == "none"){
					$("#userlist_"+user_id+" .add_info").css({display : "inline"});
				}
				else
					$("#userlist_"+user_id+" .add_info").css({display : "none"});
				
			},
			btn_accept_onClick : function(ev){
				ev.preventDefault();
				var f_id = $(this).attr("f_id");
				var action = $(this).attr("act");
				var params= {f_id: f_id, act: action, method: "processFriends"};
				if(Environment.Friends.income_users.total_all>0)
					Environment.Friends.income_users.total_all--;
				else
					Environment.Friends.income_users.total_all=0;
				NavLefPanel.Ntfy.refresh();
				$("#f_"+f_id).velocity("fadeOut", {duration :1000});
				$.get( LS("server/proc_userlist.php"), params, 
					function( data ) {
						console.log(data);
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								if(params.act=="accept"){
									Environment.Utils.push_friend(data.user);
								}
								console.log(data);							
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}	
						}
						else{
							Environment.Utils.handle_auth_error();
						}
					},
					"json"
				);
			}
			
		},
		Utils : {
			display_found_number : function(total){
				if(total>0){
					$("#page_usersearch .found_number").html(NumSklon(total, ['Найден', 'Найдены', 'Найдено'])+" "+total+" "+NumSklon(total, ['человек', 'человека', 'человек']));
				}
				else
					$("#page_usersearch .found_number").html("Никого не найдено");
			}
		}
		
		
	});
	