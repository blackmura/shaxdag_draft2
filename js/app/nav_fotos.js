Fotos = new Object({
		list : Object(),
		active_user : Object(),
		el_per_page : 16,
		loading_data : 0,
		total_all: 0,
		url_params : Object(),
		Filter : Object(),
		delete_mode : 0,
		Go : function(ev){
			ev.preventDefault();
			var user_id = $(this).attr("user_id");
			if(user_id){
				Fotos.init();
				Exch.init();
				$("#page_fotos .navbar-public").css({display : "none"});
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersfotos"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_usersfotos?user_id="+user_id} );
			}
			else{
				Fotos.init();
				Exch.init();
				if(User.I.nation_id>0)
					var Dataurl = "page_fotos?album=1&nation_id="+User.I.nation_id;
				else
					Dataurl = "page_fotos?album=1";
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_fotos"), { transition: "none", allowSamePageTransition: true, dataUrl: Dataurl} );
				//показываем навбар
				$("#page_fotos_navbar").show();
				$("#page_fotos .navbar-public").css({display : "block"});
				Environment.Utils.refresh_public_navbar("#page_fotos .navbar-public", "btn-fotos");
			}
		},
		GoShare : function(user_id){
			$(".share-panel").show();
			if(user_id){
				Fotos.init();
				$("#page_fotos .navbar-public").css({display : "none"});
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersfotos"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_usersfotos?user_id="+user_id} );
			}
			else{
				Fotos.init();
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_fotos"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_fotos?album=1"} );
				//показываем навбар	
				$("#page_fotos_navbar").hide();				
				$("#page_fotos .navbar-public").css({display : "block"});
				Environment.Utils.refresh_public_navbar("#page_fotos .navbar-public", "btn-fotos");
			}
		},
		GoGallery : function (filter){
			var params;
			$.mobile.silentScroll(0);
			//устанавливаем фильтры
			if(filter!=null){
				Fotos.Filter=$.extend(Fotos.Filter, filter);
			}
			//задаем параметры запроса
			params=Fotos.Filter;
			params.initial=1;
			params.el_per_page=Fotos.el_per_page;
			params.method="getGalleryFotos";
			params.last=0;
			Fotos.Load(params);
			setTimeout(Fotos.link.refresh_navbar,100);
		},
		GoUsersFotos : function (user_id){
			var params = new Object();
			//ФОрмируем кнопки и оформление страницы личных фотографий
			if(user_id==User.I.id){
				$( "#page_usersfotos .topheader .btn-upload").css({display : "inline-block"});				
			}
			else
				$( "#page_usersfotos .topheader .btn-upload").css({display : "none"});
			//обновляем меню удаления
			Fotos.delete_mode = 0;			
			
			$.mobile.silentScroll(0);
			//задаем параметры запроса
			params.user_id = user_id,
			params.initial=1;
			params.el_per_page=Fotos.el_per_page;
			params.method="getUserFotos";
			params.last=0;
			Fotos.Load(params);
		},
		GoAppend : function(){
			var params=Fotos.url_params;
			if(Fotos.list.length<Fotos.total_all){
				params.last=Fotos.list.length;
				params.initial=0;
				Fotos.Load(params);
			}
		},
		Load : function(params){
			Fotos.loading_data=1;
			$.get( LS("server/proc_fotos.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							Fotos.url_params=params;
							Fotos.total_all=data.fotos.total_all;
							//если загрузка инициализирующая
							if(params.initial==1){
								//дополняем список фоток
								Fotos.list=data.fotos.fotos;
								if(params.method == "getUserFotos")
									Fotos.active_user = data.user;
								Fotos.Display(data, params);
								console.log("Load initial fotos");
							}
							//если догрузка фоток
							else{
								if(data.fotos.fotos.length>0){
									Fotos.list=Fotos.list.concat(data.fotos.fotos);
									Fotos.Append(data, params);
									console.log("Load appended fotos");
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
					Fotos.loading_data=0;
				},
				"json"
			);
		},
		//первая отрисовка страницы фоток
		Display: function(resp_obj, params){ 
			var html="";
			var base;
			//очищаем список фоток
			$("#page_fotos_list").html("");
			//если галерея
			if(params.method=="getGalleryFotos"){
				if(params.initial==1)
						Fotos.Utils.display_found_number(resp_obj.fotos.total_all, "#page_fotos");
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						html+= "<div  class='foto num_"+resp_obj.fotos.fotos[i].num+"'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a></div>";
						i++;
					});
					$("#page_fotos_list").html(html);
					
					//применяем Swipe
					Fotos.PS.ReCreate($("#page_fotos_list .foto a"));
				}
				
			}
			else
			if(params.method=="getUserFotos"){
				Environment.Utils.set_header(resp_obj.user,"page_usersfotos", "user");
				if(params.initial==1){
						Fotos.Utils.display_found_number(resp_obj.fotos.total_all, "#page_usersfotos");						
				}
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						if(resp_obj.fotos.fotos[i].private_foto == 1)
							base = "users_fotos";
						else
							base = "fotos";
						if(Exch.to.type!=null){//если в режиме отправки то убираем ссылки с фотографии
							html+= "<div class='foto num_"+resp_obj.fotos.fotos[i].num+"' t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' param1 = '"+resp_obj.fotos.fotos[i].path+"' style='opacity: 0.4;'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'>";
						}
						else
							html+= "<div class='foto num_"+resp_obj.fotos.fotos[i].num+"'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a>";
						html+="<div class='btn-delete'><button t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' confirm_type='delete_source' class='ui-btn ui-icon-delete ui-btn-icon-left ui-mini go-confirm'>Удалить</button></div>";
						html+="<div class='btn-choose'><button t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"'  class='ui-btn ui-icon-check ui-btn-icon-left ui-mini'>Выбрано</button></div>";
						html+="</div>";
						i++;
					});
					$("#page_usersfotos_list").html(html);
					if(Exch.to.type!=null){//если мы в режиме отправки
						$("#page_usersfotos_list .foto").off("vclick");
						$("#page_usersfotos_list .foto").on("vclick", Exch.onChoose);
					}
					else{				
						//применяем Swipe
						Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
					}
					
					//обработчик удаления
					Fotos.link.refresh_del_mode();
					$("#page_usersfotos .go-confirm").off("vclick")
					$("#page_usersfotos .go-confirm").on("vclick", Environment.Confirm.onShow);
					
					
				}
				else{
					if(resp_obj.user.id==User.I.id)
						$("#page_usersfotos_list").html("<div class='no-data-info'>Загрузите себе на страницу новые фотографии, чтобы поделиться ими с друзьями</div>");
				}
				
			}
		},
		//Догрузка фоток
		Append: function(resp_obj, params){ 
			var html="";
			var base;
			//если галерея
			if(params.method=="getGalleryFotos"){
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						html+= "<div class='foto'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a></div>";
						i++;
					});
					$("#page_fotos_list").append(html);
					//$(".foto").velocity("fadeIn",500)
					//если PS открыт, то закрываем, обновляем и открываем
					if(Fotos.PS.isShown==1){
						photoSwipeInstance.hide();
						Fotos.PS.ReCreate($("#page_fotos_list .foto a"));
						photoSwipeInstance.show(Fotos.PS.cursor);
					}
					else{
						Fotos.PS.ReCreate($("#page_fotos_list .foto a"));
					}
				}
				
				console.log("appended new fotos"+JSON.stringify(resp_obj));
			}
			else
			//если галерея
			if(params.method=="getUserFotos"){
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						if(resp_obj.fotos.fotos[i].private_foto == 1)
							base = "users_fotos";
						else
							base = "fotos";
						if(Exch.to.type!=null){//если в режиме отправки то убираем ссылки с фотографии
							html+= "<div class='foto num_"+resp_obj.fotos.fotos[i].num+"' t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' param1 = '"+resp_obj.fotos.fotos[i].path+"' style='opacity: 0.4;'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'>";
						}
						else
							html+= "<div class='foto num_"+resp_obj.fotos.fotos[i].num+"'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a>";
						html+="<div class='btn-delete'><button t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"' confirm_type='delete_source' class='ui-btn ui-icon-delete ui-btn-icon-left ui-mini go-confirm'>Удалить</button></div>";
						html+="<div class='btn-choose'><button t_key='"+resp_obj.fotos.fotos[i].num+"' base='"+base+"'  class='ui-btn ui-icon-check ui-btn-icon-left ui-mini'>Выбрано</button></div>";
						html+="</div>";
						i++;
					});
					$("#page_usersfotos_list").append(html);
					if(Exch.to.type!=null){//если мы в режиме отправки
						$("#page_usersfotos_list .foto").off("vclick");
						$("#page_usersfotos_list .foto").on("vclick", Exch.onChoose);
					}
					else{
						//если PS открыт, то закрываем, обновляем и открываем
						if(Fotos.PS.isShown==1){
							photoSwipeInstance.hide();
							Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
							photoSwipeInstance.show(Fotos.PS.cursor);
						}
						else{
							Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
						}
					}
					//обработчик удаления фоток
					Fotos.link.refresh_del_mode(); 
					$("#page_usersfotos .go-confirm").off("vclick")
					$("#page_usersfotos .go-confirm").on("vclick", Environment.Confirm.onShow);
				}
				
				console.log("appended new fotos"+JSON.stringify(resp_obj));
			}
		},
		PS : {
			cursor: 0,
			isShown: 0,
			OnDisplay : function(e){
				if((e.index==(Fotos.list.length-3)) && e.action=="next"){
					Fotos.GoAppend();
				}
				Fotos.PS.cursor=e.index;
				Fotos.PS.Toolbar.refresh(); 
				Fotos.PS.Toolbar.refresh_caption();
			},
			onShow : function(e){
				Fotos.PS.isShown=1;
			},
			onHide : function(e){
				Fotos.PS.isShown=0;
			},
			Toolbar :{
				get : function(){  
					var html;
					html='<div class="ps-toolbar-close ps-btn-close"><i class="fa fa-times fa-lg fa-button-theme-a"></i></div>';
					html+='<div class="ps-toolbar-previous ps-btn-back"><i class="fa fa-chevron-left fa-lg fa-button-theme-a"></i></div>';
					html+='<div class="ps-btn-like" base="" t_key=""><i class="fa fa-heart-o fa-lg fa-button-theme-a"></i><span></span></div>'; 
					html+='<div class="ps-btn-comments"><i class="fa fa-comment-o fa-lg fa-button-theme-a"></i><span></span></div>'; 
					html+='<div class="ps-toolbar-next ps-btn-forward"><i class="fa fa-chevron-right fa-lg fa-button-theme-a"></i></div>';
					return html;
				},
				refresh : function(){
					if(Fotos.list[Fotos.PS.cursor].private_foto == 1)
						var base = "users_fotos";
					else
						var base = "fotos";
					//сколько комментов
					if(Fotos.list[Fotos.PS.cursor].comments>0){
						$(".ps-btn-comments span").html(Fotos.list[Fotos.PS.cursor].comments); 
					}
					else{
						$(".ps-btn-comments span").html(""); 
					}
					//сколько лайков
					if(parseInt(Fotos.list[Fotos.PS.cursor].rating)){
						$(".ps-btn-like span").html(Fotos.list[Fotos.PS.cursor].rating);
						if(Fotos.list[Fotos.PS.cursor].rating>0)
							$(".ps-btn-like span").css({color: "rgb(85, 212, 51)"});
						else
						if(Fotos.list[Fotos.PS.cursor].rating<0)
							$(".ps-btn-like span").css({color: "rgb(229, 66, 38)"});
					}
					else{
						$(".ps-btn-like span").html("");
					}
					//добавляем атрибуты к ссылке
					$(".ps-btn-like").attr("t_key", Fotos.list[Fotos.PS.cursor].num);//like
					$(".ps-btn-like").attr("base", base);
					$(".ps-btn-comments").attr("t_key", Fotos.list[Fotos.PS.cursor].num);//comment
					$(".ps-btn-comments").attr("base", base);
					
						
					if(Fotos.list[Fotos.PS.cursor].voted!=null){
						$(".ps-btn-like i").removeClass("fa-heart-o");
						$(".ps-btn-like i").addClass("fa-heart");
					}
					else{
						$(".ps-btn-like i").removeClass("fa-heart"); 
						$(".ps-btn-like i").addClass("fa-heart-o");
					}
				},
				refresh_caption : function(){
					var html;
					if(Fotos.url_params.method == "getUserFotos")
						var user = Fotos.active_user; 
					else
						var user = Fotos.list[Fotos.PS.cursor].user;
					html='<div class="avatar" user_id="'+user.id+'"><img src="'+User.html.avatar_url(user.foto,40)+'" class="userlist_afoto user-avatar-rounded"></div>';
					html+='<div class="name" user_id="'+user.id+'">'+User.html.online_status(user, "tiny")+" "+ User.html.gender(user)+ " " + user.name+'<br><span>'+Fotos.list[Fotos.PS.cursor].title+'</span></div>';
					$(".ps-caption-content").html(html);
					//обработчики кликов
					//на страницу пользователя 
					$(".ps-caption-content .avatar, .ps-caption-content .name").off("vclick");
					$(".ps-caption-content .avatar, .ps-caption-content .name").on("vclick", Fotos.PS.Toolbar.Handler.GoUser);
					//Лайк
					$(".ps-btn-like").off("vclick");
					$(".ps-btn-like").on("vclick", Fotos.PS.Toolbar.Handler.Like);
					//комментарии 
					$(".ps-btn-comments").off("vclick");
					$(".ps-btn-comments").on("vclick", Fotos.PS.Toolbar.Handler.Comment);
				},
				Handler : { 
					Like : function(ev){
						if(Fotos.PS.isShown && Fotos.list[Fotos.PS.cursor].voted==null ){
							var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: "plus", method: "putMark", cursor: Fotos.PS.cursor};
							$.get( LS("server/proc_votes.php"), params, 
								function( data ) {
									console.log(data);
									if(data.auth_status=="success" ){
										if(data.method_status=="success"){
											//обновляем туллбар к фотке по которой пришел ответ
											Fotos.list[params.cursor].rating=data.vote.rating;
											Fotos.list[params.cursor].voted=1; //метим что оценка проставлена
											Fotos.PS.Toolbar.refresh();			
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
					Comment : function(){
						var base=$(this).attr("base");
						var t_key=$(this).attr("t_key");
						//если переход из PS то сначала закрываем его
						if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
							if(Fotos.PS.isShown){
								photoSwipeInstance.hide(true);
							}
						}
						$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_comment"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_comment?base="+base+"&t_key="+t_key} );
					},
					GoUser : function(ev){
						ev.preventDefault();
						var user_id=$(this).attr("user_id");
						//если переход из PS то сначала закрываем его
						if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
							if(Fotos.PS.isShown){
								photoSwipeInstance.hide(true);
							}
						}
						$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_user"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_user?user_id="+user_id} );
					}
				}
			},
			ReCreate : function(dom_fotos){
				if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
					window.Code.PhotoSwipe.detatch(photoSwipeInstance);
				}
				photoSwipeInstance = dom_fotos.photoSwipe({zIndex: 2, 
					loop: false, 
					getToolbar: Fotos.PS.Toolbar.get, 
					captionAndToolbarAutoHideDelay: 100000,
					fadeInSpeed: 0,
					fadeOutSpeed: 0});
				//обработчик показа изображения
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onDisplayImage, Fotos.PS.OnDisplay);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onShow, Fotos.PS.onShow);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onHide, Fotos.PS.onHide);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onCaptionAndToolbarShow, Fotos.PS.Toolbar.refresh_caption);
			}
		},
		init : function(){
			Fotos.PS.cursor=0;
			Fotos.PS.isShown=0;
			Fotos.list = new Object();
			Fotos.el_per_page = 32;
			Fotos.loading_data =0;
			Fotos.total_all = 0;
			Fotos.url_params = new Object();
			Fotos.Filter = Fotos.constructFilter();
			
		},
		constructFilter : function(){
			return {
				album: null,
				nation_id: null,
				gender: null
			}
		},
		link :{
			btn_album_onClick : function(ev){
				ev.preventDefault();
				$("#page_fotos_album_popup").popup("close");
				var ExtendFilter = new Object();
				if($(this).attr("album_id")){
					ExtendFilter={album: $(this).attr("album_id")};
				}
				else{
					ExtendFilter={album: null};
				}
				Fotos.GoGallery(ExtendFilter);
				//setTimeout(Fotos.link.refresh_navbar,100);
				
			},
			btn_gender_onClick : function(ev){
				ev.preventDefault();
				$("#page_fotos_gender_popup").popup("close");
				var ExtendFilter = new Object();
				if($(this).attr("gender_id")){
					ExtendFilter={gender: $(this).attr("gender_id")};
				}
				else{
					ExtendFilter={gender: null};
				}
				Fotos.GoGallery(ExtendFilter);
				//setTimeout(Fotos.link.refresh_navbar,100);
				
			},
			btn_nations_onClick : function(){ 
				var ExtendFilter = new Object();
				if($(this).val()){
					ExtendFilter={nation_id: $(this).val()};
				}
				else{
					ExtendFilter={nation_id: null};
				}
				Fotos.GoGallery(ExtendFilter);
				//setTimeout(Fotos.link.refresh_navbar,100);
				
			},
			btn_upload_onClick : function(ev){
				ev.preventDefault();
				var upload_type = $(this).attr("upload_type");
				Uploader.init(upload_type);
				Uploader.Display();
				
			},
			
			refresh_navbar : function(){
				console.log(Fotos.Filter);
				var dom_album=$("#page_fotos_navbar .navbar_footer_album");
				var dom_gender=$("#page_fotos_navbar .navbar_footer_gender");
				var dom_nation=$("#page_fotos_navbar .navbar_footer_nation");
				var dom_nation_title=$("#page_fotos_navbar .navbar_footer_nation span");
				//альбом
				if(Fotos.Filter.album){
					dom_album.addClass("ui-btn-active");
					if(Fotos.Filter.album=="1"){
						dom_album.html("Люди");
					}
					else
					if(Fotos.Filter.album=="2"){
						dom_album.html("Культура");
					}
					else
					if(Fotos.Filter.album=="3"){
						dom_album.html("Графика");
					}
					else
					if(Fotos.Filter.album=="4"){
						dom_album.html("Природа");
					}
					
				}
				else{
					dom_album.removeClass("ui-btn-active");
					dom_album.html("Раздел");
				}
				//пол
				if(Fotos.Filter.gender){
					dom_gender.addClass("ui-btn-active");
					if(Fotos.Filter.gender=="М"){
						dom_gender.html("Мужской");
						dom_gender.removeClass("ui-icon-male"); dom_gender.removeClass("ui-icon-female");
						dom_gender.addClass("ui-icon-male");
					}
					else
					if(Fotos.Filter.gender=="Ж"){
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
				if(Fotos.Filter.nation_id>0){
					dom_nation.addClass("ui-btn-active"); 
					dom_nation_title.html(Environment.Nations.nation_by_id(Fotos.Filter.nation_id).nationality);

				}
				else{
					dom_nation.removeClass("ui-btn-active");
					dom_nation_title.html("Народы"); 

				}
				
			},
			refresh_nation_footer : function(){
				/*
				$("#page_fotos_nation_popup .navbar_footer_nation_ul").append(Environment.Nations.nations_listview()); 
				$("#page_fotos_nation_popup .navbar_footer_nation_ul").listview("refresh");
				$("#page_fotos_nation_popup .navbar_footer_nation_ul a").on ("click", Fotos.link.btn_nations_onClick);
				*/
				$("#page_fotos_nation_popup").html("<option value=0>Все народы</option>"+Environment.Nations.nations_selectmenu_var(-1, "nation"));
				$("#page_fotos_nation_popup").change (Fotos.link.btn_nations_onClick);
			},
			Delete : function(ev){
				ev.preventDefault();
				var track_num = $(this).attr("num");
				var base = $(this).attr("base");
				Fotos.link.Delete_Handle(track_num, base);
			},
			Delete_Handle : function(track_num, base){
				var params;
				if(base=="fotos" || base=="users_fotos"){
					params ={track_num: track_num, base: base}
					$.get( LS("server/proc_delete.php"), params, 
						function( data ) {
							if(data.auth_status=="success" ){
								if(data.method_status=="success"){
									//обработчик страницы page_upload
									if(getCurrentPage()=="page_upload"){
										var found_i=-1;
										removeEffect1($("#page_upload .loaded .num_"+params.track_num));
										found_i=Uploader.Utils.get_list_index(params.track_num);
										if(found_i>=0)
											Uploader.list.splice(found_i,1);
										$("#page_upload .counter span").html(Uploader.list.length);
									}
									else
									//обработчик страницы комментов
									if(getCurrentPage()=="page_comment"){
										Fotos.init();
										$("#page_fotos .navbar-public").css({display : "none"});
										$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersfotos"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_usersfotos?user_id="+User.I.id} );
									}
									else
									if(getCurrentPage()=="page_usersfotos"){
										var found_i=-1;
										removeEffect1($("#page_usersfotos .num_"+params.track_num));
										found_i=Fotos.Utils.get_list_index(params.track_num);
										if(found_i>=0)
											Fotos.list.splice(found_i,1);
										Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
									}
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
			refresh_del_mode : function(){
				if(Fotos.delete_mode == 1){
					$("#page_usersfotos_list .btn-delete").css({display: "block"});
					$("#page_usersfotos .topheader .btn-delete").css({display: "inline-block"});
					$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-trash-o");
					$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-check");
					$("#page_usersfotos .topheader .btn-delete i").addClass("fa-check");					
				}
				else{
					if(Fotos.active_user.id == User.I.id){
						$("#page_usersfotos_list .btn-delete").css({display: "none"});
						$("#page_usersfotos .topheader .btn-delete").css({display: "inline-block"});
						$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-trash-o");
						$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-check");
						$("#page_usersfotos .topheader .btn-delete i").addClass("fa-trash-o");
					}
					else{
						$("#page_usersfotos_list .btn-delete").css({display: "none"});
						$("#page_usersfotos .topheader .btn-delete").css({display: "none"});
						$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-trash-o");
						$("#page_usersfotos .topheader .btn-delete i").removeClass("fa-check");
						$("#page_usersfotos .topheader .btn-delete i").addClass("fa-trash-o");
					}					
				}
			}
			
		},
		Utils :{
			ajax_overlay : function(action){
				if(action == "enable"){
					//$('div.foto').fadeTo('normal',0.5); --тормозит на мобильниках
					$('div.foto').append('<div class="ajax-overlay"></div>');
				}
				else
				if(action == "disable"){
					//$('div.foto').fadeTo('fast',1);
					$('div.foto .ajax-overlay').remove();
				}
			},
			HandleAjax : function(action,settings){
				if (settings.url.indexOf("server/proc_fotos.php")>=0){
					if(action=="send"){
						Fotos.Utils.ajax_overlay('enable');
					}
					else
					if(action=="stop"){
						Fotos.Utils.ajax_overlay('disable');
					}
				}
			},
			foto_url : function(foto_obj, size){
				var path;
				if(foto_obj.private_foto==1)
					path = LLocal("users_fotos/");
				else
					path = LLocal("fotos/");
				if(size == 800)
					path = path + foto_obj.path;
				else
				if(size == 150)
					path = path +"/small/"+ foto_obj.path;
				
				return path;
					
			},
			display_found_number : function(total, divtag){
				if(total>0){
					$(divtag+" .found_number").html(NumSklon(total, ['Найдена', 'Найдены', 'Найдено'])+" "+total+" "+NumSklon(total, ['фотография', 'фотографии', 'фотографий']));
				}
				else
					$(divtag+" .found_number").html("Не найдено ни одной фотографии");
			},
			get_list_index: function(num){
				var found_i=-1;
				$.each(Fotos.list, function(key, obj){
					if(obj.num==num){
						found_i=key;
					}
				});
				return found_i
			}
		}
		
		
	});
	//UsersFotos
	UsersFotos = new Object({
		list : Object(),
		el_per_page : 16,
		loading_data : 0,
		total_all: 0,
		url_params : Object(),
		Go : function (){
			UsersFotos.init();
			UsersFotos.Load({
				user_id : $(this).attr("user_id"),
				method :"getUserFotos",
				el_per_page: Fotos.el_per_page,
				last : 0,
				initial: 1
				});
			//передаем параметры загрузки в глобал
			UsersFotos.url_params = {
				user_id : $(this).attr("user_id"),
				method :"getUserFotos",
				last : 0,
				el_per_page: Fotos.el_per_page
			}
		},
		GoAppend : function(){
			var params=Fotos.url_params;
			if(UsersFotos.list.length<UsersFotos.total_all){
				params.last=UsersFotos.list.length;
				params.initial=0;
				UsersFotos.Load(params);
			}
		},
		Load : function(params){
			UsersFotos.loading_data=1;
			$.get( LS("server/proc_fotos.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							UsersFotos.total_all=data.fotos.total_all;
							//если загрузка инициализирующая
							if(params.initial==1){
								//дополняем список фоток
								UsersFotos.list=data.fotos.fotos;
								UsersFotos.Display(data, params);
								console.log("Load initial fotos");
							}
							//если догрузка фоток
							else{
								if(data.fotos.fotos.length>0){
									UsersFotos.list=Fotos.list.concat(data.fotos.fotos);
									UsersFotos.Append(data, params);
									console.log("Load appended fotos");
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
					UsersFotos.loading_data=0;
				},
				"json"
			);
		},
		//первая отрисовка страницы фоток
		Display: function(resp_obj, params){ 
			var html="";
			//если личные фотографии
			if(params.method=="getUserFotos"){
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						html+= "<div class='foto'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a></div>";
						i++;
					});
					$("#page_usersfotos_list").html(html);
					//применяем Swipe
					Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
				}
				
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_usersfotos"), { transition: "none", allowSamePageTransition: true} );
				$.mobile.silentScroll(0);
				console.log(resp_obj);
				
			}
		},
		//Догрузка фоток
		Append: function(resp_obj, params){ 
			var html="";
			//если личные фотографии
			if(params.method=="getUserFotos"){
				if(resp_obj.fotos.total>0){
					var i=0;
					$.each(resp_obj.fotos.fotos, function(key,obj){
						html+= "<div class='foto'><a href='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(resp_obj.fotos.fotos[i].path, resp_obj.fotos.fotos[i].private_foto, "small")+"'></a></div>";
						i++;
					});
					$("#page_usersfotos_list").append(html);
					//если PS открыт, то закрываем, обновляем и открываем
					if(Fotos.PS.isShown==1){
						photoSwipeInstance.hide();
						Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
						photoSwipeInstance.show(Fotos.PS.cursor);
					}
					else{
						Fotos.PS.ReCreate($("#page_usersfotos_list .foto a"));
					}
				}
				
				console.log("appended new fotos"+JSON.stringify(resp_obj));
			}
		},
		PS : {
			cursor: 0,
			isShown: 0,
			OnDisplay : function(e){
				if((e.index==(Fotos.list.length-3)) && e.action=="next"){
					Fotos.GoAppend();
				}
				Fotos.PS.cursor=e.index;
			},
			onShow : function(e){
				Fotos.PS.isShown=1;
			},
			onHide : function(e){
				Fotos.PS.isShown=0;
			},
			ReCreate : function(){
				if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) {
					window.Code.PhotoSwipe.detatch(photoSwipeInstance);
				}
				photoSwipeInstance = $("#page_fotos_list .foto a").photoSwipe({zIndex: 99, loop: false});
				//обработчик показа изображения
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onDisplayImage, Fotos.PS.OnDisplay);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onShow, Fotos.PS.onShow);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onHide, Fotos.PS.onHide);
			}
		},
		init : function(){
			Fotos.PS.cursor=0;
			Fotos.PS.isShown=0;
			Fotos.list = new Object();
			Fotos.el_per_page = 16;
			Fotos.loading_data =0;
			Fotos.total_all = 0;
			Fotos.url_params = new Object();
			
		}
	});
