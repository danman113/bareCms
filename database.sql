SQLite format 3   @     �   
                                                          � -��   ) H�)                                                                                                                                                                                                                                                                                                                                                                                                                                                       �J�stablepagespagesCREATE TABLE pages (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(100), url VARCHAR(100), data TEXT, author INTEGER, date DATETIME, options TEXT,admin INTEGER,cache INTEGER)P++Ytablesqlite_sequencesqlite_sequenceCREATE TABLE sqlite_sequence(name,seq)�5�ItableusersusersCREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(100), info TEXT, password VARCHAR(100), level INTEGER, date DATETIME, options TEXT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 � �                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           	pages   �    	�����fDHD   .
 %# 	Title/hello/therep Hi there!U�F�{}%
  	Title/fgsdfgsdfgfsgU��{} 
  	Title/h1 gelllU�{5{}� �c 		404/404doctype html
html(lang="en")
  head
    title= admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet�m �+ 		admin/admindoctype html
html(lang="en")
  head
    title= admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet')
    script(src='//code.jquery.com/jquery-3.1.0.min.js')

    scr    
  	Absss/absp AbsV2`�{}/
  #	Title/tits/assp GefsV��D{hi:"Fags"}"

  	Title/titsp GefsV�>{}&	
 # 	tex/BallsLook at me!U�6)
{}S
 7%M 	Hello from my website/Hello/therep.
  This is an awesome websiteU�5�?{}&
 # 	tex/HelloLook at me!V�R*{}� ,
 %# 	tex/hello/thereLook at me!U�F�{}%
 # 	tex/fgsdLook at me!V��{}1
  5tex/h1 at me!V�Y{"hi":1469341104470}        ` 	D ��l8���fD �                                                                                                                                                                                                                     �D �Y 		admin/admindoctype html
html(lang="en")
  head
    title= admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet')
    script(src='//code.jquery.com/jquery-3.1.0.min.js')
    script(src='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js')

    script.
   	 
  	Absss/absp AbsV2`�{}/
  #	Title/tits/assp GefsV��D{hi:"Fags"}"

  	Title/titsp GefsV�>{}&	
 # 	tex/BallsLook at me!U�6)
{}S
 7%M 	Hello from my website/Hello/therep.
  This is an awesome websiteU�5�?{}&
 # 	tex/HelloLook at me!V�R*{}� ,
 %# 	tex/hello/thereLook at me!U�F�{}%
 # 	tex/fgsdLook at me!V��{}1
  5tex/h1 at me!V�Y{"hi":1469341104470}             
   
tion(){
        $("#page").submit(function( event ) {
          var elements = $('#page').serializeArray();
          var form = {};
          for(var e in elements){
            form[elements[e].name] = elements[e].value;
          }
          if(form.url[0] != '/')
            form.url = '/'+form.url
          if(form.url[form.url.length-1] == '/' && form.url!='/')
            form.url = form.url.substr(0,form.url.length-1);
          form.date = (new Date()).getTime();
          console.log(form);
          console.log('/pages'+form.url);
          $.ajax({
            url:'/pages'+form.url,
            type:'put',
            data:form,
            success:function(data){
              console.log(data);
              if(data.status)
                window.location.href = '/pages'+form.url;
              else
                alert(data.error);
            },
            error: function(err){
              alert(err);
            }
          });
          event.    '/')
            form.url = form.url.substr(0,form.url.length-1);
          form.date = (new Date()).getTime();
          console.log(form);
          console.log('/pages'+form.url);
          $.ajax({
            url:'/pages'+form.url,
            type:'put',
            data:form,
            success:function(data){
              console.log(data);
              if(data.status)
                window.location.href = '/pages'+form.url;
              else
                alert(data.error);
            },
            error: function(err){
              alert(err);
            }
          });
          event.preventDefault();
        });
      })
  body
    !{ site.admin.nav({site:site}) }
    h1 Build a site
    form#page
      each def,val in {url:'/',title:'Title',options:'{}'}
        input(required type='text' id=val value=def name=val placeholder=val)
        br
      textarea(required id='data' name='data' placeholder='data')
      br
      input(type='submit')V 2L{}   � ��   � #%�G 		admin/�s #%� 		admin/pages/admin/pagesdoctype html
html(lang="en")
  head
    title admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet')
    script(src='//code.jquery.com/jquery-3.1.0.min.js')
  body
    !{site.admin�? �O 		admin/admindoctype html
html(lang="en")
  head
    title= admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet')
    scr� �U 		admin/admindoctype html
html(lang="en")
  head
    title Admin
    !{ site.admin.head({site:site}) }

    script.
      $(function(){
        $("#page").submit(function( event ) {
          var elements = $('#page').serializeArray();
          var form = {};
          for(var e in elements){
            form[elements[e].name] = elements[e].value;
          }
          if(form.url[0] != '/')
            form.url = '/'+form.url
          if(form.url[form.url.length-1] == '/' && form.url!=       � � �tion(){
        $("#page").submit(function( event ) {
          var elements = $('#page').serializeArray();
          var form = {};
          for(var e in elements){
            form[elements[e].name] = �  � 	idads/iddoctype html
html(lang="en")
  head
    title Admin
    !{ site.admin.head({site:site}) }
  body
    h1= page.title
    
    V %��{}� �s 	PORN/porndoctype html
html(lang="en")
  head
    title Admin
    !{ site.admin.head({site:site}) }
  body
    h1 porn!V !�{}� �c 		404/404doctype html
html(lang="en")
  head
    title= admin
    link(href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', rel='stylesheet')
    script(src='//code.jquery.com/jquery-3.1.0.min.js')
  body
    h1 404 :CV�0m{}�_ #%�w 		admin/pages/admin/pagesdoctype html
html(lang="en")
  head
    !{site.admin.head()}
  body
    !{site.admin.nav()}
    each page in pages
        a(href="/pages#{page.url}")= page.title
        brV �{}     form.url!='/')
            form.url = form.url.substr(0,form.url.length-1);
          form.date = (new Date()).getTime();
          console.log(form);
          console.log('/pages'+form.url);
          $.ajax({
            url:'/pages'+form.url,
            type:'put',
            data:form,
            success:function(data){
              console.log(data);
              if(data.status)
                window.location.href = '/pages'+form.url;
              else
                alert(data.error);
            },
            error: function(err){
              alert(err);
            }
          });
          event.preventDefault();
        });
      })
  body
    !{ site.admin.nav() }
    h1 Build a site
    form#page
      each def,val in {url:'/',title:'Title',options:'{}'}
        input(required type='text' id=val value=def name=val placeholder=val)
        br
      textarea(required id='data' name='data' placeholder='data')
      br
      input(type='submit')V �C{}