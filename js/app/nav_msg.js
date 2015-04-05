NavMsg = new Object({
		MsgListObj : Object(), //список диалогов
		ActiveDialogObj : Object(), //активная переписка
		ActiveUser : Object(),
		loading_data : 0,
		D_el_per_page: 32,
		D_total_all : 0,
		D_params: Object(),
		initDialog : function(){
			NavMsg.loading_data=0;
			NavMsg.D_el_per_page=32;
			NavMsg.D_total_all=0;
			NavMsg.ActiveDialogObj = new Object();
			NavMsg.ActiveUser = new Object();
			//очищаем стек выделенных сообщений и добавляем событие на клик
			NavMsg.Utils.stack = new Array();
			$("#page_msg2-trashbutton").css({display : "none"});
			$("#page_msg2-trashbutton i").html("");
			
			NavMsg.D_params = new Object();
			
		},
		GoDialogs : function(){
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_msg") );
			//NavMsg.LoadMsgList(NavMsg.MsgListObj);
		},
		Go : function(){
			var user_id = $(this).attr("user_id");
			NavMsg.OpenDialog(user_id);
		},
		RefreshDialogs : function(){
			var params = {method: "getDialogs"};
			$.get( LS("server/proc_msg.php"), params, 
				function( data ) {
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							NavMsg.LoadMsgList(data.msg_list);
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
		//Полная прорисовка диалога сообщений
		LoadMsgList : function (msgObj){
			//$("#debug_div").append("<br> loading MsgList");
			var i=0;
			var html_count_new=null;
			var li_class;
			NavMsg.MsgListObj=msgObj;
			var html_='<ul data-role="listview" data-count-theme="b"  id="nav-msg-list">';
			$.each(msgObj, function(key, obj){
				if(msgObj[i].message.count_new>0){
					li_class="new";
					html_count_new='<span class="ui-li-count b" style="display: block;">'+ msgObj[i].message.count_new +'</span>';
				}
				else{
					li_class="";
					html_count_new='<span class="ui-li-count" style="display: none;"></span>';
				}
				html_+='<li class="ui-shadow '+li_class+'" id="nav-msg-list-li_'+msgObj[i].user.id+'" user_id="'+msgObj[i].user.id+'">';
				html_+='<img src="'+User.html.avatar_url(msgObj[i].user.foto,60)+'" class="user-avatar-rounded">';
				html_+='<h2>'+User.html.online_status(msgObj[i].user, "tiny")+' '+msgObj[i].user.name+' '+html_count_new;
					if(!msgObj[i].user.online_status.code){
							html_+="<div class='offline-status' style='margin-left: 0em;'>"+msgObj[i].user.online_status.txt+"</div>";
						}
				html_+='</h2>'; 
				html_+='<p>'+ msgObj[i].message.text +'</p>';
				
				html_+='</li>';
				i++;
			});
			
			html_+='</ul>';
			$("#msg-list").html(html_);
			$( "#nav-msg-list" ).listview();
			//привязываем событие на клик
			i=0;
			$.each(msgObj, function(key, obj){
				$( "#nav-msg-list-li_"+msgObj[i].user.id ).off( "vclick");
				$( "#nav-msg-list-li_"+msgObj[i].user.id ).on( "vclick", function(ev){
					ev.preventDefault();
					NavMsg.OpenDialog($(this).attr("user_id"));
					//console.log($(this).attr("user_id"));
				});
				i++;
			});
			//обрабатываем новые сообщения
			NavMsg.Utils.refresh_notification();
		},
		//обработка входящего comet сообщения. объект имеет такую же структуру что и NavMsg.MsgListObj
		RplIncome : function(data){
			var msgObj = new Object();
			//msgObj.sender_user=data.sender_user;
			//msgObj.message=data.msg;
			NavMsg.Utils.process_add(data, "income");
			
			//------------ если открыта страница переписки с пользоваталем то добавляем сообщение
			if($( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id")=="page_msg2"){
				//если сообщение пришло от пользователя с текущего диалога
				if($("#nav-sendmsg-btn").attr("send_to") == data.from.id){
					NavMsg.SingleMessage.Add(data,"prepend");
					//обнуляем счетчик новых сообщений
					NavMsg.MsgListObj[0].message.count_new=0;
					//очищаем оповещение на сервере
					NavMsg.Utils.clearNtfy(data.from.id);
					//добавляем сообщение в массива
					NavMsg.ActiveDialogObj.unshift(data.message);
				}
				else{
					//$('.topmenu-msg').badger('3');
				}
			}
			//озвучиваем сообщение
			Audio_.income_msg.play();
			//обрисовываем список диалогов
			NavMsg.LoadMsgList(NavMsg.MsgListObj);
			
			
		},
		OpenDialog : function(retrievers_id){
			//очищаем предыдущую переписку
			$("#page_msg2 .dialog-msg-list").remove();
			NavMsg.initDialog();
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_msg2") );
			//загружаем данные с сервера и прорисовываем
			NavMsg.D_params={ method: "getMessages", 
							retrievers_id: retrievers_id, 
							initial: 1, 
							el_per_page : NavMsg.D_el_per_page,
							last : 0
							};
			NavMsg.getDialogFromServer(retrievers_id, NavMsg.D_params);
			//обновляем ссылки, кнопки и тд
			$("#nav-sendmsg-btn").attr("send_to", retrievers_id); //меняем парметр кнопки
			$("#page_msg2_attach .share").attr("user_id", retrievers_id); //меняем парметр кнопок share
			//обновляем счетчик
			var obj_index=NavMsg.Utils.get_dialog_index(retrievers_id);
			if(obj_index>=0){
				NavMsg.MsgListObj[obj_index].message.count_new=0;
				NavMsg.LoadMsgList(NavMsg.MsgListObj);
			}
			
		}, 
		getDialogFromServer : function(user_id, params){
			NavMsg.loading_data=1;
			$.get( LS("server/proc_msg.php"), params, 
				function( data ) {
					var sender_user;
					var retruever_user;
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							NavMsg.D_total_all = data.total_all;
							NavMsg.D_params = params;
							NavMsg.ActiveUser = data.retriever_user;
							
							//если первая загрузка
							if(params.initial == 1){
								NavMsg.AppendMsg(data);
								NavMsg.ActiveDialogObj = data.messages;
								NavMsg.Utils.refresh_dropdown_menu();
							}
							//Если запрос отправлен для догрузки сообщений
							else{
								NavMsg.ActiveDialogObj=NavMsg.ActiveDialogObj.concat(data.messages);
								$.each(data.messages,  function (i, message){
									if(data.i_user.id==message.senders_id){
										sender_user= data.i_user;
										retriever_user = data.retriever_user;
									}
									else{
										sender_user= data.retriever_user;
										retriever_user = data.i_user;
									}
									if(i>0){
										if(how_long_time(timestamp2date(message.time)).day!=how_long_time(timestamp2date(data.messages[i-1].time)).day){ //время отправки сообщения
											$("#dialog-msg-list").append("<div class='daysdevider'>"+how_long_time(timestamp2date(message.time)).day+"</div>");
										}
									}
									NavMsg.SingleMessage.Add({message: message, sender_user: sender_user, retriever_user: retriever_user},  "append");
									//console.log(message); 
								}); 
							}
							
						}
						else{
							show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
						}
						
					}
					else{
						Environment.Utils.handle_auth_error();
					}
					NavMsg.loading_data=0;
				},
				"json"
			)
			.fail(function(){
					NavMsg.loading_data=0;
				});
		},
		GoAppendDialog : function(){ //отрабатывает для догрузки данных
			var params=NavMsg.D_params;
			if(NavMsg.ActiveDialogObj.length<NavMsg.D_total_all){
				params.last=NavMsg.ActiveDialogObj.length;
				params.initial=0;
				NavMsg.getDialogFromServer(NavMsg.ActiveUser.id, params);
			}
		},
		//загрузка списка переписки из объекта
		AppendMsg : function(msg_obj){  
			var html_="";
			var i=0;
			var user = new Object();
			html_+='<div  id="dialog-msg-list" class="dialog-msg-list">';
			$.each(msg_obj.messages, function(key,obj){
				if(i>0){
					if(how_long_time(timestamp2date(msg_obj.messages[i].time)).day!=how_long_time(timestamp2date(msg_obj.messages[i-1].time)).day){
						html_+="<div class='daysdevider'>"+how_long_time(timestamp2date(msg_obj.messages[i].time)).day+"</div>";
					}
				}
				html_+=NavMsg.SingleMessage.getHTML(msg_obj.messages[i], msg_obj.i_user, msg_obj.retriever_user);
				i++;
			});
			html_+='</div>';
			
			$("#msg-with-user").append(html_);
			//меняем заголовок страницы
			$("#page_msg2 .topheader h1").html(User.html.online_status(msg_obj.retriever_user,"tiny")+ " "+msg_obj.retriever_user.name);
			$("#page_msg2 .topheader h1").attr("user_id", msg_obj.retriever_user.id);
			//добавляем смайлы и тд к полученной переписке
			$("#page_msg2 .talktext p").text2richtext(); 
			$("#page_msg2 .talk-bubble").on("vclick", NavMsg.Utils.onSelect);
			//Если в обменнике есть готовые ресурсы, то отправляем
			Exch.onReturn();
			
			
		},
		SendMsgHandler : function (send_to){
			var msg_text=$("#nav-msg-txtarea").val();
			//replace emoji
			msg_text = emoji_encode(msg_text); 
			$("#nav-msg-txtarea").val(""); $("#nav-msg-txtarea").css({height: "auto"});
			if(msg_text){
				var fake_num = -1*rand(100000000);
				var fake_dataObj = {sender_user : User.I, retriever_user: NavMsg.ActiveUser, message : NavMsg.SingleMessage.genFakeMsgObj(msg_text, fake_num, User.I, NavMsg.ActiveUser)};
				NavMsg.SingleMessage.Add(fake_dataObj, "prepend");
				var  params = { method: "postMessage", retrievers_id: send_to, "msg" : msg_text, "fake_id" : fake_num, silent_mode: "true"};
				$.get( LS("server/proc_msg.php"),params, 
					function( data ) {
						if(data.auth_status=="success"){
							if(data.method_status=="success"){
							//рисуем диалог
								NavMsg.SingleMessage.Add(data, "before", params.fake_id);
								//обработка обновления спиков диалогов и переписки
								NavMsg.Utils.process_add(data, "outcome");
								//добавляем сообщение в массива
								NavMsg.ActiveDialogObj.unshift(data.message);
								//обновляем диалоги
								NavMsg.LoadMsgList(NavMsg.MsgListObj);
								//звуковое сопровождение
								Audio_.outcome_msg.play();
								
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}
							
						}
						else{ 
							Environment.Utils.handle_auth_error();
						}
							console.log("SendMsgHandler");
					},
					"json"
				);
			}
		},
		SingleMessage : Object({ 
			getHTML : function(singleMsgObj, SenderObj, RetrieverObj){
				var html_="";
				var user = new Object();
				if(singleMsgObj.senders_id==SenderObj.id){
					user=SenderObj;
				}
				else{
					user=RetrieverObj;
				}
				//обработка стилей если фейковые
				if(singleMsgObj.num<0){
					var style_root = "opacity: 0.8";
					var icon_status = '<i class="fa fa-circle-o-notch fa-spin"></i> ';
				}
				else{
					var style_root = "";
					if(singleMsgObj.senders_id == User.I.id)
						var icon_status = '<i class="fa fa-check"></i> ';
					else
						var icon_status="";
				}
				html_+="<div id='msg_"+singleMsgObj.num+"' style='"+style_root+"'>";
				if(user.id==User.I.id){
					html_+='<div style="float:right"><img src="'+User.html.avatar_url(user.foto,60)+'" class="user-avatar-rounded"></div>';
					html_+='<div class="talk-bubble me tri-right round right-in" style="float:right"  msg_id="'+singleMsgObj.num+'">';
					}
				else{
					html_+='<div style="float:left"><img src="'+User.html.avatar_url(user.foto,60)+'" class="user-avatar-rounded"></div>';
					html_+='<div class="talk-bubble another tri-right round left-in" msg_id="'+singleMsgObj.num+'">';
					}
				html_+='		<div class="talktext">';
				html_+='		<div class="options">'+icon_status+how_long_time(timestamp2date(singleMsgObj.time)).msg_label+'</div>';
				html_+='			<p>'+ singleMsgObj.text +'</p>';
				html_+='		</div>';
				html_+='</div>';
				html_+="</div>";
				html_+='<div style="clear:both"></div>';
				return html_;
			},
			Add : function(responseMethodObj, append_type, before_id){
				var new_msg_dom= new Object();
				if(append_type == "prepend"){
					$("#dialog-msg-list").prepend(NavMsg.SingleMessage.getHTML(responseMethodObj.message, responseMethodObj.sender_user, responseMethodObj.retriever_user));
					$.mobile.silentScroll(0);
				}
				else
				if(append_type == "append"){
					$("#dialog-msg-list").append(NavMsg.SingleMessage.getHTML(responseMethodObj.message, responseMethodObj.sender_user, responseMethodObj.retriever_user));
				}
				else
				if(append_type == "before"){
					$(NavMsg.SingleMessage.getHTML(responseMethodObj.message, responseMethodObj.sender_user, responseMethodObj.retriever_user)).insertBefore("#msg_"+before_id);
					$.mobile.silentScroll(0);
					$("#msg_"+before_id).remove();
				}

				new_msg_dom=$("#msg_"+responseMethodObj.message.num+" .talktext p");
				new_msg_dom.text2richtext();
				//добавляем эффект
				clickEffect1($("#msg_"+responseMethodObj.message.num+" .talk-bubble"));
				//обработчики клика на сообщение
				if(responseMethodObj.message.num>0) //если не фейковые
					$("#msg_"+responseMethodObj.message.num+" .talk-bubble").on ( "vclick", NavMsg.Utils.onSelect);
			},
			genFakeMsgObj: function(text, msg_id, SenderObj, RetrieverObj){
				var singleMsgObj = {
					num : msg_id,
					text: text,
					time: getUnixTime(),
					senders_id : SenderObj.id,
					retrievers_id : RetrieverObj.id,
				};
				return singleMsgObj;
			}
		}),
		Delete :{
			//Выполняется при клике на кнопки удаления
			Do: function(){
				var del_type=$(this).attr("del_type"); //dialog - активный диалог с пользоваталем; all - все диалоги; selected - выбранные сообщения диалога
				var params = new Object();
				var error=0;
				if(del_type=="selected"){
					if(NavMsg.Utils.stack.length>0){
						var track_num = NavMsg.Utils.stack.join(",");
					}
					else
						error=1;
					params = {base: "messages", track_num: track_num, del_type : del_type};
				}
				else
				if(del_type=="dialog"){
					params = {base: "messages", track_num: "all", track_num2: $( "#nav-sendmsg-btn").attr("send_to"), del_type : del_type};
				}
				if(!error){
					$.get( LS("server/proc_delete.php"), params, 
						function( data ) {
							if(data.auth_status=="success"){
								if(data.method_status=="success"){
								//обрабатываем успешное удаление
									NavMsg.Delete.Handle(params);
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
			//манипуляция с интерфейсом после успешного удаления с сервера
			Handle : function(params){
				if(params.del_type=="selected"){
					var stack = params.track_num.split(",");
					var i=0;
					for(i=0;i<stack.length;i++){
						$("#msg_"+stack[i]).remove();
						//удаляем из объекта переписки
						var found_msg = NavMsg.Utils.get_message_index(stack[i]);
						if(found_msg>=0){
							NavMsg.ActiveDialogObj.splice(found_msg,1);
						}
						NavMsg.Utils.refresh_MsgList();
					}
					NavMsg.Utils.stack = new Array();
					$("#page_msg2-trashbutton").css({display : "none"});
					$("#page_msg2-trashbutton i").html("");	
					
				}
				else
				if(params.del_type=="dialog"){
					$("#dialog-msg-list").html(""); 
					$("#page_msg2_confirm_delete").popup("close");
					//удаляем из объекта переписки
					NavMsg.ActiveDialogObj = new Object();
					NavMsg.Utils.refresh_MsgList(); 
				}
				//
				NavMsg.LoadMsgList(NavMsg.MsgListObj);
				
			}
			
		},
		Utils : {
			count_new : function(){
				var i=0;
				var total=0;
				$.each(NavMsg.MsgListObj, function(key,obj){
					if(NavMsg.MsgListObj[i].message.count_new>0)
						total=total+parseInt(NavMsg.MsgListObj[i].message.count_new);
					i++;
				});
				return total;
			},
			process_add : function(msgObj, type){
				var found_i = -1;
				var newDialogMsg = new Object();
				if(type=="income"){
					newDialogMsg.user=msgObj.sender_user;
					newDialogMsg.message=msgObj.message;
					newDialogMsg.message.count_new=1;
					if(NavMsg.MsgListObj.length>0){
						found_i = NavMsg.Utils.get_dialog_index(msgObj.sender_user.id);
						if(found_i>=0){
							NavMsg.MsgListObj[found_i].message.count_new++;
							NavMsg.MsgListObj[found_i].message.text=msgObj.message.text;
							//поднимаем диалог вверх
							NavMsg.MsgListObj.unshift(NavMsg.MsgListObj[found_i]);
							NavMsg.MsgListObj.splice(found_i+1,1);
						}
						//иначе добавляем объект в начало массива сообщений
						else{
							NavMsg.MsgListObj.unshift(newDialogMsg);
						}	
					}
					//если список пустой, то добавляем первое сообщение
					else{
						NavMsg.MsgListObj.unshift(newDialogMsg);
					}
				}
				if(type=="outcome"){
					newDialogMsg.user=msgObj.retriever_user;
					newDialogMsg.message=msgObj.message;
					newDialogMsg.message.count_new=0;
					if(NavMsg.MsgListObj.length>0){
						found_i = NavMsg.Utils.get_dialog_index(msgObj.retriever_user.id);
						if(found_i>=0){
							NavMsg.MsgListObj[found_i].message.count_new=0;
							NavMsg.MsgListObj[found_i].message.text=msgObj.message.text;
							//поднимаем диалог вверх
							NavMsg.MsgListObj.unshift(NavMsg.MsgListObj[found_i]);
							NavMsg.MsgListObj.splice(found_i+1,1);
						}
						//иначе добавляем объект в начало массива сообщений
						else{
							NavMsg.MsgListObj.unshift(newDialogMsg);
						}	
					}
					//если список пустой, то добавляем первое сообщение
					else{
						NavMsg.MsgListObj.unshift(newDialogMsg);
					}
				}
			},
			
			refresh_notification: function(){
				NavLefPanel.Ntfy.refresh();
			},
			get_dialog_index: function(user_id){
				var found_i=-1;
				var i=0;
				$.each(NavMsg.MsgListObj, function(key, obj){
					//если входящее сообщение из существующего списка то обновляем счетчик
					if(NavMsg.MsgListObj[i].user.id==user_id){
						found_i=i;
					}
					i++;
				});
				return found_i
			},
			get_message_index: function(msg_num){
				var found_i=-1;
				var i=0;
				$.each(NavMsg.ActiveDialogObj, function(key, obj){
					//если входящее сообщение из существующего списка то обновляем счетчик
					if(obj.num==msg_num){
						found_i=i;
					}
					i++;
				});
				return found_i
			},
			stack : Array(),
			onSelect : function(){ //при клике на textbubble
				var msg_id = $(this).attr("msg_id");
				var stack_pos = -1;
				stack_pos = NavMsg.Utils.stack.indexOf(msg_id);
				//если есть то удаляем
				if(stack_pos>=0){
					NavMsg.Utils.stack.splice(stack_pos,1);
					$("#msg_"+msg_id+" .talk-bubble").removeClass("selected");
				}
				else
				//если нет то добавляем
				{
					NavMsg.Utils.stack.push(msg_id);
					$("#msg_"+msg_id+" .talk-bubble").addClass("selected");
				}
				//рисуем кнопку удаления
				if(NavMsg.Utils.stack.length>0){
					$("#page_msg2-trashbutton").css({display : "inline-block"});
					$("#page_msg2-trashbutton i").html(NavMsg.Utils.stack.length);	
				}
				else{
					$("#page_msg2-trashbutton").css({display : "none"});
					$("#page_msg2-trashbutton i").html("");	
					/*
					//синхронизируем панели
					if($("#page_msg2 div[data-role=header]").toolbar("option", "tapToggle")==false){
						$("#page_msg2 div[data-role=header]").toolbar("option", "tapToggle", true)
						$("#page_msg2 div[data-role=footer]").toolbar("option", "tapToggle", true)
						
					}
					*/
				}
			},
			clearNtfy : function(user_id){	//удаляет оповещения о сообщениях на сервере
				$.get( LS("server/proc_msg.php"), { method: "clearDialogNtfy", retrievers_id: user_id}, 
					function( data ) {
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								console.log("Оповещения на сервере удалены");
								
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
			confirm : function(){ //вызывает окноп подтверждения для удаления всех сообщений
				console.log($(this).attr("option_type"));
				if($(this).attr("option_type")=="delete_all"){
					$("#page_msg2_menu").popup("close");
					setTimeout(function(){$("#page_msg2_confirm_delete").popup("open")},500);
				}
				else
				if($(this).attr("option_type")=="ban"){
					$("#page_msg2_menu").popup("close");
				}
				
			},
			keyPress : {
				last : 0,
				send_handler : function(){
					var press_time = Date.now();
					if((NavMsg.ActiveUser.id>0) && (press_time-NavMsg.Utils.keyPress.last)>2000){ //бльше 1 сек прошло с последней отправки
						NavMsg.Utils.keyPress.last = press_time
						$.get( LS("server/proc_typing.php"), {retrievers_id: NavMsg.ActiveUser.id}, 
							function( data ) {
								if(data.auth_status=="success" ){
									if(data.method_status=="success"){
										console.log("отправка события");
										
									}
									else{
										console.log("ошибка метода");
									}
									
								}
								else{
									console.log("ошибка авторизации");
								}
							},
							"json"
						);
					}
					else
						console.log("Пропускаем");
				},
				rec_handler : function(data){
					if(data.type=="typing"){
						if(($( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id")=="page_msg2") && (NavMsg.ActiveUser.id == data.from.id)){
							$("#page_msg2_typing").css({display : "block"});
							setTimeout(function(){
								$("#page_msg2_typing").css({display : "none"});
							},2000);
						}
					}
				}
			
			},
			refresh_MsgList : function(){ //обновляет список диалогов после манипуляций с активной перепиской
				var user_id = NavMsg.ActiveUser.id;
				var found_i = NavMsg.Utils.get_dialog_index(user_id);
				var total_msg = NavMsg.ActiveDialogObj.length;
				if(found_i>=0){
					if(total_msg>0){
						NavMsg.MsgListObj[found_i].message.text=NavMsg.ActiveDialogObj[0].text;
						
					}
					else{
						NavMsg.MsgListObj.splice(found_i,1);
					}
				}
			},			
			refresh_dropdown_menu: function(){
				var user = NavMsg.ActiveUser;
				
				var html='<li><a href="#page_msg2_confirm_delete" class="delete-all" option_type="delete_all" data-rel="popup" data-position-to="window"><i class="fa fa-trash-o fa-lg"></i>  Удалить все</a></li>';
				if(!user.is_ban)
					html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="add_to_ban"><i class="fa fa-lock fa-lg"></i>  Заблокировать</a></li>';
				else
					html+='<li><a href="#"  class="go-confirm" f_id="'+user.id+'" confirm_type="remove_from_ban"><i class="fa fa-unlock-alt fa-lg"></i>  Разблокировать</a></li>';
				
				$("#page_msg2_menu ul").html(html);
				$("#page_msg2_menu ul").listview();
				$("#page_msg2_menu ul").listview("refresh");
				//обработчики 
				$("#page_msg2_menu .go-confirm").on("click", Environment.Confirm.onShow);
				$("#page_msg2_menu .delete-all").on ("click", NavMsg.Utils.confirm);
				
				
				
				
			}
		}
		
	});
Comments = new Object({ 
		list : Object(), //активная переписка
		source : Object(),
		ActiveUser : Object(),
		loading_data : 0,
		el_per_page: 32,
		total_all : 0,
		params: Object(),
		init : function(){
			Comments.loading_data=0;
			Comments.el_per_page=32;
			Comments.total_all=0;
			Comments.list = new Object();
			Comments.ActiveUser = new Object();
			Comments.Utils.hold_pressed = false;
			//очищаем стек выделенных сообщений и добавляем событие на клик
			Comments.Utils.stack = new Array();
			Comments.params = new Object();
			Comments.Utils.refresh_del_btn();
			Comments.Utils.shown=false;
			//обнуляем форму
			$("#nav-comment-txtarea").val("");
			$("#nav-sendcomment-btn").attr("reply_to","");
			
			
		},
		
		//обработка входящего comet сообщения. 
		RplIncome : function(data){
			
		},
		Go : function(ev){
			ev.preventDefault();
			var base=$(this).attr("base");
			var t_key=$(this).attr("t_key");
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_comment"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_comment?base="+base+"&t_key="+t_key} )
					
		},
		GoParams : function(t_key, base){
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_comment"), { transition: "none", allowSamePageTransition: true, dataUrl: "page_comment?base="+base+"&t_key="+t_key} )
					
		},
		OpenComments : function(t_key, base){
			//очищаем предыдущую переписку
			$("#comments-list").remove();
			Comments.init();
			
			//загружаем данные с сервера и прорисовываем
			Comments.params={ method: "getComments", 
							t_key: t_key, 
							base: base,
							initial: 1, 
							el_per_page : Comments.el_per_page,
							last : 0
							};
			Comments.getCommentsFromServer(Comments.params);
			//обновляем ссылки, кнопки и тд
			$("#nav-sendcomment-btn").attr("t_key", t_key); //меняем парметр кнопки
			$("#nav-sendcomment-btn").attr("base", base); //меняем парметр кнопки
			
			$("#page_comment_attach .share").attr("t_key", t_key); //подставляем параметры  кнопки share
			$("#page_comment_attach .share").attr("base", base); //подставляем параметры  кнопки share
			
		}, 
		getCommentsFromServer : function(params){
			Comments.loading_data=1;
			$.get( LS("server/proc_comments.php"), params, 
				function( data ) {
					console.log(data);
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							Comments.total_all = data.total_all;
							Comments.params = params;
							
							//если первая загрузка
							if(params.initial == 1){
								Comments.list = data.comments;
								Comments.ActiveUser = data.owner_user;
								Comments.source = data.resource;
								Comments.Display(data);
							}
							//Если запрос отправлен для догрузки сообщений
							else{
								Comments.list=Comments.list.concat(data.comments);
								$.each(data.comments,  function (i, comment){
									
									if(i>0){
										if(how_long_time(timestamp2date(comment.time)).day!=how_long_time(timestamp2date(data.comments[i-1].time)).day){ //время отправки сообщения
											$("#comments-list").append("<div class='daysdevider'>"+how_long_time(timestamp2date(comment.time)).day+"</div>");
										}
									}
									Comments.SingleComment.Add({comment: comment},  "append");
									//console.log(message); 
								}); 
							}
							
						}
						else{
							show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
						}
						
					}
					else{
						Environment.Utils.handle_auth_error();
					}
					Comments.loading_data=0;
				},
				"json"
			)
			.fail(function(){
					Comments.loading_data=0;
				});
		},
		GoAppend : function(){ //отрабатывает для догрузки данных
			var params=Comments.params;
			if(Comments.list.length<Comments.total_all){
				params.last=Comments.list.length;
				params.initial=0;
				Comments.getCommentsFromServer(params);
			}
		},
		//визуализация комментариев при первой загрузке
		Display : function(data){   
			var html_="";
			var i=0;
			var user = new Object();
			Comments.Utils.refresh_dropdown_menu();
			//ресурс-----------
			$("#comments-source").removeClass("music");
			$("#comments-source").removeClass("fotos");
			$("#comments-source").removeClass("clips");
			//фотки
			if((data.resource.base == "fotos") || (data.resource.base == "users_fotos")){
				$("#comments-source").addClass("foto");
				html_="<div class='comments-foto'><img src='" +Fotos.Utils.foto_url(data.resource,800)+"'><div class='overlay'><i class='fa fa fa-chevron-circle-down'></i></div></div>";
				$("#comments-source").html(html_);
				$("#comments-source .comments-foto").off("vclick");
				$("#comments-source .comments-foto").on("vclick", Comments.Utils.onShow);
			}
			//музыка
			if((data.resource.base == "music")){
				$("#comments-source").addClass("music");
				Music.init();
				Music.Single.insert("comments-source", data.resource);
			}
			//видео
			if((data.resource.base == "clips")){
				$("#comments-source").addClass("clips");
				if(data.resource.yt==1)
					html_='<iframe class="youtube-player" type="text/html" width="560" height="315" src="http://www.youtube.com/embed/'+data.resource.path+'" frameborder="0"></iframe>';
				else
					html_='<h2>Просмотр этого видео доступно только в полной версии</h2>';
				$("#comments-source").html(html_);
			}
			//панель
			Comments.Bar.refresh();
			
			//лист комментариев--------
			html_='<div  id="comments-list">';
			if(!data.comments.length){
				html_+="<div class='no-data-info'>Станьте первым, кто напишет здесь комментарий.</div>";
			}
			else{
				$.each(data.comments, function(key,comment){ 
					if(i>0){
						if(how_long_time(timestamp2date(data.comments[i].time)).day!=how_long_time(timestamp2date(data.comments[i-1].time)).day){
							html_+="<div class='daysdevider'>"+how_long_time(timestamp2date(data.comments[i].time)).day+"</div>";
						}
					}
					html_+=Comments.SingleComment.getHTML(comment);
					i++;
				});
			}
			html_+='</div>';
			
			$("#comments-div").html(html_);
			//меняем заголовок страницы
			$("#page_comment .topheader h1").html(User.html.online_status(data.owner_user,"tiny")+ " "+data.owner_user.name);
			$("#page_comment .topheader h1").attr("user_id", data.owner_user.id);
			//добавляем смайлы и тд к полученной переписке
			$("#page_comment .talktext p").text2richtext(); 
			$("#page_comment .talk-bubble").off("taphold");
			$("#page_comment .talk-bubble").off("vclick");
			$("#page_comment .talk-bubble").on("taphold", Comments.Utils.onHold);
			$("#page_comment .talk-bubble").on("vclick", Comments.Utils.onSelect);
			//gпереход на страницу пользователя
			$("#comments-list .user-avatar-rounded").off("vclick");
			$("#comments-list .user-avatar-rounded").on("vclick", UserPage.Go); 
			//Если в обменнике есть готовые ресурсы, то отправляем
			Exch.onReturn();

		},
		SendCommentHandler : function (ev){
			ev.preventDefault();
			var t_key = $(this).attr("t_key");
			var base = $(this).attr("base");
			var reply_to = $(this).attr("reply_to");
			Comments.SendCommentHandlerParams(t_key, base, reply_to);
		},
		SendCommentHandlerParams : function (t_key, base, reply_to){

			var msg_text=$("#nav-comment-txtarea").val();		
			
			if(msg_text){
				var fake_num = -1*rand(100000000);
				var fake_dataObj = {comment : Comments.SingleComment.genFakeCommObj(msg_text, fake_num, User.I)};
				Comments.SingleComment.Add(fake_dataObj, "prepend");
				var params = {
					method: "postComment",
					msg: msg_text,
					t_key: t_key,
					base: base,
					reply_to: reply_to,
					"fake_id" : fake_num, 
					silent_mode: "true"
				};
				$.get( LS("server/proc_comments.php"), params, 
					function( data ) {
						if(data.auth_status=="success"){
							if(data.method_status=="success"){
							//рисуем диалог
								Comments.SingleComment.Add(data, "before", params.fake_id);
								//обработка обновления спиков диалогов и переписки
								Comments.Utils.process_add(data, "outcome");
								//добавляем сообщение в массива
								Comments.list.unshift(data.comment);
								//звуковое сопровождение
								Audio_.outcome_msg.play();
								console.log("SendCommentHandlerHandler. Получен ответ " + JSON.stringify(data));	
							}
							else{
								show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
							}
							
						}
						else{ 
							Environment.Utils.handle_auth_error();
						}
							console.log("SendMsgHandler");
					},
					"json"
				);
			}
		},
		Like : function(ev){
			ev.preventDefault();
			var params= {base: $(this).attr("base"), t_key: $(this).attr("t_key"), value: $(this).attr("mark"), method: "putMark"};
			$.get( LS("server/proc_votes.php"), params, 
				function( data ) {
					console.log(data);
					if(data.auth_status=="success" ){
						if(data.method_status=="success"){
							//Обновляем  оценки
							Comments.source.rating=data.vote.rating;
							Comments.source.voted=1; //метим что оценка проставлена
							Comments.Bar.refresh();			
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
		SingleComment : Object({ 
			getHTML : function(comment){
				var html_="";
				//обработка стилей если фейковые
				if(comment.num<0){
					var style_root = "opacity: 0.8";
					var icon_status = '<i class="fa fa-circle-o-notch fa-spin"></i> ';
				}
				else{
					var style_root = "";
					if(comment.user.id == User.I.id)
						var icon_status = '<i class="fa fa-check"></i> ';
					else
						var icon_status="";
				}
				html_+="<div id='comment_"+comment.num+"' style='"+style_root+"'>";
				if(comment.user.id==User.I.id){
					html_+='<div style="float:right"><img src="'+User.html.avatar_url(comment.user.foto,60)+'" user_id = "'+comment.user.id+'" class="user-avatar-rounded"></div>';
					html_+='<div class="talk-bubble me tri-right round right-in" style="float:right"  user_id ="'+comment.user.id+'" name ="'+comment.user.name+'" comment_id="'+comment.num+'">';
					}
				else{
					html_+='<div style="float:left"><img src="'+User.html.avatar_url(comment.user.foto,60)+'" user_id = "'+comment.user.id+'" class="user-avatar-rounded"></div>';
					html_+='<div class="talk-bubble another tri-right round left-in" user_id ="'+comment.user.id+'" name ="'+comment.user.name+'" comment_id="'+comment.num+'">';
					}
				html_+='		<div class="talktext">';
				html_+='		<div class="options">'+icon_status+User.html.online_status(comment.user, "tiny")+" "+ User.html.gender(comment.user)+ ' <b>'+comment.user.name+'</b> '+how_long_time(timestamp2date(comment.time)).msg_label+'</div>';
				html_+='			<p>'+ comment.text +'</p>';
				html_+='		</div>';
				html_+='</div>';
				html_+="</div>";
				html_+='<div style="clear:both"></div>';
				return html_;
			},
			Add : function(data, append_type, before_id){
				var new_msg_dom= new Object();
				if(append_type == "prepend"){
					$("#comments-list").prepend(Comments.SingleComment.getHTML(data.comment));
					$.mobile.silentScroll(0);
					//добавляем эффект
					clickEffect1($("#comment_"+data.comment.num+" .talk-bubble"));
				}
				else
				if(append_type == "append"){
					$("#comments-list").append(Comments.SingleComment.getHTML(data.comment));
				}
				else
				if(append_type == "before"){
					$(Comments.SingleComment.getHTML(data.comment)).insertBefore("#comment_"+before_id);
					$.mobile.silentScroll(0);
					$("#comment_"+before_id).remove();
				}

				new_msg_dom=$("#comment_"+data.comment.num+" .talktext p");
				new_msg_dom.text2richtext();				
				//обработчики клика на сообщение
				if(data.comment.num>0){
					$("#comment_"+data.comment.num+" .talk-bubble").on("taphold", Comments.Utils.onHold);
					$("#comment_"+data.comment.num+" .talk-bubble").on ( "vclick", Comments.Utils.onSelect);
					$("#comments-list .user-avatar-rounded").off("vclick");
					$("#comments-list .user-avatar-rounded").on("vclick", UserPage.Go); 
				}
				
			},
			genFakeCommObj: function(text, comm_id, user){
				var singleMsgObj = {
					num : comm_id,
					text: text,
					time: getUnixTime(),
					user : user
				};
				return singleMsgObj;
			}
		}),
		Delete :{
			//Выполняется при клике на кнопки удаления
			Do: function(ev){
				ev.preventDefault();
				var del_type=$(this).attr("del_type"); //all - все сообщения; selected - выбранные сообщения диалога
				var params = new Object();
				var error=0;
				var base;
				if(Comments.source.base == "users_fotos")
					base="comments2";
				else
					base="comments";
				// определяем параметры запроса
				if(del_type=="selected"){
					if(Comments.Utils.stack.length>0){
						var track_num = Comments.Utils.stack.join(",");
					}
					else
						error=1;
					params = {base: base, track_num: track_num, del_type : del_type};
				}
				if(!error){
					$.get( LS("server/proc_delete.php"), params, 
						function( data ) {
							if(data.auth_status=="success"){
								if(data.method_status=="success"){
								//обрабатываем успешное удаление
									Comments.Delete.Handle(params);
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
			//манипуляция с интерфейсом после успешного удаления с сервера
			Handle : function(params){
				if(params.del_type=="selected"){
					var stack = params.track_num.split(",");
					var i=0;
					//уменьшаем число комментариев
					Comments.source.comments = Comments.source.comments - stack.length;
					for(i=0;i<stack.length;i++){
						$("#comment_"+stack[i]).remove();
						//удаляем из объекта переписки
						var found_msg = Comments.Utils.get_comment_index(stack[i]);
						if(found_msg>=0){
							Comments.list.splice(found_msg,1);
						}
					}
					Comments.Utils.stack = new Array();
					$("#page_comment-trashbutton").css({display : "none"});
					$("#page_comment-trashbutton i").html("");	
				}
				else
				if(params.del_type=="all"){
					$("#comments-list").html(""); 
					//удаляем из объекта переписки
					Comments.list = new Array();
				}
				Comments.Bar.refresh();
			},
			All :{
				Go : function(ev){
					ev.preventDefault();
					
				},
				Send : function(t_key, base2){
					var params = new Object();
					var base;
					if(base2 == "users_fotos")
						base="comments2";
					else
						base="comments";
					params = {base: base, track_num: "all", base2: base2, track_num2: t_key, del_type: "all"};
					
					$.get( LS("server/proc_delete.php"), params, 
						function( data ) {
							if(data.auth_status=="success"){
								if(data.method_status=="success"){
								//обрабатываем успешное удаление
									Comments.Delete.Handle(params);
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
			
		},
		
		Bar : {
			refresh : function(){
				var source = Comments.source;
				//сколько комментов
				if(source.comments>0){
					$("#comments-content span.comments").html(source.comments); 
				}
				else{
					$("#comments-content span.comments").html("");
				}
					
				//сколько лайков
				if(source.rating){
					$("#comments-content span.rating").html('<i class="fa fa-heart-o"></i>: ' + source.rating);
				}
				else{
					$("#comments-content span.rating").html("");
				}
				//скачать для музыки
				if(source.base=="music" && GLOBAL_APP_VERS.type == "web_mobile"){
					$("#comments-content .btn-download").show();
					$("#comments-content .btn-download").attr("href", L(GLOBAL_SERVER+"check_key.php?s_pair=1&base=music&num="+source.num+"&id="+User.I.id));
					$("#comments-content .btn-download").on("vclick", function(){rotateEffect1($(this));});
				}
				else
				if(source.base=="music" && GLOBAL_APP_VERS.type == "app_mobile"){
					if (device.platform == 'android' || device.platform == 'Android') {
						$("#comments-content .btn-download").show();
						$("#comments-content .btn-download").attr("d_url", L(GLOBAL_SERVER+"check_key.php?s_pair=1&base=music&num="+source.num+"&id="+User.I.id));
						$("#comments-content .btn-download").attr("filename", source.artist+" - "+source.title);
						$("#comments-content .btn-download").on("vclick", function(){
							rotateEffect1($(this));
							app.Download.music($(this).attr("d_url"), $(this).attr("filename"));
							}
						);
					}
					
				}
				else{
					$("#comments-content .btn-download").hide();
					$("#comments-content .btn-download").off("vclick");
				}
				//добавляем атрибуты к ссылке
				$("#comments-content .btn-like, #comments-content .btn-unlike, #comments-content span.rating").attr("t_key", source.num);//like
				$("#comments-content .btn-like, #comments-content .btn-unlike, #comments-content span.rating").attr("base", source.base);//like
				$("#comments-content .btn-like").attr("mark", "plus");//like
				$("#comments-content .btn-unlike").attr("mark", "minus");//like

				//Лайк
				$("#comments-content .btn-like, #comments-content .btn-unlike").off("vclick");
				if(!source.voted)
					$("#comments-content .btn-like, #comments-content .btn-unlike").on("vclick", Comments.Like); 
				//Сколько лайков
				$("#comments-content span.rating").off("vclick");
				if(source.rating!=0)
					$("#comments-content span.rating").on("vclick", Comments.Utils.onShowVotes);
			}
			
		},
		Utils : { 
			hold_pressed: false,
			shown : false,
			process_add : function(msgObj, type){
				$("#nav-comment-txtarea").val("");
				$("#nav-comment-txtarea").css({height: "auto"});
				$("#nav-sendcomment-btn").attr("reply_to","");
				Comments.source.comments++;
				Comments.Bar.refresh();
			},
			
			refresh_notification: function(){
				
			},
			refresh_del_btn : function(){
				//рисуем кнопку удаления
				if(Comments.Utils.stack.length>0){
					$("#page_comment-trashbutton").css({display : "inline-block"});
					$("#page_comment-trashbutton i").html(Comments.Utils.stack.length);	
				}
				else{
					$("#page_comment-trashbutton").css({display : "none"});
					$("#page_comment-trashbutton i").html("");	
					//выходим из режима удаления
					Comments.Utils.hold_pressed=false;
				}
			},
			get_comment_index: function(msg_num){
				var found_i=-1;
				var i=0;
				$.each(Comments.list, function(key, obj){
					//если входящее сообщение из существующего списка то обновляем счетчик
					if(obj.num==msg_num){
						found_i=i;
					}
					i++;
				});
				return found_i
			},
			stack : Array(),
			//если нажали и держим
			onHold : function(){
				var comment_id =$(this).attr("comment_id");
				//если это первое нажатие, то переходим в режим удаления
				if(!Comments.Utils.hold_pressed){
					if(Comments.list[Comments.Utils.get_comment_index(comment_id)].user.id == User.I.id || Comments.ActiveUser.id == User.I.id ){
						console.log("перешли в режим удаления");
						Comments.Utils.hold_pressed=true;
					}
				}
			},
			onSelect : function(ev){ //при клике на textbubble
				ev.preventDefault(); 
				var comment_id = $(this).attr("comment_id");
				var stack_pos = -1;
				//если мы в режиме удаления, то выделяем для удаления
				if(Comments.Utils.hold_pressed && (Comments.list[Comments.Utils.get_comment_index(comment_id)].user.id == User.I.id || Comments.ActiveUser.id == User.I.id)){
					console.log("выделил для удаления");
					stack_pos = Comments.Utils.stack.indexOf(comment_id);
					//если есть то удаляем
					if(stack_pos>=0){
						Comments.Utils.stack.splice(stack_pos,1);
						$("#comment_"+comment_id+" .talk-bubble").removeClass("selected");
					}
					else
					//если нет то добавляем
					{
						Comments.Utils.stack.push(comment_id);
						$("#comment_"+comment_id+" .talk-bubble").addClass("selected");
					}
					Comments.Utils.refresh_del_btn();
				}
				else{
					console.log("клик для ответа");
					clickEffect1($(this)); 
					var reply_to = $(this).attr("user_id");
					var name = $(this).attr("name");
					if(reply_to!=User.I.id){
						$("#nav-sendcomment-btn").attr("reply_to",  reply_to);
						$("#nav-comment-txtarea").val(name+", ");	
					}					
				}
				
			},
			
			onShow : function(ev){
				ev.preventDefault();
				var h = $(".comments-foto img").height();
				if(!Comments.Utils.shown){
					$(".comments-foto").velocity({height: h},400)
					Comments.Utils.shown = true;
					$(".comments-foto .overlay").html('<i class="fa fa fa-chevron-circle-up"></i>');
				}
				else{
					$(".comments-foto").velocity({height: "5em"},200)
					Comments.Utils.shown = false;
					$(".comments-foto .overlay").html('<i class="fa fa fa-chevron-circle-down"></i>');
				}
				
			},
			onShowVotes : function(ev){
				ev.preventDefault();
				var base= $(this).attr("base");
				var t_key= $(this).attr("t_key");
				var page_id= $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id");
				Environment.ShowVotes(base,t_key,page_id);
			},
			refresh_dropdown_menu: function(){
				var user = Comments.ActiveUser;
				if(user.id ==User.I.id){
					var html='<li><a href="#"  class="go-confirm" base="'+Comments.source.base+'" t_key="'+Comments.source.num+'" confirm_type="delete_all_comments"><i class="fa fa-trash-o fa-lg"></i>  Удалить комментарии</a></li>' +
						'<li><a href="#"  class="go-confirm" base="'+Comments.source.base+'" t_key="'+Comments.source.num+'" confirm_type="delete_source"><i class="fa fa-times fa-lg"></i>  Удалить ресурс</a></li>'
				}
				else{
					var html='' +
						'<li><a href="#"  class="go-confirm" base="'+Comments.source.base+'" t_key="'+Comments.source.num+'" confirm_type="send_complaint"><i class="fa fa-gavel fa-lg"></i>  Пожаловаться</a></li>'
					;
				}
				$("#page_comment_menu ul").html(html);
				$("#page_comment_menu ul").listview();
				$("#page_comment_menu ul").listview("refresh");
				//обработчики 
				$("#page_comment_menu .go-confirm").on("vclick", Environment.Confirm.onShow);
			},
			send_complaint : function(t_key, base){
				var params= {t_key: t_key, base: base, method: "send_complaint"};
				$.get( LS("server/proc_source.php"), params, 
					function( data ) {
						if(data.auth_status=="success" ){
							if(data.method_status=="success"){
								show_popup("fast_ntfy", "<b>Жалоба отправлена администраторам.</b> Она будет рассмотрена в течение 24 часов.<p>Спасибо за участие!</p>");					
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
