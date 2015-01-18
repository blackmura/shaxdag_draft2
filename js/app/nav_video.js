Video = new Object({
		Utils : {
			shot : function(path, size){
				if(path.lastIndexOf(".")!=-1){
					if(path.substr(path.lastIndexOf(".")+1)!="jpg" && path.substr(path.lastIndexOf(".")+1)!="jpeg"){
						path+=".jpg";
					}
				}
				else
					path+=".jpg";

				if(size == "small")
					return "http://video.shaxdag.com/shots/small/"+path;
			}
		}
	});
