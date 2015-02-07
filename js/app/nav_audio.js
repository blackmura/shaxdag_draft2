Music = new Object({
		list : Object(),
		active_user : Object(),
		el_per_page : 12,
		loading_data : 0,
		total_all: 0,
		url_params : Object(),
		sm2_curr_id: 0,
		init : function(){
			Music.list = new Array();
			Music.el_per_page = 12;
			Music.loading_data =0;
			Music.total_all = 0;
			Music.url_params = new Object();
			Music.Filter = Music.constructFilter();
			
		},
		constructFilter : function(){
			return {
				searchterm: null,
				nation_id: null,
				order: null,
				user_id: null
			}
		},
		Go :function(){
			var user_id = $(this).attr("user_id");
			if(user_id){
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_music"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_music?user_id="+user_id} )
			}
			else{
				if(User.I.nation_id>0)
					var Dataurl = "page_music?nation_id="+User.I.nation_id;
				else
					Dataurl = "page_music";
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_music"), { transition: "none", allowSamePageTransition: true, dataUrl: Dataurl});
			}
		},
		GoAll : function (filter, init, share){
			var params;			
			if(init==1){
				//если не в режиме share то обнуляем объекты
				if(!share || Exch.to.type==null){					
					Exch.init();
				}
				Music.init();				
				if(filter==null || filter.user_id==null){
					//показываем навбар
					$("#page_music .navbar-public").css({display : "block"});
					Environment.Utils.refresh_public_navbar("#page_music .navbar-public", "btn-music");
				}
				else
				if(filter!=null || filter.user_id!=null){
					$("#page_music .navbar-public").css({display : "none"});
				}
				$("#page_music_list").html("");
				
				Music.link.SearchForm.hide();
			}
			
			$.mobile.silentScroll(0);
			//устанавливаем фильтры
			if(filter!=null){
				Music.Filter=$.extend(Music.Filter, filter);
			}
			Music.link.refresh_navbar();
			//задаем параметры запроса
			params=Music.Filter; 
			params.initial=1;
			params.el_per_page=Music.el_per_page;
			params.method="getMusic";
			params.last=0;
			Music.Load(params);
		},
		GoCache : function(ev){
			ev.preventDefault();
			var mode = $(this).attr("mode");
			if(mode == "my"){
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_music"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_music?user_id="+User.I.id} );
				$(this).attr("mode", "cache");
			}
			else{
				$(this).attr("mode", "my");
				app.Cache.Music.loadDB();
			}
		},
		Load : function(params){
			Music.loading_data=1;
			$.get( LS("server/proc_music.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							Music.url_params=params;
							Music.total_all=data.total_all;
							//если загрузка инициализирующая
							if(params.initial==1){
								//дополняем список песен
								Music.list=data.musics;
								if(params.user_id)
									Music.active_user = data.user;
								Music.Display(data, params);
								console.log("Load initial Music");
							}
							//если догрузка песен
							else{
								if(data.musics.length>0){
									Music.list=Music.list.concat(data.musics);
									Music.Display(data, params);
									console.log("Load appended Music");
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
					Music.loading_data=0;
				},
				"json"
			);
		},
		GoAppend : function(){
			var params=Music.url_params;
			if(Music.list.length<Music.total_all){
				params.last=Music.list.length;
				params.initial=0;
				Music.Load(params, 0);
			}
		},
		
		Display: function(resp_obj, params){ 
			var html="";
			var html_menu="";
			var i=0;
			var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
			$.each(resp_obj.musics, function(key,obj){
				html+= "<div class='song-item mus_"+resp_obj.musics[i].num+"'><div class='ui360'><a href='"+Music.Utils.full_url(resp_obj.musics[i].path)+"'>"+resp_obj.musics[i].artist+" "+resp_obj.musics[i].title+"</a></div></div>";
				i++;
			});
			 
			if(params.initial == 1){
				$("#page_music_list").html(html);
				$.mobile.silentScroll(0);
				//облако в правом верхнем углу
				$("#page_music .topheader .btn-cache").css({display: "none"});
				//меняем заголовок
				if(params.user_id!=null){
					//если моя музыка
					if(params.user_id == User.I.id){
						if(params.cache==1){
							$("#page_music .topheader h1").html("Мой кэш");
							//если моих песен нет, то пишем подсказку
							if(resp_obj.total_all==0)
								$("#page_music_list").html("<div class='no-data-info'><p>Здесь будут отображаться песни, которые вы добавите в кэш своего устройства. Это позволит слушать песни своего народа даже если нет соединения с интернетом!<br>Для добавления песни в кэш, нажмите на значок <i class='fa fa-cloud-download' style='color:#ccc;'></i> рядом с песней.</p></div>");
							//облако в правом верхнем углу
							if(GLOBAL_APP_VERS.type == "app_mobile"){
								$("#page_music .topheader .btn-cache").css({display: "block"});
								$("#page_music .topheader .btn-cache i").addClass("fa-button-active");
							}
						}
						else{
							$("#page_music .topheader h1").html("Моя музыка");
							//если моих песен нет, то пишем подсказку
							if(resp_obj.total_all==0)
								$("#page_music_list").html("<div class='no-data-info'><p>Здесь будут отображаться песни, которые вы добавите в свой список</p><p>Все доступные песни можно найти на Главной станице в разделе Музыка</p></div>");
							//облако в правом верхнем углу
							if(GLOBAL_APP_VERS.type == "app_mobile"){
								$("#page_music .topheader .btn-cache").css({display: "block"});
								$("#page_music .topheader .btn-cache i").removeClass("fa-button-active");
								$("#page_music .topheader .btn-cache").attr("mode", "cache");
							}
						}
						
					}
					else{
						$("#page_music .topheader h1").html(User.html.online_status(resp_obj.user,"tiny")+ " "+resp_obj.user.name);
						$("#page_music .topheader h1").attr("user_id", resp_obj.user.id);
						
					}
				}
				else{
					$("#page_music .topheader h1").html("Музыка");
				}
				//сколько песен найдено
				Music.Utils.display_found_number(resp_obj.total_all);
				
			}
			else{
				$("#page_music_list").append(html);
			}
			threeSixtyPlayer.config.playNext=true;
			threeSixtyPlayer.init();
			//добавляем режим flex
			$.each(resp_obj.musics, function(key,obj){

				$("#"+page_id+" .mus_"+ obj.num).append('<div class="song_title" base="music" t_key="'+obj.num+'" param1 = "'+obj.artist+' - '+obj.title+'"><div class="title" base="music" t_key="'+obj.num+'">'+obj.artist+' - '+obj.title+'</div></div>');
				$("#"+page_id+" .mus_"+ obj.num).append('<div class="btn-add" base="music" t_key="'+obj.num+'" param1 = "'+obj.artist+' - '+obj.title+'"></div>');
				
				//добавляем кнопки снизу
				html_menu="";
				html_menu+='<div class="nation">'+Environment.Nations.modify(Environment.Nations.nation_by_id(obj.lang).title, "ая")+'</div>';
				html_menu+="<div class='options'>";				
				html_menu+='<a base="music" t_key="'+obj.num+'" mark="plus" class="ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-thumbs-o-up ui-btn-icon-notext btn-like" >Нравится</a>';
				html_menu+='<a base="music" t_key="'+obj.num+'" mark="minus"  class="ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-thumbs-o-down ui-btn-icon-notext btn-unlike" >Не нравится</a>';
				html_menu+='<span base="music" t_key="'+obj.num+'" mark="plus" class="rating"></span><span base="music" t_key="'+obj.num+'"  class="btn-comments" ></span><span base="music" t_key="'+obj.num+'"  class="btn-cache" ></span>';				
				html_menu+="</div>";
				
				$("#"+page_id+" .mus_"+ obj.num+" .song_title").append(html_menu);				
				Music.link.refresh_like_menu(obj);
				//добавляем обработчики
				if(Exch.to.type == null){ // если это обычный режим
					$("#"+page_id+" .mus_"+ obj.num+" .btn-like, #"+page_id+" .mus_"+ obj.num+" .btn-unlike").on ("vclick", Music.link.Like);
					$("#"+page_id+" .mus_"+ obj.num+" .btn-comments").on ("vclick", Comments.Go);
					$("#"+page_id+" .mus_"+ obj.num+" .rating").on ("vclick", Music.link.Like);
					$("#"+page_id+" .mus_"+ obj.num+" .btn-add").on ("vclick", Music.link.add);
					$("#"+page_id+" .mus_"+ obj.num+" .title").on ("vclick", Comments.Go);
				}
				else{
					$("#"+page_id+" .mus_"+ obj.num+" .song_title, #"+page_id+" .mus_"+ obj.num+" .btn-add").on ("vclick", Exch.onChoose);
				}
			});
			//включаем кеш
			if(GLOBAL_APP_VERS.type == "app_mobile" && app.is_ready == 1){
				app.Cache.Music.apply_cache(resp_obj.musics); 
			}
		},
		Single :{
			insert : function(container_id, obj){
				var html ="";
				var title;				
				var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				if(obj.artist && obj.title)
					title = obj.artist +" - "+ obj.title;
				else
				if(obj.artist)
					title = obj.artist;
				else
					title = obj.title;
				Music.list.push(obj);
				html+= "<div class='song-item mus_"+obj.num+"'><div class='ui360'><a href='"+Music.Utils.full_url(obj.path)+"'>"+title+"</a></div></div>";
				$("#"+container_id).html(html);
				threeSixtyPlayer.config.playNext=false;
				threeSixtyPlayer.init();
				$("#"+container_id+" .mus_"+ obj.num).append('<div class="song_title"><div class="title" base="music" t_key="'+obj.num+'">'+title+'</div></div>');
				$("#"+container_id+" .mus_"+ obj.num).append('<div class="btn-add" base="music" t_key="'+obj.num+'"></div>');	
				//добавляем кнопки снизу				
				Music.link.refresh_like_menu(obj);				
				$("#"+container_id+" .mus_"+ obj.num+" .btn-add").on ("vclick", Music.link.add);
				//включаем кеш
				if(GLOBAL_APP_VERS.type == "app_mobile" && app.is_ready == 1){
					app.Cache.Music.apply_cache(obj);
				}
				
			}
		},
		Utils : {
			get_obj_index: function(objs, num){
				var found_i=-1;
				var i=0;
				$.each(objs, function(key, obj){
					//если входящее сообщение из существующего списка то обновляем счетчик
					if(obj.num==num){
						found_i=i;
					}
					i++;
				});
				return found_i
			},
			display_found_number : function(total){
				if(total>0){
					$("#page_music .found_number").html(NumSklon(total, ['Найдена', 'Найдены', 'Найдено'])+" "+total+" "+NumSklon(total, ['песня', 'песни', 'песен']));
				}
				else
					$("#page_music .found_number").html("Не найдено ни одной песни");
			},
			full_url : function(path){
				return 'http://media.shaxdag.com/Music/'+path;
			}
		},
		link : {
			refresh_nation_footer : function(){
				
				$("#page_music_nation_popup").html("<option value=0>Все народы</option>"+Environment.Nations.nations_selectmenu()+"<option value=100>Не тематическая</option>");
				$("#page_music_nation_popup").change (Music.link.btn_nations_onClick);
			},
			refresh_navbar : function(){
				if(Exch.to.type!=null){ //если в режиме share, то скрываем нижний навбар и показываем меню принять-отклонить
					$("#page_music_navbar").hide();
					$(".share-panel").show();
				}
				else{
					$(".share-panel").hide();
					var dom_sort=$("#page_music_navbar .navbar_footer_sort");
					var dom_nation=$("#page_music_navbar .navbar_footer_nation");
					var dom_nation_title=$("#page_music_navbar .navbar_footer_nation span");
					var dom_search=$("#page_music_navbar .navbar_footer_search");
					
					if(Music.Filter.order>0){
						dom_sort.addClass("ui-btn-active"); 

					}
					else{
						dom_sort.removeClass("ui-btn-active");

					}
									
					//подсветка меню наций
					if(Music.Filter.nation_id!=null){
						dom_nation.addClass("ui-btn-active"); 
						dom_nation_title.html(Environment.Nations.modify(Environment.Nations.nation_by_id(Music.Filter.nation_id).title, "ие"));

					}
					else{
						dom_nation.removeClass("ui-btn-active");
						dom_nation_title.html("Народы");

					}
					
					//подсветка меню поиска
					if(Music.Filter.searchterm!=null){
						dom_search.addClass("ui-btn-active"); 

					}
					else{
						dom_search.removeClass("ui-btn-active");

					}
					//настраиваем панель поиска
					$("#page_music .ui-footer .searchform").css({display: "none"});
					$("#page_music_navbar").css({display: "block"});
				}
				
			},
			btn_nations_onClick : function(ev){ 
				
				var ExtendFilter = new Object();
				var nation_id = $(this).val();
				if(nation_id>0){
					ExtendFilter={nation_id: nation_id};
				}
				else{
					ExtendFilter={nation_id: null};
				}
				Music.GoAll(ExtendFilter, 0);
				
				setTimeout(Music.link.refresh_navbar,100);
				
			},
			btn_sort_onClick : function(ev){ 
				ev.preventDefault();	
				$("#page_music_sort_popup").popup("close");
				var ExtendFilter = new Object();
				if($(this).attr("sort_id")){
					ExtendFilter={order: $(this).attr("sort_id")};
				}
				else{
					ExtendFilter={order: null};
				}
				Music.GoAll(ExtendFilter, 0);
				setTimeout(Music.link.refresh_navbar,100);				
			},
			btn_search_onClick : function(ev){ 
				ev.preventDefault();	
				Music.link.SearchForm.show(ev);		
			},
			refresh_like_menu : function(obj){
				var vote_html="";
				var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				//если мы на странице все музыки, то обновляем нижнее меню с рейтингом и комментариями
				
				if($(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id")=="page_music"){
					//сколько лайков
					if(obj.rating){
						if(obj.voted==1)
							vote_html = '<i class="fa fa-heart"></i>: ' + obj.rating;
						else
							vote_html = '<i class="fa fa-heart-o"></i>: ' + obj.rating;
						$("#"+page_id+" .mus_"+ obj.num+" .song_title span.rating").html(vote_html);
					}
					else
						$("#"+page_id+" .mus_"+ obj.num+" .song_title span.rating").html('<i class="fa fa-heart-o"></i>: 0');
					//сколько комментов
					if(obj.comments>0){
						$("#"+page_id+" .mus_"+ obj.num+" .song_title .btn-comments").html('<i class="fa fa-comment"></i>: ' + obj.comments); 
					}
					else
						$("#"+page_id+" .mus_"+ obj.num+" .song_title .btn-comments").html('<i class="fa fa-comment-o"></i>: 0');
					//если проголосовали
					if(obj.voted>0){
						$("#"+page_id+" .mus_"+ obj.num+" .btn-like, #mus_"+ obj.num+" .song_title .btn-unlike").css({visibility: "hidden"});
						$("#"+page_id+" .mus_"+ obj.num+" .btn-like, #mus_"+ obj.num+" .song_title .btn-unlike").off ("vclick");
					}
				}
				
				//колонка с плюсиком/минусом
				if(Exch.to.type!=null){
					if(Exch.Utils.check_exist(obj.num, "music")>=0){//если ресурс уже в стеке
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").html('<i class="fa fa-check fa-button-active" style="font-size: 2em;"></i>'); 
					}
					else{
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").html('<i class="fa fa-plus fa-button-theme-a" style="font-size: 1.6em;"></i>'); 
					}
				}
				else{ //если мы не в режиме отправки ресурса в сообщении
					//если добавлен в мои записи
					if(obj.added>0){
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").html('<i class="fa fa-minus fa-button-circle fa-button-theme-a"></i>'); 
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").attr('method', 'delete');
					}
					else{ 
						// круглый плюс $("#mus_"+ obj.num+" .btn-add").html('<a href="#" class="ui-btn ui-icon-plus ui-btn-icon-notext ui-corner-all ui-mini">Добавить</a>');
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").html('<i class="fa fa-plus fa-button-circle fa-button-theme-a"></i>'); 
						$("#"+page_id+" .mus_"+ obj.num+" .btn-add").attr('method', 'add');
					}	
				}				
			},
			SearchForm: {
				show : function(ev){
					ev.preventDefault();
					//настраиваем панель поиска
					$("#page_music .searchform .input-search").css({width: document.documentElement.scrollWidth-160})
					$("#page_music .ui-footer .searchform").css({display: "block"});
					$("#page_music_navbar").css({display: "none"});
					if(Music.Filter.searchterm){
						$("#page_music .searchform .input-search").val(Music.Filter.searchterm);
					}
					else
						$("#page_music .searchform .input-search").val("");
					$("#page_music .searchform .input-search").focus();
				},
				hide : function(ev){
					if(ev)
						ev.preventDefault();
					$("#page_music .ui-footer .searchform").css({display: "none"});
					$("#page_music_navbar").css({display: "block"});
				},
				search : function(ev){
					ev.preventDefault();	
					var ExtendFilter = new Object();
					var searchterm = $("#page_music .searchform .input-search").val();
					$("#page_music .ui-footer .searchform").css({display: "none"});
					if(searchterm){
						ExtendFilter={searchterm: searchterm};
					}
					else{
						ExtendFilter={searchterm: null};
					}
					Music.GoAll(ExtendFilter, 0);
					$("#page_music .searchform .input-search").blur();
					setTimeout(Music.link.refresh_navbar,100);		
					
				}
			},
			Like : function(ev){
				ev.preventDefault();
				var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: $(this).attr("mark"), method: "putMark"};
				rotateEffect1($("#"+page_id+" .mus_"+ params.t_key+" .rating i"));
				$.get( LS("server/proc_votes.php"), params, 
					function( data ) {
						console.log(data);
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								//Обновляем  оценки
								var found_i = Music.Utils.get_obj_index(Music.list, params.t_key);
								if(found_i>=0){
									Music.list[found_i].rating = data.vote.rating;
									Music.list[found_i].voted = 1;
									Music.link.refresh_like_menu(Music.list[found_i]);									
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
				
			},
			add : function(ev){
				ev.preventDefault();
				var method = $(this).attr("method");
				var page_id = $(":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				var params= {base: $(this).attr("base"), num: $(this).attr("t_key"), s_base: "users", method: method};
				$.get( LS("server/proc_adddelete.php"), params, 
					function( data ) {
						console.log(data);
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								//Обновляем  оценки
								var found_i = Music.Utils.get_obj_index(Music.list, params.num);
								if(found_i>=0){
									if(params.method=="add")
										Music.list[found_i].added = 1;
									else
										Music.list[found_i].added = 0;
									$("#"+page_id+" .mus_"+ params.num+" .btn-add").velocity({rotateY : "180deg"});	
									Music.link.refresh_like_menu(Music.list[found_i]);
									$("#"+page_id+" .mus_"+ params.num+" .btn-add").velocity({rotateY : "0deg"});	
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
				
			},
			onPanelPlay : function(ev){
				ev.preventDefault();
				var act = $(this).attr("act");
				if(act == "play"){
					soundManager.play(Music.sm2_curr_id);
					$(this).attr("act", "pause");
				}
				else{
					soundManager.pause(Music.sm2_curr_id)
					$(this).attr("act", "play");
				}
			}
			
		},
		onPlay : function(e){
			/*if(GLOBAL_APP_VERS.type=="app_mobile" && Music.Filter.user_id == User.I.id){
				app.Cache.Music.onPlay(e.url);
			}*/
			Music.sm2_curr_id = e.id;
			$("#play_btn").parent().css({visibility: "visible"});
			$("#play_btn").parent().removeClass("ui-icon-play"); $("#play_btn").parent().addClass("ui-icon-pause");
			$("#play_btn").attr("act", "pause");
		},
		onStop : function(e){
			$("#play_btn").parent().css({visibility: "hidden"});
			$("#play_btn").attr("act", "play");
		},
		onPause : function(e){
			$("#play_btn").parent().css({visibility: "visible"});
			$("#play_btn").parent().removeClass("ui-icon-pause"); $("#play_btn").parent().addClass("ui-icon-play");
			$("#play_btn").attr("act", "play");
		},
		onResume : function(e){
			$("#play_btn").parent().css({visibility: "visible"});
			$("#play_btn").parent().removeClass("ui-icon-play"); $("#play_btn").parent().addClass("ui-icon-pause");
			$("#play_btn").attr("act", "pause");
		}
		
	});
	Audio_ = new Object({
		context :  Object(),
		buffer : {income_msg : null, outcome_msg : null,},	
		loadSoundFile : function(type, play) {
			var url="";
			//определяем url  к файлу
			if(type=="income_msg"){
				url="bin/msg_in.mp3";
			}else
			if(type=="outcome_msg"){
				url="bin/msg_out.mp3";
			}
			
			console.log(url);
		  // делаем XMLHttpRequest (AJAX) на сервер
		  var xhr = new XMLHttpRequest();
		  xhr.open('GET', url, true);
		  xhr.responseType = 'arraybuffer'; // важно
		  xhr.onload = function(e) {
			// декодируем бинарный ответ
			Audio_.context.decodeAudioData(this.response,
			function(decodedArrayBuffer) {
			  // получаем декодированный буфер
			  if(type=="income_msg"){
				Audio_.buffer.income_msg = decodedArrayBuffer;
			  }
			  else
			  if(type=="outcome_msg"){
				Audio_.buffer.outcome_msg = decodedArrayBuffer;
			  }
			  if(play){
				Audio_.play(type);
			  }
			}, function(e) {
			  console.log('Error decoding file', e);
			});
		  };
		  xhr.send();
		},
		play : function(type){
		  // создаем источник
		  var source = Audio_.context.createBufferSource();
		  // подключаем буфер к источнику
		   if(type=="income_msg"){
				source.buffer = Audio_.buffer.income_msg;
		  }
		  else
		  if(type=="outcome_msg"){
				source.buffer = Audio_.buffer.outcome_msg;
		  }
		  // дефолтный получатель звука
		  var destination = Audio_.context.destination;
		  // подключаем источник к получателю
		  source.connect(destination);
		  // воспроизводим
		  source.start(0);
		},
		init : function(){
			Audio_.context =  new window.AudioContext();
		},
		income_msg : {
			play : function(){
				if(GLOBAL_APP_VERS.type == "app_mobile"){
					var my_media = new Media(app.getPhoneGapPath()+"bin/msg_in.mp3");
					my_media.play();
				}
				else{
					if(Audio_.buffer.income_msg==null){
						Audio_.loadSoundFile("income_msg", 1);
					}
					else
						Audio_.play("income_msg");
				}
			}
		},
		outcome_msg : {
			play : function(){
				if(GLOBAL_APP_VERS.type == "app_mobile"){
					var my_media = new Media(app.getPhoneGapPath()+"bin/msg_out.mp3");
					my_media.play();
				}
				else{
					if(Audio_.buffer.outcome_msg==null){
						Audio_.loadSoundFile("outcome_msg", 1);
					}
					else
						Audio_.play("outcome_msg");
				}
			}
		},
		
		
	});
	