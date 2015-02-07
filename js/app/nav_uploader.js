Uploader = new Object({
		list : Array(),
		current : Object(),
		upload_type: 0, //"fotos" - fotogallery "users_fotos", "music", "clips"
		init : function(upload_type){
			Uploader.list = new Array();
			Uploader.current = new Object();
			Uploader.upload_type=upload_type;
		},
		Display : function(){
			$( ":mobile-pagecontainer" ).pagecontainer( "change", $("#page_upload"), { transition: "none"} );
			$("#page_upload .loaded").html("");
			//���� ���������� ��� �������
			if(Uploader.upload_type == "fotos"){
				$("#page_upload .uploader").collapsible("expand");
				Uploader.Fotos.refresh_upload_form();
				
			}
			else
			//���� ���������� ��� ������
			if(Uploader.upload_type == "users_fotos"){
				$("#page_upload .uploader").collapsible("expand");
				Uploader.Users_Fotos.refresh_upload_form();
				
			}
		},
		Upload : function(ev){
			ev.preventDefault();
			//�������� ����������
			if(Uploader.upload_type=="fotos"){
				var title = $("#uploader_fotos_title").val();
				var album = $("#uploader_fotos_album").val();
				var nation = $("#uploader_fotos_nation").val();
				var params = {method: "uploadFotos", title: title, album: album, nation: nation, id: Uploader.current.id};
				if(!Uploader.current.id){
					show_popup("message_not_sent", "�������� ���������� ��� ��������", $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
				}
				else
				if(!album){
					show_popup("message_not_sent", "�������� ������ ��� ����������", $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
				}
				else
				if(!nation){
					show_popup("message_not_sent", "�������� ����������, � ������� ��������� ������ ����������", $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
				}
				else{
					$("#page_upload .uploader .btn-save").css({display: "none"});
					//��������� ���������� � ������ � �����������
					$.get( LS("server/proc_upload.php"), params, 
						function( data ) {
							var html="";
							if(data.auth_status=="success" ){
								if(data.method_status=="success"){
									$("#page_upload .uploader").collapsible("collapse");
									Uploader.Fotos.refresh_upload_form();
									//html ��� ����������� ����������
									html+="<div class='foto num_"+data.foto.num+"'>";
									html+="<a href='"+User.html.fotos_url(data.foto.path, data.foto.private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(data.foto.path, data.foto.private_foto, "small")+"'></a>";
									html+="<div class='btn-delete'><button num='"+data.foto.num+"' base='"+Uploader.upload_type+"' class='ui-btn ui-icon-delete ui-btn-icon-left ui-mini'>�������</button></div>";
									html+="</div>";
									$("#page_upload .loaded").append(html);
									clickEffect1($("#page_upload .loaded .num_"+data.foto.num)); 
									Uploader.list.push({base: Uploader.upload_type, user : User.I, source: data.foto});
									Uploader.current=null;
									$("#page_upload .counter span").html(Uploader.list.length);									
									PS.ReCreate($("#page_upload .loaded .foto a"), Uploader.list, null);
									//���������� ��������
									$("#page_upload .loaded .num_"+data.foto.num+" .btn-delete button").on("vclick",Fotos.link.Delete);
									//����������� ���������
									show_popup("fast_ntfy", "���������� �������� � ����� ������� ����� �������� ������������.", null);
								}
								else{
									show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
								}
								
							}
							else{
								Environment.Utils.handle_auth_error();
							}
							$("#page_upload .uploader .btn-save").css({display: "block"});
						},
						"json"
					);
				}
				
			}
			else
			//�������� ����������
			if(Uploader.upload_type=="users_fotos"){
				var title = $("#uploader_fotos_title").val();
				var params = {method: "uploadUsersFotos", title: title,  id: Uploader.current.id};
				if(!Uploader.current.id){
					show_popup("message_not_sent", "�������� ���������� ��� ��������", $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
				}				
				else{
					$("#page_upload .uploader .btn-save").css({display: "none"});
					//��������� ���������� � ������ � �����������
					$.get( LS("server/proc_upload.php"), params, 
						function( data ) {
							var html="";
							if(data.auth_status=="success" ){
								if(data.method_status=="success"){
									$("#page_upload .uploader").collapsible("collapse");
									Uploader.Users_Fotos.refresh_upload_form();
									//html ��� ����������� ����������
									html+="<div class='foto num_"+data.foto.num+"'>";
									html+="<a href='"+User.html.fotos_url(data.foto.path, data.foto.private_foto, "full")+"' rel='external'><img src='"+User.html.fotos_url(data.foto.path, data.foto.private_foto, "small")+"'></a>";
									html+="<div class='btn-delete'><button num='"+data.foto.num+"' base='"+Uploader.upload_type+"' class='ui-btn ui-icon-delete ui-btn-icon-left ui-mini'>�������</button></div>";
									html+="</div>";
									$("#page_upload .loaded").append(html);
									clickEffect1($("#page_upload .loaded .num_"+data.foto.num)); 
									Uploader.list.push({base: Uploader.upload_type, user : User.I, source: data.foto});
									Uploader.current=null;
									$("#page_upload .counter span").html(Uploader.list.length);									
									PS.ReCreate($("#page_upload .loaded .foto a"), Uploader.list, null);
									//���������� ��������
									$("#page_upload .loaded .num_"+data.foto.num+" .btn-delete button").on("vclick",Fotos.link.Delete);
								}
								else{
									show_popup("message_not_sent", data.error_text, $( ":mobile-pagecontainer" ).pagecontainer( "getActivePage" ).attr("id"));
								}
								
							}
							else{
								Environment.Utils.handle_auth_error();
							}
							$("#page_upload .uploader .btn-save").css({display: "block"});
						},
						"json"
					);
				}
				
			}
		},
		Fotos : {
			refresh_upload_form : function(){
				$("#page_upload .uploader p").html(Uploader.Fotos.html.uploadForm());	
				$("#page_upload .uploader p").trigger("create");				
				//UserList.link.refresh_nation_selectmenu_sp($("#uploader_fotos_nation"));	
				$("#uploader_fotos_nation").html(Environment.Nations.nations_selectmenu(User.I.nation_id));
				$("#uploader_fotos_nation").selectmenu("refresh", true);
				$("#page_upload .uploader .btn-save").off("vclick");
				$("#page_upload .uploader .btn-save").on("vclick", Uploader.Upload);
				$("#page_upload .uploader .btn-save").css({display: "block"});
				if(GLOBAL_APP_VERS.type =="web_mobile"){
					clickEffect1($("#page_upload .upload-btn"));
					$("#page_upload .upload-btn input").off("change");
					$("#page_upload .upload-btn input").on("change", Uploader.Fotos.Preview);
				}
				else
				if(GLOBAL_APP_VERS.type =="app_mobile"){
					clickEffect1($("#page_upload .upload-btn"));
					$("#page_upload .upload-btn input").remove();
					$("#page_upload .upload-btn").attr("upload_type",1);
					$("#page_upload .upload-btn").off("vclick");
					$("#page_upload .upload-btn").on("vclick", app.CameraTrans.onBtnExplore);
					
				}
			},
			html : {
				uploadForm : function(){
					var html;
					html="";
					html+='<div class="preview"><div class="preview-src"><img src=""></div><i class="fa fa-camera"></i><div class="upload-btn">�������� ���������� <input  type="file"  accept="image/jpeg,image/png,image/gif" /></div></div>';
					html+='<div class="options">'; 
					html+='<textarea rows=2  id="uploader_fotos_title" placeholder="�������� ����� ����������"></textarea>';
					
					html+='<select data-native-menu="false" id="uploader_fotos_album">';
					html+='<option value="" data-placeholder="true">�������� ������</option>';
					html+='<option value="1" >����</option>';
					html+='<option value="2" >��������</option>';
					html+='<option value="3" >�������</option>';
					html+='<option value="4" >�������</option>';
					html+='</select>';
					
					html+='<select data-native-menu="false" id="uploader_fotos_nation">';
					html+='<option value="" data-placeholder="true">�������� ����������</option>';
					html+='</select>';
					html+='<button class="ui-btn ui-icon-check ui-btn-icon-left btn-save" >���������</button>';
					html+='</div>';
					return html;
					
				}
			},
			Preview : function(ev){
				var	len = this.files.length; 
				var file;				
				var formdata = new FormData();
				for ( i=0; i < len; i++ ) {
					file = this.files[i];
					console.log(this.files[i]);
					//alert(JSON.stringify(file));
					
					if (formdata) {
						formdata.append("userfile", file);
						formdata.append("method", "savePicture");
						//�������� ������ ���������� �� ������ ��������
						$("#page_upload .uploader .btn-save").css({display: "none"});
						$.ajax({
							url: LS("server/proc_preview.php"),
							type: "POST",
							data: formdata,
							processData: false,
							contentType: false,
							success: function (res) {
								var data;
								console.log(res);
								data = JSON.parse(res); 
								if(data.auth_status == "success"){	
									if(data.method_status == "success"){
										//��������� id ������� ���������� � ����������� ������
										Uploader.current ={id : data.num, src : data.src};
										$("#page_upload .uploader .preview i").css({display: "none"}); 
										$("#page_upload .uploader .preview .preview-src img").attr("src", User.html.preview_url("large_800/"+data.src, "fotos"));
										$("#page_upload .uploader .preview .preview-src").css({display: "block"});
										//���������� ������ �����
										$("#page_upload .uploader .btn-save").css({display: "block"}); 
									
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
			}
			
		},
		Users_Fotos : {
			refresh_upload_form : function(){
				$("#page_upload .uploader p").html(Uploader.Users_Fotos.html.uploadForm());	
				$("#page_upload .uploader p").trigger("create");				
				$("#page_upload .uploader .btn-save").off("vclick");
				$("#page_upload .uploader .btn-save").on("vclick", Uploader.Upload);
				$("#page_upload .uploader .btn-save").css({display: "block"});
				
				if(GLOBAL_APP_VERS.type =="web_mobile"){
					clickEffect1($("#page_upload .upload-btn"));
					$("#page_upload .upload-btn input").off("change");
					$("#page_upload .upload-btn input").on("change", Uploader.Fotos.Preview);
				}
				else
				if(GLOBAL_APP_VERS.type =="app_mobile"){
					$("#page_upload .upload-btn input").remove();
					clickEffect1($("#page_upload .upload-btn"));
					$("#page_upload .upload-btn").attr("upload_type",1);
					$("#page_upload .upload-btn").off("vclick");
					$("#page_upload .upload-btn").on("vclick", app.CameraTrans.onBtnExplore);
					
				}
			},
			html : {
				uploadForm : function(){
					var html;
					html="";
					html+='<div class="preview"><div class="preview-src"><img src=""></div><i class="fa fa-camera"></i><div class="upload-btn">�������� ���������� <input  type="file"  accept="image/jpeg,image/png,image/gif" /></div></div>';
					html+='<div class="options">'; 
					html+='<textarea rows=2  id="uploader_fotos_title" placeholder="�������� ����� ����������"></textarea>';
																			
					html+='<button class="ui-btn ui-icon-check ui-btn-icon-left btn-save" >���������</button>';
					html+='</div>';
					return html;
					
				}
			},
			Preview : function(ev){
				var	len = this.files.length; 
				var file;				
				var formdata = new FormData();
				for ( i=0; i < len; i++ ) {
					file = this.files[i];
					console.log(this.files[i]);
					//alert(JSON.stringify(file));

					if (formdata) {
						formdata.append("userfile", file);
						formdata.append("method", "savePicture");
						//�������� ������ ���������� �� ������ ��������
						$("#page_upload .uploader .btn-save").css({display: "none"});
						$.ajax({
							url: LS("server/proc_preview.php"),
							type: "POST",
							data: formdata,
							processData: false,
							contentType: false,
							success: function (res) {
								var data;
								console.log(res);
								data = JSON.parse(res); 
								if(data.auth_status == "success"){	
									if(data.method_status == "success"){
										//��������� id ������� ���������� � ����������� ������
										Uploader.current ={id : data.num, src : data.src};
										$("#page_upload .uploader .preview i").css({display: "none"}); 
										$("#page_upload .uploader .preview .preview-src img").attr("src", User.html.preview_url("large_800/"+data.src, "fotos"));
										$("#page_upload .uploader .preview .preview-src").css({display: "block"}); 
										//���������� ������ �����
										$("#page_upload .uploader .btn-save").css({display: "block"}); 
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
			}
		},
		Utils :{
			get_list_index: function(num){
				var found_i=-1;
				$.each(Uploader.list, function(key, obj){
					if(obj.source.num==num){
						found_i=key;
					}
				});
				return found_i
			}
		}
		
	});
