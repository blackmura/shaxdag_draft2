//События
	Evants =  new Object({
		list : Object(),
		ps_list : Array(),
		mus_list : Array(),
		el_per_page : 10,
		loading_data : 0,
		total_all: 0,
		url_params : Object(),
		new_ : Object(),
		init : function(){
			Evants.list = new Object();
			Evants.ps_list = new Array();
			Evants.mus_list = new Array();
			Evants.new_ = new Array();
			Evants.el_per_page = 10;
			Evants.loading_data =0;
			Evants.total_all = 0;
			Evants.url_params = {method: "getEvants", initial: 1, user_id: User.I.id, el_per_page: Evants.el_per_page, last: 0};
			Music.init();
			
		},
		//переходим на страницу с подгрузкой данных
		Go : function (){
			//если последнее полное обновление DOM было более 8 часов назад, то обновляем по жесткому
			if(Environment.System.last_hard_refresh < getUnixTime()-28800){
				Environment.UI.hard_refresh();
			}			
			else{
				Evants.init();
				$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_evants"), { transition: "none"} );			
				$("#page_evants .navbar-public").css({display : "block"});
				Environment.Utils.refresh_public_navbar("#page_evants .navbar-public", "btn-evants");
				Evants.Load(Evants.url_params);
			}
			
		},
		Load : function(params){ 
			Evants.loading_data=1;
			$.get( LS("refresh_ui.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							Evants.total_all=data.evants.total_all;
							//если загрузка инициализирующая
							if(params.initial==1){
								//рисуем страницу событий
								Evants.list=data.evants.evants;
								Evants.Display(data.evants, params);
							}
							//если догрузка событий
							else{
								if(data.evants.evants.length>0){
									Evants.list=Evants.list.concat(data.evants.evants);
									Evants.Display(data.evants, params);
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
					Evants.loading_data=0;
				},
				"json"
			);
		},
		SingleEvant : {
			html : function(evant_obj, line_num){
				var html="";
				var html_body="";
				var html_source="";
				var base="";
				var html_comments="";
				var html_footer="";
				var source_class_name="";
				var comment_obj =  new Object();
				if(evant_obj!=null){
					
					if(evant_obj.ntfy == 1)
						var bar_class_name = "ntfy";
					else
						var bar_class_name ="";
					html='<div class="ui-corner-all rounded-corners line_'+line_num+'" id="ev_'+evant_obj.num+'">'; 
					html+='<div class="ui-bar ui-bar-a '+bar_class_name+'">';
						html+='<h3 >';
							html+='<div user_id = "'+evant_obj.user.id+'"  class="user-foto user-go"><img src="'+User.html.avatar_url(evant_obj.user.foto,40)+'"  class="user-avatar-rounded"></div>';
							html+=' <div user_id = "'+evant_obj.user.id+'" class="user-name user-go">'+User.html.online_status(evant_obj.user, "tiny")+" "+ User.html.gender(evant_obj.user)+ ' '+evant_obj.user.name+'</div>';
							if(evant_obj.ntfy == 1){
								html+='<div class="ui-btn-right"><i ev_id="'+evant_obj.num+'" ev_source_type="'+evant_obj.source_type+'" ev_type="'+evant_obj.type+'" class="fa fa-times-circle-o  fa-lg fa-button-theme-a btn-close blink"></i></div>';
							}
							else{
								html+='<div class="ui-btn-right evant-time">'+how_long_time(timestamp2date(evant_obj.time)).day+'</div>';
							}
						html+='</h3>';
					html+='</div>';
					html+='<div class="ui-body ui-body-a"><p>';
					//если добавление фотографий
					if(evant_obj.type == 1 || evant_obj.type == 2){
						html_body+=User.html.translate(evant_obj.user, "ru", "Загрузил")+ " ";
						if(evant_obj.amount>0){
							html_body+= evant_obj.amount+" "+NumSklon(evant_obj.amount, ['новую фотографию', 'новые фотографии', 'новых фотографий']);
						}
						else
						html_body+= "новую фотографию";
					}
					//если добавление песен
					if(evant_obj.type == 3){
						html_body+=User.html.translate(evant_obj.user, "ru", "Загрузил")+ " ";
						if(evant_obj.amount>0){
							html_body+= evant_obj.amount+" "+NumSklon(evant_obj.amount, ['новую песню', 'новые песни', 'новых песен']);
						}
						else
						html_body+= "новую песню";
					}
					//если добавление песен в плей-лист
					if(evant_obj.type == 7){
						html_body+=User.html.translate(evant_obj.user, "ru", "Добавил")+ " ";
						if(evant_obj.amount>0){
							html_body+= evant_obj.amount+" "+NumSklon(evant_obj.amount, ['новую песню в свой плейлист', 'новые песни в свой плейлист', 'новых песен в свой плейлист']);
						}
						else
						html_body+= "новую песню в свой плейлист";
					}
					//если добавление видео
					if(evant_obj.type == 13){
						html_body+=User.html.translate(evant_obj.user, "ru", "Добавил")+ " ";
						if(evant_obj.amount>0){
							html_body+= evant_obj.amount+" "+NumSklon(evant_obj.amount, ['новую видеозапись', 'новые видеозаписи', 'новых видеозаписей']);
						}
						else
						html_body+= "новую видеозапись";
					}
					//если оценка 
					if(evant_obj.type == 6 || evant_obj.type == 8 || evant_obj.type == 9 || evant_obj.type == 10 ||(evant_obj.type == 600 || evant_obj.type == 800 || evant_obj.type == 900 || evant_obj.type == 1000)){
						html_body+=User.html.translate(evant_obj.user, "ru", "Оценил")+ " ";
						if(evant_obj.type>100){
							html_body+= "<b>Вашу</b> ";
						}
						switch(parseInt(evant_obj.type)){
							case 6: html_body+="фотографию "
							break;
							case 600: html_body+="фотографию "
							break;
							case 8: html_body+="фотографию "
							break;
							case 800: html_body+="фотографию "
							break;
							case 9: html_body+="песню "
							break;
							case 900: html_body+="песню "
							break;
							case 10: html_body+="видеозапись "
							break;
							case 1000: html_body+="видеозапись "
							break;
						}
						html_body+='на '+User.html.mark_icon(evant_obj.mark);

					}
					//если комментарий
					if(evant_obj.type == 15 || evant_obj.type == 1500){
						if(evant_obj.reply==1)
							html_body+="<b>"+User.html.translate(evant_obj.user, "ru", "Ответил")+ "</b> на Ваш комментарий к ";
						else{
							html_body+=User.html.translate(evant_obj.user, "ru", "Оставил")+ " ";
							if(evant_obj.amount>0){
								html_body+= evant_obj.amount+" "+NumSklon(evant_obj.amount, ['комментарий к ', 'комментария к ', 'комментариев к ']);
							}
							else
							html_body+= "комментарий к ";
						}
						if(evant_obj.type == 1500){
							html_body+= "<b>Вашей</b> ";
						}
						
						switch(evant_obj.source_type){
							case "fotos": html_body+="фотографии "
							break;
							case "music": html_body+="песне "
							break;
							case "clips": html_body+="видеозаписи "
							break;
						}
						html_comments += '<div class="talk-bubble another tri-right round left-in" >';
						html_comments+='		<div class="talktext">';
						html_comments+='			<p style="overflow: hidden;">'+ evant_obj.text +'</p>';
						html_comments+='		</div>';
						html_comments += '</div>';
						
						

					}
					//если новый друг
					if(evant_obj.type == 4){
						html_body+='Теперь дружит с '+User.html.online_status(evant_obj.source, "tiny")+" "+ User.html.gender(evant_obj.source)+ ' <b>'+evant_obj.source.name+'</b>';
					}
					//если поменял аватар
					if(evant_obj.type == 5){
						html_body+=User.html.translate(evant_obj.user, "ru", "Загрузил")+' новую аватарку';
					}
					//если получил подарок
					if(evant_obj.type == 14){
						html_body+=User.html.translate(evant_obj.user, "ru", "Получил")+' новый подарок!';
					}
					//-----------РЕСУРСЫ:
					//фотографии
					if(evant_obj.source_type == 'fotos'){
						if(evant_obj.source.private_foto==1)
							base="users_fotos";
						else
							base="fotos";
						if(evant_obj.source.path.indexOf("small/")==0)
							evant_obj.source.path=evant_obj.source.path.substr(6);
						//если можно перейти к комментариям, то делаем PS
						if(base && parseInt(evant_obj.source.id)){
							html_source+="<div class='comments_fotos' style='height:155px'  t_key='"+evant_obj.source.id+"' base='"+base+"'>";
							html_source+="<a href='"+User.html.fotos_url(evant_obj.source.path, evant_obj.source.private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(evant_obj.source.path, evant_obj.source.private_foto, "small")+"'></a>";
							//загоняем скелет списка для PS
							//if(Evants.Utils.get_source_index(evant_obj.source.id, base)==-1){
								Evants.ps_list.push({
								num : evant_obj.num, 
								base: base, 
								source : { num: evant_obj.source.id} 
								});
							//}							
						}
						//иначе нужно перейти к фотогалереи 
						else{
							html_source+="<div class='user-fotos' style='height:155px'  t_key='"+evant_obj.source.id+"' base='"+base+"'>";
							html_source+="<img src='"+User.html.fotos_url(evant_obj.source.path, evant_obj.source.private_foto, "small")+"'>";
						}
						html_source+="</div>";
					}
					//клипы
					if(evant_obj.source_type == 'clips'){
						base="clips";
						html_source+="<div class='comments_clips' style='height:155px'  t_key='"+evant_obj.source.id+"' base='clips'><img src='"+Video.Utils.shot(evant_obj.source.path,"small")+"'></div>";
					}
					//юзеры
					if(evant_obj.source_type == 'user'){
						html_source+='<div class="user-go" style="height:155px"  user_id="'+evant_obj.source.id+'"><img src="'+User.html.avatar_url(evant_obj.source.foto,150)+'" class="user-avatar-rounded"></div>';
					} 
					//музыка
					if(evant_obj.source_type == 'music'){
						base="music";
						//если есть все данные для проигрывания музыки
						if(evant_obj.source.id && evant_obj.source.path){
							Evants.mus_list.push({num: evant_obj.source.id, artist : evant_obj.source.artist, title : null, path : evant_obj.source.path, ev_id : evant_obj.num});
						}
						html_source+="<div class='comments_music'  t_key='"+evant_obj.source.id+"' base='music'>"+evant_obj.source.artist+"</div>";
					} 
					//подарки
					if(evant_obj.source_type == 'gift'){
						html_source+="<div class='gifts-go' style='height:155px' user_id='"+evant_obj.source.id+"'><img src='"+User.html.gift_url(evant_obj.source.path)+"'></div>";
					} 
					
					//футер с кнопками 
					if(base && parseInt(evant_obj.source.id)){
						html_footer+='<div data-role="navbar"  class="footer" data-iconpos="left">';
						html_footer+='	<ul>';
						html_footer+='		<li class="btn-like" ev_id="'+evant_obj.num+'" base="'+base+'" t_key="'+evant_obj.source.id+'" mark="plus"><a href="#" data-icon="thumbs-o-up"  >Нравится</a></li>';
						html_footer+='		<li class="btn-unlike" ev_id="'+evant_obj.num+'" base="'+base+'" t_key="'+evant_obj.source.id+'" mark="minus"><a href="#" data-icon="thumbs-o-down"  >Не нравится</a></li>';
						html_footer+='		<li class="btn-comments" ev_id="'+evant_obj.num+'" base="'+base+'" t_key="'+evant_obj.source.id+'"><a href="#" data-icon="comment-o"  >Комментарии</a></li>';
						html_footer+='	</ul>';
						html_footer+='</div>';
					}
					
					html+=html_body;
					html+=html_source;
					if(html_comments)
						html+=html_comments;
					html+=html_footer;
					html+='</p></div>';
					html+='</div>';
				}
				return html;
			}
		},
		//функция первой отрисовки 
		Display: function(data, params){  
			var html="";
			var line_num;
			if(data.total_all>0 && Array.isArray(Evants.list) && Array.isArray(data.evants) ){
				var i=0;
				var line1 = ((Evants.list.length - data.evants.length) - (Evants.list.length - data.evants.length)%2)/2;
				$.each(data.evants, function(key,obj){
					line_num = line1+(key - key % 2) / 2;
					html+= Evants.SingleEvant.html(obj, line_num);					
				});
				if(params.initial==1){
					$("#page_evants_list").html(html);
					$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_evants"), { transition: "none"} );
					$.mobile.silentScroll(0);
				}
				else{
					$("#page_evants_list").append(html);
				}				
			}
			else{
				if(params.initial==1){
					$("#page_evants_list").html("<div class='no-data-info'>Здесь будут отображаться Ваши новости</div>");
					$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_evants"), { transition: "none"} );
					$.mobile.silentScroll(0);
				}
			}
			
				
				
			//добавляем PS к фотографиям
			PS.ReCreate($("#page_evants_list .comments_fotos a"), Evants.ps_list, "ajax");
			//клик на видео
			$("#page_evants_list .comments_clips").off("vclick");
			$("#page_evants_list .comments_clips").on("vclick",Comments.Go);
			//на страницу пользователя
			$("#page_evants_list .user-go").off("vclick");
			$("#page_evants_list .user-go").on("vclick",UserPage.Go);
			//навбар
			$("#page_evants_list .footer").navbar();
			$("#page_evants_list .footer .btn-like, #page_evants_list .footer .btn-unlike").off("vclick");
			$("#page_evants_list .footer .btn-like, #page_evants_list .footer .btn-unlike").on("vclick",Evants.Like);
			$("#page_evants_list .footer .btn-comments").off("vclick");
			$("#page_evants_list .footer .btn-comments").on("vclick",Comments.Go);
			
			//смайлики
			$("#page_evants .talktext p").text2richtext();  
			//музыка
			$.each(Evants.mus_list, function(key,obj){
				Music.Single.insert("ev_"+obj.ev_id+" .comments_music", obj);
			});
			//мигалка для оповещений
			//$(".ntfy .btn-close").velocity({ opacity: 0.3 },{duration:400, loop: true})
			$(".ntfy .btn-close").off("vclick");
			$(".ntfy .btn-close").on("vclick",Evants.Hide);
			Evants.new_=data.new_;
			NavLefPanel.Ntfy.refresh(); 
			
			//выравниваем плитку по высоте
			if($(window).width()>750){
				for(i=line1; i<=line_num; i++){
					$("#page_evants .line_"+i+" .ui-body").css({height: getMaxHeight($("#page_evants .line_"+i+" .ui-body"))});
				}
			}
			
			if(GLOBAL_APP_VERS.type=="app_mobile"){
				$("#full_vers_link").css({display: "none"});
			}
				
			
		},
		Utils : {
			get_source_index: function(t_key, base){
				var found_i=-1;
				var i=0;
				$.each(Evants.ps_list, function(key, obj){
					//если входящее сообщение из существующего списка то обновляем счетчик
					if(obj.source.num==t_key && obj.base==base){
						found_i=i;
					}
					i++;
				});
				return found_i
			},
			decrease_ntfy_obj : function(source_type, delta){
				if(source_type=="fotos"){
					Evants.new_.fotos=Evants.new_.fotos-delta;
					if(Evants.new_.fotos<0)
						Evants.new_.fotos=0;
				}
				else
				if(source_type=="music"){
					Evants.new_.music=Evants.new_.music-delta;
					if(Evants.new_.music<0)
						Evants.new_.music=0;
				}
				else
				if(source_type=="clips"){
					Evants.new_.clips=Evants.new_.clips-delta;
					if(Evants.new_.clips<0)
						Evants.new_.clips=0;
				}
			},
			increase_ntfy_obj : function(source_type, delta){
				if(source_type=="fotos"){
					if(!Evants.new_.fotos)
						Evants.new_.fotos=delta;
					else
						Evants.new_.fotos=Evants.new_.fotos+delta;
					if(Evants.new_.fotos<0)
						Evants.new_.fotos=0;
				}
				else
				if(source_type=="music"){
					if(!Evants.new_.music)
						Evants.new_.music=delta;
					else
						Evants.new_.music=Evants.new_.music+delta;
					if(Evants.new_.music<0)
						Evants.new_.music=0;
				}
				else
				if(source_type=="clips"){
					if(!Evants.new_.clips)
						Evants.new_.clips=delta;
					else
						Evants.new_.clips=Evants.new_.clips+delta;
					if(Evants.new_.clips<0)
						Evants.new_.clips=0;
				}
			},
			ajax_overlay : function(action){
				if(action == "enable"){
					//$('div.foto').fadeTo('normal',0.5); --тормозит на мобильниках
					$("#page_evants_list .comments_fotos").append('<div class="ajax-overlay"></div>');
				}
				else
				if(action == "disable"){
					//$('div.foto').fadeTo('fast',1);
					$("#page_evants_list .comments_fotos .ajax-overlay").remove();
				}
			},
			HandleAjax : function(action,settings){
				if (settings.url.indexOf("refresh_ui.php")>=0 && settings.url.indexOf("getEvants")>=0){
					if(action=="send"){
						Evants.Utils.ajax_overlay('enable');
					}
					else
					if(action=="stop"){
						Evants.Utils.ajax_overlay('disable');
					}
				}
			},
		},
		onScroll : function(){
			var params=Evants.url_params;
			if(Evants.list.length<Evants.total_all){
				params.last=Evants.list.length;
				params.initial=0;
				Evants.Load(params);
			}
		},
		Like : function(ev){
			ev.preventDefault();
			var ev_id = $(this).attr("ev_id");
			var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: $(this).attr("mark"), method: "putMark"};
			$.get( LS("server/proc_votes.php"), params, 
				function( data ) {
					console.log(data);
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							//Обновляем  оценки
							//Comments.source.rating=data.vote.rating;
							//Comments.source.voted=1; //метим что оценка проставлена
							//Comments.Bar.refresh();	
							$("#ev_"+ev_id+" .footer .btn-like, #ev_"+ev_id+" .footer .btn-unlike").remove();
							$("#ev_"+ev_id+" .footer ul").removeClass("ui-grid-b"); $("#ev_"+ev_id+" .footer ul").addClass("ui-grid-a");
							$("#ev_"+ev_id+" .footer .btn-comments").removeClass("ui-block-c"); $("#ev_"+ev_id+" .footer .btn-comments").addClass("ui-block-b");
							$("#ev_"+ev_id+" .footer ul").prepend('<li class="count-likes ui-block-a"><i class="fa fa-heart fa-lg "></i>: '+data.vote.rating+'</li>')
							console.log(data.vote.rating);							
						}
						else{
							show_popup("fast_ntfy", data.error_text);
						}	
					}
					else{
						Environment.Utils.handle_auth_error();
					}
				},
				"json"
			);
			
		},
		Hide : function(ev){
			ev.preventDefault();
			var ev_id = $(this).attr("ev_id");
			var ev_type = $(this).attr("ev_type");
			var ev_source_type = $(this).attr("ev_source_type");
			var params= {ev_id: ev_id, ev_type: ev_type, method: "hideEvant"};
			Evants.Utils.decrease_ntfy_obj(ev_source_type,1);
			NavLefPanel.Ntfy.refresh();
			$("#ev_"+ev_id).velocity("fadeOut", {duration :1000});
			$.get( LS("refresh_ui.php"), params, 
				function( data ) {
					console.log(data);
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){

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
		
	});