PS = new Object ({
		list : Object(),
		GoAppend_f : Object(),
		cursor: 0,
		mode: 0,
		isShown: 0,
		OnDisplay : function(e){
			/* здесь должна быть функция call-back для подгрузки нового контента. Надо подумать как передать ее в качестве параметра 
			if((e.index==(PS.list.length-3)) && e.action=="next" && PS.GoAppend_f!=null){
				PS.GoAppend_f();
			}
			*/
			//если мы в режиме подгрузки данных, и данных нет, то обновляем
			if(PS.mode == "ajax" && PS.list[e.index].user==null){
				PS.refreshFromServer(e.index);
			}
			else
			//если мы в режиме подгрузки данных, и данных нет, то обновляем
			if(PS.mode == ""){
				PS.refreshFromServer(e.index);
			}
			else{
				PS.cursor=e.index;
				PS.Toolbar.refresh(); 
				PS.Toolbar.refresh_caption();
			}
			//если доступ закрыт
			if(PS.list[e.index].lock == 1){
				$(".ps-carousel-item-"+[e.index]+" img").attr("src", "http://www.iconsearch.ru/uploads/icons/siena/128x128/lockblue.png");
				$(".ps-carousel-item-"+[e.index]+" img").css({width: "100px", height: "100px", top: "50%", left: "50%"});
			}
		},
		
		onShow : function(e){
			PS.isShown=1;
		},
		onHide : function(e){
			PS.isShown=0;
		},
		Toolbar :{
			get : function(){ 
				var html;
				var css_visibility_arrows="";
				if(PS.list.length==1)
					css_visibility_arrows="visibility: hidden;";

				html='<div class="ps-toolbar-close ps-btn-close" ><i class="fa fa-times fa-lg fa-button-theme-a"></i></div>';
				html+='<div class="ps-toolbar-previous ps-btn-back" style="'+css_visibility_arrows+'"><i class="fa fa-chevron-left fa-lg fa-button-theme-a"></i></div>';
				html+='<div class="ps-btn-like" base="" t_key="" ><i class="fa fa-heart-o fa-lg fa-button-theme-a"></i><span></span></div>'; 
				html+='<div class="ps-btn-comments" ><i class="fa fa-comment-o fa-lg fa-button-theme-a"></i><span></span></div>'; 
				html+='<div class="ps-toolbar-next ps-btn-forward" style="'+css_visibility_arrows+'"><i class="fa fa-chevron-right fa-lg fa-button-theme-a"></i></div>';
				return html;
			},
			refresh : function(){
				var base = PS.list[PS.cursor].base;
				//сколько комментов
				if(PS.list[PS.cursor].source.comments>0){
					$(".ps-btn-comments span").html(PS.list[PS.cursor].source.comments); 
				}
				else{
					$(".ps-btn-comments span").html(""); 
				}
				//сколько лайков
				if(PS.list[PS.cursor].source.rating){
					$(".ps-btn-like span").html(PS.list[PS.cursor].source.rating);
					if(PS.list[PS.cursor].source.rating>0)
						$(".ps-btn-like span").css({color: "rgb(85, 212, 51)"});
					else
					if(PS.list[PS.cursor].source.rating<0)
						$(".ps-btn-like span").css({color: "rgb(229, 66, 38)"});
				}
				else{
					$(".ps-btn-like span").html("");
				}
				//добавляем атрибуты к ссылке
				$(".ps-btn-like").attr("t_key", PS.list[PS.cursor].source.num);//like
				$(".ps-btn-like").attr("base", base);
				$(".ps-btn-comments").attr("t_key", PS.list[PS.cursor].source.num);//comment
				$(".ps-btn-comments").attr("base", base);
				
				
				//если фотка не из ресурсов
				if(PS.list[PS.cursor].base==-1 || PS.list[PS.cursor].t_key==-1){
					$(".ps-btn-like, .ps-btn-comments").css({visibility: "hidden"});
				}
				else{
					$(".ps-btn-like, .ps-btn-comments").css({visibility: "visible"});
				}
				
				if(PS.list[PS.cursor].voted!=null){
					$(".ps-btn-like i").removeClass("fa-heart-o");
					$(".ps-btn-like i").addClass("fa-heart");
				}
				else{
					$(".ps-btn-like i").removeClass("fa-heart"); 
					$(".ps-btn-like i").addClass("fa-heart-o");
				}
				//краяние фотки в очереди
				if(PS.cursor==0)
					$(".ps-toolbar-previous").css({visibility: "hidden"});
				else
					$(".ps-toolbar-previous").css({visibility: "visible"});
				if(PS.cursor==(PS.list.length-1))
					$(".ps-toolbar-next").css({visibility: "hidden"});
				else
					$(".ps-toolbar-next").css({visibility: "visible"});
				
			},
			refresh_caption : function(){
				var html;
				var user = PS.list[PS.cursor].user; 
				//если данные есть, то обновляем заголовок
				if(user!=null){
					html='<div class="avatar" user_id="'+user.id+'"><img src="'+User.html.avatar_url(user.foto,40)+'" class="userlist_afoto user-avatar-rounded"></div>';
					html+='<div class="name" user_id="'+user.id+'">'+User.html.online_status(user, "tiny")+" "+ User.html.gender(user)+ " " + user.name+'<br><span>'+PS.list[PS.cursor].source.title+'</span></div>';
					$(".ps-caption-content").html(html);
					//обработчики кликов
					//на страницу пользователя
					$(".ps-caption-content .avatar, .ps-caption-content .name").off("click");
					$(".ps-caption-content .avatar, .ps-caption-content .name").on("click", PS.Toolbar.Handler.GoUser);
					//Лайк
					$(".ps-btn-like").off("vclick");
					$(".ps-btn-like").on("vclick", PS.Toolbar.Handler.Like);
					//комментарии 
					$(".ps-btn-comments").off("vclick");
					$(".ps-btn-comments").on("vclick", PS.Toolbar.Handler.Comment);
				}
				else{
					$(".ps-caption-content").html("");
				}
			},
			Handler : { 
				Like : function(ev){
					if(PS.isShown && PS.list[PS.cursor].voted==null ){
						rotateEffect1($(this));
						var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: "plus", method: "putMark", cursor: PS.cursor};
						$.get( LS("server/proc_votes.php"), params, 
							function( data ) {
								console.log(data);
								if(data.auth_status=="success" ){
									if(data.method_status=="success"){
										//обновляем туллбар к фотке по которой пришел ответ
										PS.list[params.cursor].source.rating=data.vote.rating;
										PS.list[params.cursor].voted=1; //метим что оценка проставлена
										PS.Toolbar.refresh();			
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
				Comment : function(ev){
					ev.preventDefault();
					var base=$(this).attr("base");
					var t_key=$(this).attr("t_key");
					//если переход из PS то сначала закрываем его
					if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
						if(PS.isShown){
							photoSwipeInstance.hide(true);
						}
					}
					$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_comment"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_comment?base="+base+"&t_key="+t_key} );
				},
				GoUser : function(ev){
					ev.preventDefault();
					var user_id=$(this).attr("user_id");
					//если переход из PS то сначала закрываем его
					if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
						if(PS.isShown){
							photoSwipeInstance.hide(true);
						}
					}
					$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_user"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_user?user_id="+user_id} );
				}
			}
		},
		//обновляет данные по слайду текущему слайду
		refreshFromServer : function(cursor){
			var base = PS.list[cursor].base;
			var t_key = PS.list[cursor].source.num;
			if(base!=-1 && t_key!=-1){
				$.get( LS("server/proc_source.php"), {method : "getSourceInfo", t_key: t_key, base: base}, 
					function( data ) {
						console.log(data);
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								//обновляем туллбар к фотке по которой пришел ответ
								PS.list[cursor]=data.element;	
								PS.cursor=cursor;
								PS.Toolbar.refresh(); 
								PS.Toolbar.refresh_caption();
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
			else{
				PS.cursor=cursor;
				PS.Toolbar.refresh(); 
				PS.Toolbar.refresh_caption();
			}
		},
		getFromServer : function(cursor){
			var base = PS.list[cursor].base;
			var t_key = PS.list[cursor].source.num;
			var data = JSON.parse(
				$.ajax({
					type: "GET",
					url: LS("server/proc_source.php"),
					data: {method : "getSourceInfo", t_key: t_key, base: base},
					async: false
				}).responseText
				);
			PS.list[cursor]=data;
			console.log(data);
		},
		ReCreate : function(dom_fotos,list_obj, mode){
			
			PS.isShown=0;
			PS.cursor=0;
			PS.mode=mode;
			if(list_obj == null){
				PS.list = new Array();
				$.each(dom_fotos, function(key,obj){
					PS.list.push({
						num : $(obj).attr("t_key"), 
						base: $(obj).attr("base"), 
						source : { num: $(obj).attr("t_key")} 
					});
				});
			}
			else{
				PS.list = list_obj;
			}
			if(dom_fotos.length==0){
				return false;
			}
			else{
				if (typeof photoSwipeInstance != "undefined" && photoSwipeInstance != null) { 
					window.Code.PhotoSwipe.detatch(photoSwipeInstance);
				}
				photoSwipeInstance = dom_fotos.photoSwipe({zIndex: 2, 
					loop: false, 
					getToolbar: PS.Toolbar.get, 
					captionAndToolbarAutoHideDelay: 100000,
					fadeInSpeed: 0,
					fadeOutSpeed: 0});
				//обработчик показа изображения
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onDisplayImage, PS.OnDisplay);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onShow, PS.onShow);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onHide, PS.onHide);
				photoSwipeInstance.addEventHandler(window.Code.PhotoSwipe.EventTypes.onCaptionAndToolbarShow, PS.Toolbar.refresh_caption);
			}			
		}
	});
